import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import pool from './db.js';
import { migrate } from './migrate.js';
import { FREE_LIMIT_PER_CATEGORY, isAdmin } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseRequire = createRequire(import.meta.url);
const require = (id) => {
  const mod = baseRequire(id);
  return (mod && mod.__esModule && mod.default) ? mod.default : (mod?.default || mod);
};
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Initialize Google OAuth Client
const oauthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
);

// Enable CORS for Vite frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Chrome DevTools & Favicon silencers
app.get('/.well-known/{*splat}', (req, res) => res.status(204).end());
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Helper: Extract authenticated user from cookie or Authorization header
const getUserFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      isAdmin: isAdmin(decoded.email),
    };
  } catch {
    return null;
  }
};

const getUserIdFromRequest = (req) => {
  const user = getUserFromRequest(req);
  return user ? user.id : null;
};

// Ensure database tables & migrations exist at startup
try {
  await migrate();
} catch (migErr) {
  console.error('Migration init warning:', migErr.message);
}

// Root route
app.get('/', (req, res) => {
  res.send('CodePath API is running. <a href="/api/auth/google">Sign in with Google</a>');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// ================= AUTHENTICATION ROUTES =================

app.get('/api/auth/google', (req, res) => {
  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(authUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Authorization code missing');

  try {
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatarUrl } = payload;

    const upsertQuery = `
      INSERT INTO users (google_id, email, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET
        google_id = EXCLUDED.google_id,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url
      RETURNING id, name, email, avatar_url, role;
    `;
    const userResult = await pool.query(upsertQuery, [googleId, email, name, avatarUrl]);
    const user = userResult.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    if (isProduction) {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'lax';
    } else {
      cookieOptions.secure = false;
    }

    res.cookie('token', token, cookieOptions);

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/me', async (req, res) => {
  const userPayload = getUserFromRequest(req);
  if (!userPayload) return res.status(401).json({ authenticated: false });

  try {
    const userResult = await pool.query(
      'SELECT id, name, email, avatar_url, role FROM users WHERE id = $1',
      [userPayload.id]
    );

    if (userResult.rows.length === 0) return res.status(401).json({ authenticated: false });
    const user = userResult.rows[0];
    res.json({
      authenticated: true,
      user: {
        ...user,
        isAdmin: userPayload.isAdmin,
      },
    });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ================= PROBLEM CATALOG & DETAILS =================

app.get('/api/problems', async (req, res) => {
  try {
    const queryText = `
      SELECT id, title, slug, difficulty, COALESCE(problem_type, 'coding') as problem_type, 
             COALESCE(topic, 'General') as topic, track, category, created_at 
      FROM problems 
      ORDER BY id ASC;
    `;
    const result = await pool.query(queryText);
    res.json({
      success: true,
      count: result.rowCount,
      problems: result.rows,
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/problems/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const problemQuery = `
      SELECT id, title, slug, description, difficulty, constraints, 
             COALESCE(problem_type, 'coding') as problem_type, COALESCE(topic, 'General') as topic,
             track, category
      FROM problems 
      WHERE slug = $1;
    `;
    const problemResult = await pool.query(problemQuery, [slug]);

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    const problem = problemResult.rows[0];

    if (problem.problem_type === 'mcq') {
      const optionsResult = await pool.query(
        'SELECT id, option_key, option_key AS label, option_text FROM mcq_options WHERE problem_id = $1 ORDER BY option_key ASC;',
        [problem.id]
      );
      return res.json({
        success: true,
        problem: {
          ...problem,
          options: optionsResult.rows,
        },
      });
    }

    const testCasesResult = await pool.query(
      'SELECT id, input, expected_output FROM test_cases WHERE problem_id = $1 AND is_hidden = false;',
      [problem.id]
    );

    res.json({
      success: true,
      problem: {
        ...problem,
        sample_test_cases: testCasesResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching problem details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ================= CODING SUBMISSION RUNNER =================

app.post('/api/submissions/run', async (req, res) => {
  const { problemId, code, language } = req.body;

  if (!code || !problemId) {
    return res.status(400).json({ success: false, error: 'Problem ID and code are required' });
  }

  try {
    const testCasesRes = await pool.query(
      'SELECT id, input, expected_output, is_hidden FROM test_cases WHERE problem_id = $1 ORDER BY id ASC;',
      [problemId]
    );

    const testCases = testCasesRes.rows;
    if (testCases.length === 0) {
      return res.status(404).json({ success: false, error: 'No test cases found' });
    }

    const results = [];
    let allPassed = true;

    for (const tc of testCases) {
      try {
        const sandbox = {
          console: { log: () => { } },
          input: JSON.parse(tc.input),
          output: null,
        };

        const script = new vm.Script(`
          ${code}
          if (typeof twoSum === 'function') {
            output = twoSum(input.nums, input.target);
          }
        `);

        const context = vm.createContext(sandbox);
        script.runInContext(context, { timeout: 1500 });

        const actualOutput = JSON.stringify(sandbox.output);
        const expectedOutput = tc.expected_output.trim();
        const passed = actualOutput === expectedOutput;

        if (!passed) allPassed = false;

        results.push({
          testCaseId: tc.id,
          isHidden: tc.is_hidden,
          input: tc.is_hidden ? 'Hidden' : tc.input,
          expected: tc.is_hidden ? 'Hidden' : expectedOutput,
          actual: tc.is_hidden && !passed ? 'Hidden' : actualOutput,
          passed,
        });
      } catch (runErr) {
        allPassed = false;
        results.push({
          testCaseId: tc.id,
          isHidden: tc.is_hidden,
          error: runErr.message,
          passed: false,
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    if (userId) {
      try {
        await pool.query(
          'INSERT INTO submissions (user_id, problem_id, code, language_id, status) VALUES ($1, $2, $3, 1, $4);',
          [userId, problemId, code, allPassed ? 'Accepted' : 'Wrong Answer']
        );
      } catch (err) {
        console.error('Failed to save code submission:', err.message);
      }
    }

    res.json({
      success: true,
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      results,
    });
  } catch (err) {
    console.error('Execution Error:', err);
    res.status(500).json({ success: false, error: 'Internal execution error' });
  }
});

// ================= PRACTICE & MCQ ROUTES =================
app.use('/api', require('./routes/practice'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
