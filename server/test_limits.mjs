import jwt from 'jsonwebtoken';
import pool from './db.js';
import { FREE_LIMIT_PER_CATEGORY, isAdmin } from './config.js';

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_codepath_2026';

async function runTests() {
  console.log('=== Running Limit & Session Verification Tests ===');

  const client = await pool.connect();
  let regularUserId;
  let adminUserId;

  try {
    // 1. Setup non-admin user
    const regularEmail = 'student_test_limits@codepath.local';
    const regRes = await client.query(`
      INSERT INTO users (google_id, name, email) 
      VALUES ('gid_student_limit', 'Test Student', $1)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, email;
    `, [regularEmail]);
    regularUserId = regRes.rows[0].id;

    // 2. Setup admin user (email is in ADMIN_EMAILS: admin@codepath.com)
    const adminEmail = 'admin@codepath.com';
    const adminRes = await client.query(`
      INSERT INTO users (google_id, name, email) 
      VALUES ('gid_admin_limit', 'Admin User', $1)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, email;
    `, [adminEmail]);
    adminUserId = adminRes.rows[0].id;

    console.log(`Regular user ID: ${regularUserId} (${regularEmail})`);
    console.log(`Admin user ID: ${adminUserId} (${adminEmail})`);
    console.log(`Is regular admin? ${isAdmin(regularEmail)} (expected false)`);
    console.log(`Is admin admin? ${isAdmin(adminEmail)} (expected true)`);

    if (isAdmin(regularEmail)) throw new Error('regularEmail must NOT be admin');
    if (!isAdmin(adminEmail)) throw new Error('adminEmail MUST be admin');

    // Tokens
    const regularToken = jwt.sign({ id: regularUserId, email: regularEmail, role: 'student' }, JWT_SECRET);
    const adminToken = jwt.sign({ id: adminUserId, email: adminEmail, role: 'admin' }, JWT_SECRET);

    const regularHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${regularToken}` };
    const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };

    // Clean any prior session answers for these test users
    await client.query('DELETE FROM session_answers WHERE session_id IN (SELECT id FROM practice_sessions WHERE user_id IN ($1, $2));', [regularUserId, adminUserId]);
    await client.query('DELETE FROM practice_sessions WHERE user_id IN ($1, $2);', [regularUserId, adminUserId]);
    await client.query('DELETE FROM user_mcq_attempts WHERE user_id IN ($1, $2);', [regularUserId, adminUserId]);
    await client.query('DELETE FROM user_seen_mcqs WHERE user_id IN ($1, $2);', [regularUserId, adminUserId]);

    const track = 'Java';
    const category = 'language';

    // -------------------------------------------------------------
    // TEST 1: User with 99 answered can answer 1 more
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: User with 99 answered can answer 1 more ---');

    // Create a setup session for the 99 seeded answers
    const initSessionRes = await client.query(
      `INSERT INTO practice_sessions (user_id, track, category, started_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING id;`,
      [regularUserId, track, category]
    );
    const setupSessionId = initSessionRes.rows[0].id;

    // We need 100 distinct dummy problems in track='Java', category='language' for the test
    // Let's create temporary dummy problems if needed to reach at least 105 distinct problems
    const existingJavaProbs = await client.query(
      "SELECT id FROM problems WHERE track = $1 AND category = $2 AND problem_type = 'mcq';",
      [track, category]
    );
    console.log(`Existing ${track} ${category} questions: ${existingJavaProbs.rowCount}`);

    let probIds = existingJavaProbs.rows.map(r => r.id);
    if (probIds.length < 105) {
      console.log(`Generating test dummy problems to reach 105...`);
      for (let i = probIds.length + 1; i <= 105; i++) {
        const pRes = await client.query(
          `INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, track, category, explanation)
           VALUES ($1, $2, 'Test question', 'easy', 'mcq', 'Java', 'Java', 'language', 'Explanation')
           ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id;`,
          [`Test Java Q ${i}`, `test-java-q-${i}`]
        );
        const pid = pRes.rows[0].id;
        probIds.push(pid);
        await client.query(
          `INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct)
           VALUES ($1, 'A', 'Option A', true), ($1, 'B', 'Option B', false)
           ON CONFLICT DO NOTHING;`,
          [pid]
        );
      }
    }

    // Seed 99 distinct answered questions for regular user
    console.log(`Seeding 99 distinct answered questions for user ${regularUserId}...`);
    for (let i = 0; i < 99; i++) {
      await client.query(
        `INSERT INTO session_answers (session_id, problem_id, selected_option_id, is_correct, position, answered_at)
         VALUES ($1, $2, NULL, true, $3, NOW());`,
        [setupSessionId, probIds[i], i + 1]
      );
    }

    // Check GET /api/limits
    const limitsRes99 = await fetch(`${BASE_URL}/api/limits?track=${track}`, { headers: regularHeaders });
    const limitsData99 = await limitsRes99.json();
    console.log('Limits at 99 answers:', limitsData99.language);
    if (limitsData99.language.used !== 99) throw new Error(`Expected used == 99, got ${limitsData99.language.used}`);
    if (limitsData99.language.limit !== 100) throw new Error(`Expected limit == 100, got ${limitsData99.language.limit}`);

    // Create a new active session for the user
    const createSessRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: regularHeaders,
      body: JSON.stringify({ track, category })
    });
    const sessionData = await createSessRes.json();
    const activeSessionId = sessionData.id || sessionData.sessionId;
    console.log(`Active session created: ID ${activeSessionId}`);

    // Call GET /api/mcq/next?sessionId=... -> MUST SUCCEED (because used = 99 < 100)
    const nextQRes99 = await fetch(`${BASE_URL}/api/mcq/next?sessionId=${activeSessionId}`, { headers: regularHeaders });
    console.log(`GET /api/mcq/next at 99 status: ${nextQRes99.status}`);
    if (nextQRes99.status !== 200) {
      const errText = await nextQRes99.text();
      throw new Error(`Expected 200 for 99th question, got ${nextQRes99.status}: ${errText}`);
    }
    const nextQData99 = await nextQRes99.json();
    const q100 = nextQData99.problem;
    console.log(`Fetched 100th question: ID ${q100.id} - ${q100.title}`);

    // Submit answer for 100th question -> MUST SUCCEED
    const submitRes100 = await fetch(`${BASE_URL}/api/submissions/mcq`, {
      method: 'POST',
      headers: regularHeaders,
      body: JSON.stringify({
        sessionId: activeSessionId,
        problemId: q100.id,
        optionId: q100.options[0].id
      })
    });
    console.log(`POST /api/submissions/mcq for 100th question status: ${submitRes100.status}`);
    if (submitRes100.status !== 200) {
      const errText = await submitRes100.text();
      throw new Error(`Expected 200 for 100th submission, got ${submitRes100.status}: ${errText}`);
    }
    console.log('✅ TEST 1 PASSED: User with 99 answered can answer 1 more successfully.');

    // -------------------------------------------------------------
    // TEST 2: User with 100 answered is BLOCKED
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: User with 100 answered is blocked ---');

    // Verify limit endpoint shows used == 100
    const limitsRes100 = await fetch(`${BASE_URL}/api/limits?track=${track}`, { headers: regularHeaders });
    const limitsData100 = await limitsRes100.json();
    console.log('Limits at 100 answers:', limitsData100.language);
    if (limitsData100.language.used < 100) {
      throw new Error(`Expected used >= 100, got ${limitsData100.language.used}`);
    }

    // Now calling GET /api/mcq/next?sessionId=... -> MUST RETURN 403 { code: "LIMIT_REACHED" }
    const nextQRes101 = await fetch(`${BASE_URL}/api/mcq/next?sessionId=${activeSessionId}`, { headers: regularHeaders });
    console.log(`GET /api/mcq/next at 100 status: ${nextQRes101.status}`);
    const nextQData101 = await nextQRes101.json();
    console.log('Response body:', nextQData101);

    if (nextQRes101.status !== 403) {
      throw new Error(`Expected 403 for user with 100 answered, got ${nextQRes101.status}`);
    }
    if (nextQData101.code !== 'LIMIT_REACHED') {
      throw new Error(`Expected code: "LIMIT_REACHED", got ${nextQData101.code}`);
    }

    // Calling POST /api/submissions/mcq for an unattempted question -> MUST RETURN 403 { code: "LIMIT_REACHED" }
    const submitRes101 = await fetch(`${BASE_URL}/api/submissions/mcq`, {
      method: 'POST',
      headers: regularHeaders,
      body: JSON.stringify({
        sessionId: activeSessionId,
        problemId: probIds[104],
        optionId: 1
      })
    });
    console.log(`POST /api/submissions/mcq at 100 status: ${submitRes101.status}`);
    const submitData101 = await submitRes101.json();
    console.log('Response body:', submitData101);

    if (submitRes101.status !== 403) {
      throw new Error(`Expected 403 for submission beyond limit, got ${submitRes101.status}`);
    }
    if (submitData101.code !== 'LIMIT_REACHED') {
      throw new Error(`Expected code: "LIMIT_REACHED", got ${submitData101.code}`);
    }
    console.log('✅ TEST 2 PASSED: User with 100 answered is strictly blocked with 403 LIMIT_REACHED.');

    // -------------------------------------------------------------
    // TEST 3: Admin with 5000 answered is STILL ALLOWED
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Admin with 5000 answered is still allowed ---');

    // Create a setup session for the admin
    const adminSessRes = await client.query(
      `INSERT INTO practice_sessions (user_id, track, category, started_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING id;`,
      [adminUserId, track, category]
    );
    const adminSetupSessionId = adminSessRes.rows[0].id;

    // Seed 5000 records into session_answers for admin
    console.log(`Bulk seeding 5000 answer rows for admin ${adminUserId}...`);
    // Insert 5000 rows in bulk
    await client.query(`
      INSERT INTO session_answers (session_id, problem_id, selected_option_id, is_correct, position, answered_at)
      SELECT $1, $2, NULL, true, s, NOW()
      FROM generate_series(1, 5000) AS s;
    `, [adminSetupSessionId, probIds[0]]);

    // Check GET /api/limits for admin
    const adminLimitsRes = await fetch(`${BASE_URL}/api/limits?track=${track}`, { headers: adminHeaders });
    const adminLimitsData = await adminLimitsRes.json();
    console.log('Admin limits response:', adminLimitsData.language);

    if (adminLimitsData.language.limit !== null) {
      throw new Error(`Admin limit should be null, got: ${adminLimitsData.language.limit}`);
    }

    // Admin creates an active session
    const adminActiveSessRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ track, category })
    });
    const adminSessionData = await adminActiveSessRes.json();
    const adminActiveSessionId = adminSessionData.id || adminSessionData.sessionId;

    // Admin calls GET /api/mcq/next?sessionId=... -> MUST BE ALLOWED (200 OK)
    const adminNextRes = await fetch(`${BASE_URL}/api/mcq/next?sessionId=${adminActiveSessionId}`, { headers: adminHeaders });
    console.log(`Admin GET /api/mcq/next status: ${adminNextRes.status}`);
    if (adminNextRes.status !== 200) {
      const errText = await adminNextRes.text();
      throw new Error(`Expected 200 for admin, got ${adminNextRes.status}: ${errText}`);
    }
    const adminNextData = await adminNextRes.json();
    console.log(`Admin got question: ${adminNextData.problem?.title}`);

    // Admin submits answer -> MUST BE ALLOWED (200 OK)
    const adminSubmitRes = await fetch(`${BASE_URL}/api/submissions/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        sessionId: adminActiveSessionId,
        problemId: adminNextData.problem.id,
        optionId: adminNextData.problem.options[0].id
      })
    });
    console.log(`Admin POST /api/submissions/mcq status: ${adminSubmitRes.status}`);
    if (adminSubmitRes.status !== 200) {
      const errText = await adminSubmitRes.text();
      throw new Error(`Expected 200 for admin submission, got ${adminSubmitRes.status}: ${errText}`);
    }
    console.log('✅ TEST 3 PASSED: Admin with 5000 answers is still allowed without limits.');

    // -------------------------------------------------------------
    // TEST 4: Read-only review (Back) and Finish session
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Read-only review and Session Finish ---');

    // Test GET /api/sessions/:id/answers/:position
    const reviewRes = await fetch(`${BASE_URL}/api/sessions/${activeSessionId}/answers/1`, { headers: regularHeaders });
    console.log(`GET /api/sessions/:id/answers/1 status: ${reviewRes.status}`);
    if (reviewRes.status !== 200) throw new Error(`Review returned status ${reviewRes.status}`);
    const reviewData = await reviewRes.json();
    console.log('Reviewed answer position 1:', {
      position: reviewData.position,
      title: reviewData.title,
      isCorrect: reviewData.isCorrect
    });

    // Test POST /api/sessions/:id/finish
    const finishRes = await fetch(`${BASE_URL}/api/sessions/${activeSessionId}/finish`, {
      method: 'POST',
      headers: regularHeaders
    });
    console.log(`POST /api/sessions/:id/finish status: ${finishRes.status}`);
    if (finishRes.status !== 200) throw new Error(`Finish returned status ${finishRes.status}`);
    const finishData = await finishRes.json();
    console.log('Session finish summary:', {
      attempted: finishData.attempted,
      correct: finishData.correct,
      incorrect: finishData.incorrect,
      percentage: finishData.percentage,
      wrongQuestionsCount: finishData.wrongQuestions?.length
    });

    console.log('✅ TEST 4 PASSED: Review and session finish work as specified.');

    // Cleanup test dummy problems
    await client.query("DELETE FROM problems WHERE slug LIKE 'test-java-q-%';");
    console.log('Cleaned dummy test problems.');

    console.log('\n======================================================');
    console.log('🎉 ALL LIMIT, SESSION, AND ADMIN TESTS PASSED! 🎉');
    console.log('======================================================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('❌ Tests failed with error:', err);
  process.exit(1);
});

