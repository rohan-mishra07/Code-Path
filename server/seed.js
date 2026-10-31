import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { migrate } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedQuestions(filePath) {
  // Ensure tables and columns exist
  await migrate();

  const jsonPath = filePath || 
    (fs.existsSync(path.join(__dirname, 'questions.json')) ? path.join(__dirname, 'questions.json') : path.join(process.cwd(), 'questions.json'));

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`questions.json not found at: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(raw);
  console.log(`Loading ${questions.length} questions from ${jsonPath}...`);

  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;

  try {
    for (const q of questions) {
      // Determine track
      let track = q.track || 'General';
      if (track.includes('Java') && !track.includes('Script')) track = 'Java';
      else if (track.includes('JavaScript')) track = 'JavaScript';
      else if (track.includes('C++')) track = 'C++';
      else if (track.includes('Python')) track = 'Python';
      else if (track.includes('Core')) track = 'Core CS Fundamentals';

      // category = q.category if present, otherwise 'core' when track is 'Core CS Fundamentals' and 'language' for every other track
      let category = q.category;
      if (!category) {
        if (track === 'Core CS Fundamentals' || q.track === 'Core CS Fundamentals' || track.toLowerCase().includes('core')) {
          category = 'core';
        } else {
          category = 'language';
        }
      }

      // INSERT INTO problems must include: title, slug, description, difficulty, problem_type, topic, track, category, explanation
      const res = await client.query(
        `INSERT INTO problems
           (title, slug, description, difficulty, problem_type, topic, track, category, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO UPDATE SET
           title        = EXCLUDED.title,
           description  = EXCLUDED.description,
           difficulty   = EXCLUDED.difficulty,
           problem_type = EXCLUDED.problem_type,
           topic        = EXCLUDED.topic,
           track        = EXCLUDED.track,
           category     = EXCLUDED.category,
           explanation  = EXCLUDED.explanation
         RETURNING id, (xmax = 0) AS is_insert;`,
        [
          q.title,
          q.slug,
          q.description,
          q.difficulty,
          q.problem_type || 'mcq',
          q.topic || track,
          track,
          category,
          q.explanation
        ]
      );

      const { id: problemId, is_insert } = res.rows[0];
      if (is_insert) inserted++;
      else updated++;

      // Upsert options: INSERT INTO mcq_options must use: problem_id, option_key, option_text, is_correct
      await client.query('DELETE FROM mcq_options WHERE problem_id = $1', [problemId]);
      for (const opt of q.options) {
        await client.query(
          `INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct)
           VALUES ($1, $2, $3, $4)`,
          [
            problemId,
            opt.option_key || opt.key,
            opt.option_text || opt.text,
            Boolean(opt.is_correct ?? opt.correct)
          ]
        );
      }
    }

    console.log(`Seeding complete: ${inserted} inserted, ${updated} updated (${questions.length} total).`);
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('seed.js')) {
  seedQuestions().then(() => pool.end()).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

export default pool;
