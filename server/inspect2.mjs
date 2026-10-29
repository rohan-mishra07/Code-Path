import pool from './db.js';

const r = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'user%' ORDER BY table_name`);
console.log('User tables:', r.rows.map(x => x.table_name));

const r2 = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_mcq_attempts' ORDER BY ordinal_position`);
console.log('\nuser_mcq_attempts columns:');
r2.rows.forEach(c => console.log('  ', c.column_name, ':', c.data_type));

const r3 = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'problems' AND column_name IN ('topic','id') ORDER BY ordinal_position`);
console.log('\nproblems relevant cols:', r3.rows);

const r4 = await pool.query(`SELECT topic AS track, COUNT(*)::int AS total FROM problems WHERE problem_type='mcq' GROUP BY topic ORDER BY topic`);
console.log('\nMCQ counts per topic/track:');
r4.rows.forEach(row => console.log(' ', row.track, ':', row.total));

await pool.end();

