import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { FREE_LIMIT_PER_CATEGORY, isAdmin } from '../config.js';

const router = express.Router();

// Helper: Extract authenticated user from cookie or Authorization header
export const getUserFromRequest = (req) => {
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

export const getUserIdFromRequest = (req) => {
  const user = getUserFromRequest(req);
  return user ? user.id : null;
};

// Helper: Count distinct questions answered by user in that track + category
export const getUsedCount = async (userId, track, category) => {
  if (!userId) return 0;
  const query = `
    SELECT COUNT(DISTINCT problem_id)::int AS used
    FROM (
      SELECT sa.problem_id
      FROM session_answers sa
      JOIN practice_sessions ps ON sa.session_id = ps.id
      WHERE ps.user_id = $1 
        AND (ps.track = $2 OR LOWER(ps.track) = LOWER($2))
        AND LOWER(ps.category) = LOWER($3)
      UNION
      SELECT uma.problem_id
      FROM user_mcq_attempts uma
      JOIN problems p ON uma.problem_id = p.id
      WHERE uma.user_id = $1
        AND (p.track = $2 OR LOWER(p.track) = LOWER($2))
        AND LOWER(p.category) = LOWER($3)
    ) combined;
  `;
  const result = await pool.query(query, [userId, track, category]);
  return Number(result.rows[0]?.used) || 0;
};

// Helper: Check if user already answered this specific problem previously
export const hasUserAnsweredQuestion = async (userId, problemId) => {
  if (!userId || !problemId) return false;
  const result = await pool.query(
    `SELECT 1 FROM session_answers sa
     JOIN practice_sessions ps ON sa.session_id = ps.id
     WHERE ps.user_id = $1 AND sa.problem_id = $2
     UNION
     SELECT 1 FROM user_mcq_attempts WHERE user_id = $1 AND problem_id = $2
     LIMIT 1;`,
    [userId, problemId]
  );
  return result.rowCount > 0;
};

// ================= LIMITS API =================

// GET /api/limits?track=<track>
// Returns { language: { used, limit }, dsa: { used, limit }, core: { used, limit } }; limit is null for admin
router.get('/limits', async (req, res) => {
  const track = req.query.track || 'Java';
  const user = getUserFromRequest(req);

  try {
    const userIsAdmin = user?.isAdmin || false;
    const limit = userIsAdmin ? null : FREE_LIMIT_PER_CATEGORY;

    let usedLanguage = 0;
    let usedDsa = 0;
    let usedCore = 0;

    if (user) {
      [usedLanguage, usedDsa, usedCore] = await Promise.all([
        getUsedCount(user.id, track, 'language'),
        getUsedCount(user.id, track, 'dsa'),
        getUsedCount(user.id, track, 'core'),
      ]);
    }

    res.json({
      track,
      language: {
        used: usedLanguage,
        limit,
      },
      dsa: {
        used: usedDsa,
        limit,
      },
      core: {
        used: usedCore,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching limits:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quota limits' });
  }
});

// ================= SESSION API =================

// POST /api/sessions {track, category} creates a session
router.post('/sessions', async (req, res) => {
  const { track, category } = req.body;
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (!track || !category) {
    return res.status(400).json({ success: false, error: 'Track and category are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO practice_sessions (user_id, track, category, started_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, user_id, track, category, started_at;`,
      [user.id, track, category.toLowerCase()]
    );

    const session = result.rows[0];
    res.json({
      success: true,
      id: session.id,
      sessionId: session.id,
      track: session.track,
      category: session.category,
      session,
    });
  } catch (error) {
    console.error('Error creating practice session:', error);
    res.status(500).json({ success: false, error: 'Database error creating session' });
  }
});

// GET /api/mcq/next?sessionId=
// Returns a random unseen question using NOT EXISTS. Do not include the correct answer in the response.
// Returns 403 {code:"LIMIT_REACHED"} when used >= limit (non-admin only).
router.get('/mcq/next', async (req, res) => {
  const sessionId = req.query.sessionId;
  const reqTrack = req.query.track || req.query.topic;
  const reqCategory = req.query.category;
  const user = getUserFromRequest(req);

  try {
    let track = reqTrack;
    let category = reqCategory;
    let session = null;

    if (sessionId) {
      if (!user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const sessionRes = await pool.query(
        'SELECT id, user_id, track, category, ended_at FROM practice_sessions WHERE id = $1 AND user_id = $2;',
        [sessionId, user.id]
      );

      if (sessionRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      session = sessionRes.rows[0];
      track = session.track;
      category = session.category;
    }

    // Enforce limits for non-admin users
    if (user && track && category) {
      const used = await getUsedCount(user.id, track, category);
      if (!user.isAdmin && used >= FREE_LIMIT_PER_CATEGORY) {
        return res.status(403).json({
          success: false,
          code: 'LIMIT_REACHED',
          message: `You've used your ${FREE_LIMIT_PER_CATEGORY} free questions in this part.`,
        });
      }
    }

    // Query unseen question using NOT EXISTS
    let query;
    let params;

    if (user && session) {
      query = `
        SELECT p.id, p.title, p.slug, p.description, p.difficulty, p.topic, p.track, p.category
        FROM problems p
        WHERE p.problem_type = 'mcq'
          AND (p.track = $1 OR LOWER(p.track) = LOWER($1))
          AND LOWER(p.category) = LOWER($2)
          AND NOT EXISTS (
            SELECT 1 FROM session_answers sa
            JOIN practice_sessions ps ON sa.session_id = ps.id
            WHERE ps.user_id = $3 AND sa.problem_id = p.id
          )
        ORDER BY RANDOM()
        LIMIT 1;
      `;
      params = [track, category, user.id];
    } else if (user && track) {
      query = `
        SELECT p.id, p.title, p.slug, p.description, p.difficulty, p.topic, p.track, p.category
        FROM problems p
        WHERE p.problem_type = 'mcq'
          AND (p.track = $1 OR LOWER(p.track) = LOWER($1))
          ${category ? 'AND LOWER(p.category) = LOWER($3)' : ''}
          AND NOT EXISTS (
            SELECT 1 FROM session_answers sa
            JOIN practice_sessions ps ON sa.session_id = ps.id
            WHERE ps.user_id = $2 AND sa.problem_id = p.id
          )
        ORDER BY RANDOM()
        LIMIT 1;
      `;
      params = category ? [track, user.id, category] : [track, user.id];
    } else {
      query = `
        SELECT p.id, p.title, p.slug, p.description, p.difficulty, p.topic, p.track, p.category
        FROM problems p
        WHERE p.problem_type = 'mcq'
          ${track ? 'AND (p.track = $1 OR LOWER(p.track) = LOWER($1))' : ''}
          ${category ? 'AND LOWER(p.category) = LOWER($2)' : ''}
        ORDER BY RANDOM()
        LIMIT 1;
      `;
      params = track && category ? [track, category] : track ? [track] : [];
    }

    const problemResult = await pool.query(query, params);

    if (problemResult.rows.length === 0) {
      return res.json({
        success: true,
        finished: true,
        message: 'You have completed all questions in this category! Reset to practice again.',
      });
    }

    const problem = problemResult.rows[0];

    // Session tracking: Record question in user_seen_mcqs
    if (user) {
      try {
        await pool.query(
          `INSERT INTO user_seen_mcqs (user_id, problem_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, problem_id) DO NOTHING;`,
          [user.id, problem.id]
        );
      } catch (err) {
        console.error('Failed to record seen MCQ:', err.message);
      }
    }

    // Fetch options: use option_key (NOT option_label) and alias option_key AS label
    // Strictly do NOT include is_correct in next question response!
    const optionsResult = await pool.query(
      'SELECT id, option_key, option_key AS label, option_text FROM mcq_options WHERE problem_id = $1 ORDER BY option_key ASC;',
      [problem.id]
    );

    res.json({
      success: true,
      finished: false,
      problem: {
        id: problem.id,
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        difficulty: problem.difficulty,
        topic: problem.topic,
        track: problem.track,
        category: problem.category,
        options: optionsResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching next MCQ:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// POST /api/submissions/mcq {sessionId, problemId, optionId}
// Saves the answer and returns isCorrect, correctOptionId, explanation.
// Returns 403 {code:"LIMIT_REACHED"} when used >= limit (non-admin only).
router.post('/submissions/mcq', async (req, res) => {
  const { sessionId, problemId, optionId, selectedOptionKey } = req.body;
  const user = getUserFromRequest(req);

  if (!problemId || (optionId === undefined && selectedOptionKey === undefined)) {
    return res.status(400).json({ success: false, error: 'Problem ID and option are required' });
  }

  try {
    let session = null;

    if (sessionId && user) {
      const sessionRes = await pool.query(
        'SELECT id, user_id, track, category FROM practice_sessions WHERE id = $1 AND user_id = $2;',
        [sessionId, user.id]
      );
      if (sessionRes.rows.length > 0) {
        session = sessionRes.rows[0];

        // Check if user is non-admin and reached quota
        if (!user.isAdmin) {
          const used = await getUsedCount(user.id, session.track, session.category);
          const alreadyAnswered = await hasUserAnsweredQuestion(user.id, problemId);
          if (!alreadyAnswered && used >= FREE_LIMIT_PER_CATEGORY) {
            return res.status(403).json({
              success: false,
              code: 'LIMIT_REACHED',
              message: `You've used your ${FREE_LIMIT_PER_CATEGORY} free questions in this part.`,
            });
          }
        }
      }
    }

    // Fetch options using option_key (NOT option_label) and alias option_key AS label
    const optionsRes = await pool.query(
      'SELECT id, option_key, option_key AS label, option_text, is_correct FROM mcq_options WHERE problem_id = $1 ORDER BY option_key ASC;',
      [problemId]
    );

    const problemRes = await pool.query(
      'SELECT explanation FROM problems WHERE id = $1;',
      [problemId]
    );

    if (optionsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question options not found' });
    }

    const options = optionsRes.rows;
    const correctOpt = options.find(o => o.is_correct);
    if (!correctOpt) {
      return res.status(404).json({ success: false, error: 'Answer key not found' });
    }

    // Match chosen option by ID or Key/Label
    const chosenOpt = options.find(o => 
      o.id === Number(optionId) || 
      o.option_key === String(optionId) || 
      o.option_key === String(selectedOptionKey) ||
      o.label === String(optionId) ||
      o.label === String(selectedOptionKey)
    );

    const isCorrect = chosenOpt ? Boolean(chosenOpt.is_correct) : false;
    const explanation = problemRes.rows[0]?.explanation || 'No detailed explanation provided.';

    let position = 1;

    // Save session answer if session exists
    if (session && user) {
      const posRes = await pool.query(
        'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM session_answers WHERE session_id = $1;',
        [session.id]
      );
      position = posRes.rows[0].next_pos;

      await pool.query(
        `INSERT INTO session_answers (session_id, problem_id, selected_option_id, is_correct, position, answered_at)
         VALUES ($1, $2, $3, $4, $5, NOW());`,
        [session.id, problemId, chosenOpt ? chosenOpt.id : null, isCorrect, position]
      );
    }

    // Save to user_seen_mcqs, user_mcq_attempts, submissions
    if (user) {
      try {
        await pool.query(
          `INSERT INTO user_seen_mcqs (user_id, problem_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, problem_id) DO NOTHING;`,
          [user.id, problemId]
        );
      } catch (err) {
        console.error('Failed to log seen MCQ:', err.message);
      }

      try {
        await pool.query(
          `INSERT INTO user_mcq_attempts (user_id, problem_id, selected_option_id, is_correct, attempted_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id, problem_id) 
           DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id, is_correct = EXCLUDED.is_correct, attempted_at = NOW();`,
          [user.id, problemId, chosenOpt ? chosenOpt.id : null, isCorrect]
        );
      } catch (err) {
        console.error('Failed to log attempt:', err.message);
      }

      try {
        await pool.query(
          'INSERT INTO submissions (user_id, problem_id, code, status) VALUES ($1, $2, $3, $4);',
          [user.id, problemId, chosenOpt ? chosenOpt.option_key : '', isCorrect ? 'Accepted' : 'Wrong Answer']
        );
      } catch (err) {
        console.error('Failed to log submission:', err.message);
      }
    }

    res.json({
      success: true,
      isCorrect,
      passed: isCorrect,
      correctOptionId: correctOpt.id,
      correctOption: correctOpt.option_key,
      correctOptionKey: correctOpt.option_key,
      correctLabel: correctOpt.option_key,
      explanation,
      position,
      message: isCorrect ? 'Correct Answer! Great job.' : 'Incorrect Answer.',
    });
  } catch (err) {
    console.error('MCQ evaluation error:', err);
    res.status(500).json({ success: false, error: 'Failed to evaluate answer' });
  }
});

// POST /api/sessions/:id/finish
// Ends the session and returns {attempted, correct, incorrect, percentage, wrongQuestions[]}. percentage = correct / attempted * 100.
router.post('/sessions/:id/finish', async (req, res) => {
  const sessionId = req.params.id;
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    await pool.query(
      'UPDATE practice_sessions SET ended_at = NOW() WHERE id = $1 AND user_id = $2;',
      [sessionId, user.id]
    );

    const answersRes = await pool.query(
      `SELECT 
         sa.id, sa.session_id, sa.problem_id, sa.selected_option_id, sa.is_correct, sa.position,
         p.title, p.description, p.explanation,
         mo_sel.option_key AS selected_option_key, mo_sel.option_key AS selected_label, mo_sel.option_text AS selected_option_text,
         mo_cor.id AS correct_option_id, mo_cor.option_key AS correct_option_key, mo_cor.option_key AS correct_label, mo_cor.option_text AS correct_option_text
       FROM session_answers sa
       JOIN problems p ON sa.problem_id = p.id
       LEFT JOIN mcq_options mo_sel ON sa.selected_option_id = mo_sel.id
       LEFT JOIN mcq_options mo_cor ON p.id = mo_cor.problem_id AND mo_cor.is_correct = true
       WHERE sa.session_id = $1
       ORDER BY sa.position ASC;`,
      [sessionId]
    );

    const answers = answersRes.rows;
    const attempted = answers.length;
    const correct = answers.filter(a => a.is_correct).length;
    const incorrect = attempted - correct;
    const percentage = attempted > 0 ? (correct / attempted) * 100 : 0;

    const wrongQuestions = answers
      .filter(a => !a.is_correct)
      .map(a => ({
        problemId: a.problem_id,
        title: a.title,
        description: a.description,
        selectedOptionId: a.selected_option_id,
        selectedOptionKey: a.selected_option_key,
        userOption: a.selected_option_text || a.selected_option_key || 'No answer chosen',
        correctOptionId: a.correct_option_id,
        correctOptionKey: a.correct_option_key,
        correctOption: a.correct_option_text || a.correct_option_key,
        explanation: a.explanation || 'No detailed explanation provided.',
      }));

    res.json({
      success: true,
      attempted,
      correct,
      incorrect,
      percentage: Number(percentage.toFixed(1)),
      wrongQuestions,
    });
  } catch (error) {
    console.error('Error finishing session:', error);
    res.status(500).json({ success: false, error: 'Database error finishing session' });
  }
});

// GET /api/sessions/:id/answers/:position
// Returns a previously answered question for read-only review without using quota.
router.get('/sessions/:id/answers/:position', async (req, res) => {
  const { id: sessionId, position } = req.params;
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const answerRes = await pool.query(
      `SELECT 
         sa.id, sa.session_id, sa.problem_id, sa.selected_option_id, sa.is_correct, sa.position, sa.answered_at,
         p.title, p.slug, p.description, p.difficulty, p.topic, p.track, p.category, p.explanation,
         mo_sel.option_key AS selected_option_key, mo_sel.option_key AS selected_label, mo_sel.option_text AS selected_option_text,
         mo_cor.id AS correct_option_id, mo_cor.option_key AS correct_option_key, mo_cor.option_key AS correct_label, mo_cor.option_text AS correct_option_text
       FROM session_answers sa
       JOIN practice_sessions ps ON sa.session_id = ps.id
       JOIN problems p ON sa.problem_id = p.id
       LEFT JOIN mcq_options mo_sel ON sa.selected_option_id = mo_sel.id
       LEFT JOIN mcq_options mo_cor ON p.id = mo_cor.problem_id AND mo_cor.is_correct = true
       WHERE sa.session_id = $1 AND sa.position = $2 AND ps.user_id = $3;`,
      [sessionId, position, user.id]
    );

    if (answerRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Answer record not found at this position' });
    }

    const answer = answerRes.rows[0];

    // Options for this problem with option_key AS label
    const optionsRes = await pool.query(
      'SELECT id, option_key, option_key AS label, option_text FROM mcq_options WHERE problem_id = $1 ORDER BY option_key ASC;',
      [answer.problem_id]
    );

    res.json({
      success: true,
      position: answer.position,
      problemId: answer.problem_id,
      title: answer.title,
      description: answer.description,
      difficulty: answer.difficulty,
      topic: answer.topic,
      track: answer.track,
      category: answer.category,
      options: optionsRes.rows,
      selectedOptionId: answer.selected_option_id,
      selectedOptionKey: answer.selected_option_key,
      userOption: answer.selected_option_text,
      isCorrect: answer.is_correct,
      correctOptionId: answer.correct_option_id,
      correctOptionKey: answer.correct_option_key,
      correctOption: answer.correct_option_text,
      explanation: answer.explanation,
    });
  } catch (error) {
    console.error('Error fetching session answer:', error);
    res.status(500).json({ success: false, error: 'Database error fetching answer' });
  }
});

// Explicit session tracking: Record question as seen
router.post('/mcq/seen', async (req, res) => {
  const { problemId } = req.body;
  const userId = getUserIdFromRequest(req);

  if (!problemId) {
    return res.status(400).json({ success: false, error: 'Problem ID is required' });
  }

  if (userId) {
    try {
      await pool.query(
        `INSERT INTO user_seen_mcqs (user_id, problem_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, problem_id) DO NOTHING;`,
        [userId, problemId]
      );
    } catch (err) {
      console.error('Failed to record seen MCQ:', err.message);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
  }

  res.json({ success: true, message: 'Question marked as seen' });
});

// Reset MCQ history for a specific track or all tracks
router.post('/mcq/reset', async (req, res) => {
  const track = req.body?.track || req.query?.track || req.body?.topic || req.query?.topic;
  const userId = getUserIdFromRequest(req);

  try {
    if (userId) {
      const isSpecificTrack = track && track.trim() !== '' && track.toLowerCase() !== 'all';
      if (isSpecificTrack) {
        const cleanTrack = track.trim();
        await pool.query(
          `DELETE FROM user_seen_mcqs
           WHERE user_id = $1 AND problem_id IN (
             SELECT id FROM problems 
             WHERE problem_type = 'mcq' AND (topic = $2 OR LOWER(topic) = LOWER($2) OR track = $2 OR LOWER(track) = LOWER($2))
           );`,
          [userId, cleanTrack]
        );

        await pool.query(
          `DELETE FROM user_mcq_attempts
           WHERE user_id = $1 AND problem_id IN (
             SELECT id FROM problems 
             WHERE problem_type = 'mcq' AND (topic = $2 OR LOWER(topic) = LOWER($2) OR track = $2 OR LOWER(track) = LOWER($2))
           );`,
          [userId, cleanTrack]
        );

        // Delete from session answers for this track
        await pool.query(
          `DELETE FROM session_answers 
           WHERE session_id IN (SELECT id FROM practice_sessions WHERE user_id = $1 AND (track = $2 OR LOWER(track) = LOWER($2)));`,
          [userId, cleanTrack]
        );
      } else {
        await pool.query('DELETE FROM user_seen_mcqs WHERE user_id = $1;', [userId]);
        await pool.query('DELETE FROM user_mcq_attempts WHERE user_id = $1;', [userId]);
        await pool.query(
          'DELETE FROM session_answers WHERE session_id IN (SELECT id FROM practice_sessions WHERE user_id = $1);',
          [userId]
        );
      }
    }

    return res.json({ success: true, message: 'Track history cleared' });
  } catch (error) {
    console.error('Error resetting MCQ history:', error);
    return res.status(500).json({ success: false, error: 'Failed to reset MCQ history' });
  }
});

// Get MCQ statistics per track (total available, seen count, correct count, remaining unseen)
router.get('/mcq/stats', async (req, res) => {
  const track = req.query?.track || req.query?.topic;
  const userId = getUserIdFromRequest(req);

  try {
    let query;
    let params = [];

    const isSpecificTrack = track && track.trim() !== '' && track.toLowerCase() !== 'all';
    const cleanTrack = isSpecificTrack ? track.trim() : null;

    if (userId) {
      if (cleanTrack) {
        query = `
          SELECT 
            COALESCE(p.track, p.topic) AS track,
            COUNT(DISTINCT p.id)::int AS total,
            COUNT(DISTINCT seen.problem_id)::int AS seen,
            COUNT(DISTINCT ua.problem_id) FILTER (WHERE ua.is_correct = true)::int AS correct
          FROM problems p
          LEFT JOIN (
            SELECT problem_id FROM user_seen_mcqs WHERE user_id = $1
            UNION
            SELECT problem_id FROM user_mcq_attempts WHERE user_id = $1
            UNION
            SELECT sa.problem_id FROM session_answers sa JOIN practice_sessions ps ON sa.session_id = ps.id WHERE ps.user_id = $1
          ) seen ON seen.problem_id = p.id
          LEFT JOIN user_mcq_attempts ua ON ua.problem_id = p.id AND ua.user_id = $1
          WHERE p.problem_type = 'mcq' AND (p.track = $2 OR LOWER(p.track) = LOWER($2) OR p.topic = $2 OR LOWER(p.topic) = LOWER($2))
          GROUP BY COALESCE(p.track, p.topic)
          ORDER BY track ASC;
        `;
        params = [userId, cleanTrack];
      } else {
        query = `
          SELECT 
            COALESCE(p.track, p.topic) AS track,
            COUNT(DISTINCT p.id)::int AS total,
            COUNT(DISTINCT seen.problem_id)::int AS seen,
            COUNT(DISTINCT ua.problem_id) FILTER (WHERE ua.is_correct = true)::int AS correct
          FROM problems p
          LEFT JOIN (
            SELECT problem_id FROM user_seen_mcqs WHERE user_id = $1
            UNION
            SELECT problem_id FROM user_mcq_attempts WHERE user_id = $1
            UNION
            SELECT sa.problem_id FROM session_answers sa JOIN practice_sessions ps ON sa.session_id = ps.id WHERE ps.user_id = $1
          ) seen ON seen.problem_id = p.id
          LEFT JOIN user_mcq_attempts ua ON ua.problem_id = p.id AND ua.user_id = $1
          WHERE p.problem_type = 'mcq'
          GROUP BY COALESCE(p.track, p.topic)
          ORDER BY track ASC;
        `;
        params = [userId];
      }
    } else {
      if (cleanTrack) {
        query = `
          SELECT 
            COALESCE(p.track, p.topic) AS track,
            COUNT(DISTINCT p.id)::int AS total,
            0::int AS seen,
            0::int AS correct
          FROM problems p
          WHERE p.problem_type = 'mcq' AND (p.track = $1 OR LOWER(p.track) = LOWER($1) OR p.topic = $1 OR LOWER(p.topic) = LOWER($1))
          GROUP BY COALESCE(p.track, p.topic)
          ORDER BY track ASC;
        `;
        params = [cleanTrack];
      } else {
        query = `
          SELECT 
            COALESCE(p.track, p.topic) AS track,
            COUNT(DISTINCT p.id)::int AS total,
            0::int AS seen,
            0::int AS correct
          FROM problems p
          WHERE p.problem_type = 'mcq'
          GROUP BY COALESCE(p.track, p.topic)
          ORDER BY track ASC;
        `;
        params = [];
      }
    }

    const result = await pool.query(query, params);

    const stats = result.rows.map((row) => {
      const total = Number(row.total) || 0;
      const seen = Number(row.seen) || 0;
      const correct = Number(row.correct) || 0;
      const remaining = Math.max(0, total - seen);

      return {
        track: row.track,
        topic: row.track,
        total,
        total_questions: total,
        totalQuestions: total,
        totalAvailable: total,
        total_available: total,
        seen,
        seen_questions: seen,
        seenQuestions: seen,
        seenCount: seen,
        correct,
        correct_answers: correct,
        correctAnswers: correct,
        correctCount: correct,
        remaining,
        remaining_unseen: remaining,
        remainingUnseen: remaining,
        unseen: remaining,
        unseen_count: remaining,
      };
    });

    const totalAvailable = stats.reduce((acc, s) => acc + s.total, 0);
    const totalSeen = stats.reduce((acc, s) => acc + s.seen, 0);
    const totalCorrect = stats.reduce((acc, s) => acc + s.correct, 0);
    const totalRemaining = stats.reduce((acc, s) => acc + s.remaining, 0);

    const singleTrack = cleanTrack ? stats[0] : null;

    res.json({
      success: true,
      track: singleTrack ? singleTrack.track : (track || 'All'),
      total: singleTrack ? singleTrack.total : totalAvailable,
      total_questions: singleTrack ? singleTrack.total : totalAvailable,
      totalAvailable: singleTrack ? singleTrack.total : totalAvailable,
      seen: singleTrack ? singleTrack.seen : totalSeen,
      seen_questions: singleTrack ? singleTrack.seen : totalSeen,
      correct: singleTrack ? singleTrack.correct : totalCorrect,
      correct_answers: singleTrack ? singleTrack.correct : totalCorrect,
      remaining: singleTrack ? singleTrack.remaining : totalRemaining,
      remaining_unseen: singleTrack ? singleTrack.remaining : totalRemaining,
      stats,
      tracks: stats,
    });
  } catch (error) {
    console.error('Error fetching MCQ stats:', error);
    res.status(500).json({ success: false, error: 'Database error while fetching stats' });
  }
});

export default router;

