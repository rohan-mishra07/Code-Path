import fs from 'fs';
import path from 'path';

const filesToValidate = [
  { file: 'questions_java-dsa_language.json', target: 1000, track: 'Java + DSA', category: 'language' },
  { file: 'questions_java-dsa_dsa.json', target: 1000, track: 'Java + DSA', category: 'dsa' },
  { file: 'questions_javascript-dsa_language.json', target: 1000, track: 'JavaScript + DSA', category: 'language' },
  { file: 'questions_javascript-dsa_dsa.json', target: 1000, track: 'JavaScript + DSA', category: 'dsa' },
  { file: 'questions_python-dsa_language.json', target: 1000, track: 'Python + DSA', category: 'language' },
  { file: 'questions_python-dsa_dsa.json', target: 1000, track: 'Python + DSA', category: 'dsa' },
  { file: 'questions_cpp-dsa_language.json', target: 1000, track: 'C++ + DSA', category: 'language' },
  { file: 'questions_cpp-dsa_dsa.json', target: 1000, track: 'C++ + DSA', category: 'dsa' },
  { file: 'questions_core-cs-fundamentals_core.json', target: 2000, track: 'Core CS Fundamentals', category: 'core' }
];

const requiredFields = [
  'track',
  'category',
  'topic',
  'difficulty',
  'question',
  'options',
  'answer',
  'explanation'
];

export function validateAll() {
  console.log('='.repeat(80));
  console.log('STARTING VALIDATION ACROSS ALL QUESTION BANK FILES');
  console.log('='.repeat(80));

  let totalQuestionsValidated = 0;
  let totalErrors = 0;
  const summaries = [];

  for (const { file, target, track, category } of filesToValidate) {
    const filePath = path.join(process.cwd(), file);
    console.log(`\nValidating ${file} (Target: ${target})...`);

    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: File not found: ${file}`);
      totalErrors++;
      continue;
    }

    let questions;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      questions = JSON.parse(raw);
    } catch (e) {
      console.error(`ERROR: Invalid JSON in ${file}:`, e.message);
      totalErrors++;
      continue;
    }

    if (!Array.isArray(questions)) {
      console.error(`ERROR: ${file} does not contain a JSON array.`);
      totalErrors++;
      continue;
    }

    let fileErrors = 0;
    const seenQuestions = new Set();
    const topicCounts = {};
    const diffCounts = { easy: 0, medium: 0, hard: 0 };
    const answerCounts = [0, 0, 0, 0];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const prefix = `[${file} Q#${i + 1}]`;

      // Check all required fields present
      for (const field of requiredFields) {
        if (q[field] === undefined || q[field] === null || q[field] === '') {
          console.error(`${prefix} Missing required field: "${field}"`);
          fileErrors++;
        }
      }

      // Track and category check
      if (q.track !== track) {
        console.error(`${prefix} Track mismatch: expected "${track}", got "${q.track}"`);
        fileErrors++;
      }
      if (q.category !== category) {
        console.error(`${prefix} Category mismatch: expected "${category}", got "${q.category}"`);
        fileErrors++;
      }

      // Options check
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        console.error(`${prefix} Expected exactly 4 options, got ${q.options ? q.options.length : 0}`);
        fileErrors++;
      } else {
        const optSet = new Set();
        for (const opt of q.options) {
          const normOpt = String(opt).toLowerCase().trim();
          if (optSet.has(normOpt)) {
            console.error(`${prefix} Duplicate option inside question: "${opt}"`);
            fileErrors++;
          }
          optSet.add(normOpt);
        }
      }

      // Answer check
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
        console.error(`${prefix} Invalid answer index: ${q.answer} (must be 0-3)`);
        fileErrors++;
      } else {
        answerCounts[q.answer]++;
      }

      // Difficulty check
      if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
        console.error(`${prefix} Invalid difficulty: "${q.difficulty}"`);
        fileErrors++;
      } else {
        diffCounts[q.difficulty]++;
      }

      // Topic count
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;

      // Duplicate question check (case-insensitive)
      const normQ = String(q.question).toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenQuestions.has(normQ)) {
        console.error(`${prefix} Duplicate question text detected: "${q.question.slice(0, 60)}..."`);
        fileErrors++;
      }
      seenQuestions.add(normQ);
    }

    if (questions.length !== target) {
      console.error(`ERROR: ${file} count mismatch: expected ${target}, found ${questions.length}`);
      fileErrors++;
    }

    totalQuestionsValidated += questions.length;
    totalErrors += fileErrors;

    const summary = {
      file,
      target,
      count: questions.length,
      errors: fileErrors,
      diffCounts,
      answerCounts,
      topicCounts
    };
    summaries.push(summary);

    if (fileErrors === 0) {
      console.log(`PASSED: ${file} is 100% valid!`);
    } else {
      console.error(`FAILED: ${file} encountered ${fileErrors} errors!`);
    }
  }

  // Print final formatted report
  console.log('\n' + '='.repeat(80));
  console.log('FINAL VALIDATION SUMMARY REPORT');
  console.log('='.repeat(80));

  for (const s of summaries) {
    console.log(`\nFILE: ${s.file}`);
    console.log(`Total Valid Questions: ${s.count} / ${s.target} (Errors: ${s.errors})`);
    console.log('Difficulty Breakdown:');
    console.log(`  - Easy:   ${s.diffCounts.easy} (${((s.diffCounts.easy / s.count) * 100).toFixed(1)}%)`);
    console.log(`  - Medium: ${s.diffCounts.medium} (${((s.diffCounts.medium / s.count) * 100).toFixed(1)}%)`);
    console.log(`  - Hard:   ${s.diffCounts.hard} (${((s.diffCounts.hard / s.count) * 100).toFixed(1)}%)`);
    console.log('Answer Key Balance:');
    console.log(`  - [0]: ${s.answerCounts[0]} (${((s.answerCounts[0] / s.count) * 100).toFixed(1)}%)`);
    console.log(`  - [1]: ${s.answerCounts[1]} (${((s.answerCounts[1] / s.count) * 100).toFixed(1)}%)`);
    console.log(`  - [2]: ${s.answerCounts[2]} (${((s.answerCounts[2] / s.count) * 100).toFixed(1)}%)`);
    console.log(`  - [3]: ${s.answerCounts[3]} (${((s.answerCounts[3] / s.count) * 100).toFixed(1)}%)`);
    console.log('Topic Distribution:');
    for (const [top, cnt] of Object.entries(s.topicCounts)) {
      console.log(`  - ${top}: ${cnt}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`GRAND TOTAL: ${totalQuestionsValidated} / 10000 questions validated across 9 runs.`);
  console.log(`TOTAL ERRORS: ${totalErrors}`);
  console.log('='.repeat(80));

  if (totalErrors > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('validate.js')) {
  validateAll();
}

