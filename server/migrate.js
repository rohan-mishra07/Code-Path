import pool from './db.js';

export async function migrate() {
  console.log('Running database migrations...');
  const client = await pool.connect();
  try {
    // 1. Add track and category columns to problems
    await client.query(`
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS track VARCHAR(100);
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS category VARCHAR(50);
    `);

    // 2. Add index on (problem_type, track, category)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_problems_type_track_category 
      ON problems(problem_type, track, category);
    `);

    // 3. Create practice_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        track VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_track_cat 
      ON practice_sessions(user_id, track, category);
    `);

    // 4. Create session_answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_answers (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
        problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
        selected_option_id INTEGER,
        is_correct BOOLEAN NOT NULL DEFAULT false,
        position INTEGER NOT NULL,
        answered_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_session_answers_session_pos 
      ON session_answers(session_id, position);
      CREATE INDEX IF NOT EXISTS idx_session_answers_problem 
      ON session_answers(problem_id);
    `);

    // 5. Backfill any problems with missing track or category
    await client.query(`
      UPDATE problems SET 
        track = CASE
          WHEN topic LIKE '%Java %' OR topic LIKE '%JVM%' OR topic LIKE '%OOPs%' THEN 'Java'
          WHEN topic LIKE '%JavaScript%' OR topic LIKE '%JS%' OR topic LIKE '%Event Loop%' OR topic LIKE '%DOM%' OR topic LIKE '%Closure%' OR topic LIKE '%Async%' THEN 'JavaScript'
          WHEN topic LIKE '%Python%' OR topic LIKE '%GIL%' OR topic LIKE '%CPython%' THEN 'Python'
          WHEN topic LIKE '%C++%' OR topic LIKE '%STL%' OR topic LIKE '%Pointer%' THEN 'C++'
          ELSE 'Core Fundamentals'
        END,
        category = CASE
          WHEN topic LIKE '%DSA%' OR topic LIKE '%Data Structures%' THEN 'dsa'
          WHEN topic LIKE '%OS%' OR topic LIKE '%DBMS%' OR topic LIKE '%SQL%' OR topic LIKE '%Network%' THEN 'core'
          ELSE 'language'
        END
      WHERE problem_type = 'mcq' AND (track IS NULL OR category IS NULL);
    `);

    console.log('Database migrations completed successfully.');
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('migrate.js')) {
  migrate().then(() => pool.end()).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
