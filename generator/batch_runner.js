import fs from 'fs';
import path from 'path';
import { BatchFileAppender } from './utils.js';
import { generateJavaLanguageQuestions } from './java_language.js';
import { generateJsLanguageQuestions } from './js_language.js';
import { generatePythonLanguageQuestions } from './python_language.js';
import { generateCppLanguageQuestions } from './cpp_language.js';
import { generateDsaQuestions } from './dsa_generator.js';
import { generateCoreCsQuestions } from './core_cs.js';

const rootDir = process.cwd();

async function runTask(taskConfig) {
  const { name, track, category, target, generatorFn, outputFile, aliasFile } = taskConfig;
  const outPath = path.join(rootDir, outputFile);
  console.log(`Starting ${name}: target=${target} -> ${outputFile}`);

  const appender = new BatchFileAppender(outPath, target);
  const questions = generatorFn(target);

  for (const q of questions) {
    appender.add(q);
    if (appender.totalWritten + appender.items.length >= target) {
      break;
    }
  }

  appender.finalize();

  if (aliasFile) {
    const aliasPath = path.join(rootDir, aliasFile);
    fs.copyFileSync(outPath, aliasPath);
    console.log(`[${name}] Copied alias to ${aliasFile}`);
  }

  console.log(`[${name}] Finished successfully.`);
}

export async function runAllInParallel() {
  const tasks = [
    {
      name: 'Java Language',
      track: 'Java + DSA',
      category: 'language',
      target: 1000,
      generatorFn: (t) => generateJavaLanguageQuestions(t),
      outputFile: 'questions_java-dsa_language.json'
    },
    {
      name: 'Java DSA',
      track: 'Java + DSA',
      category: 'dsa',
      target: 1000,
      generatorFn: (t) => generateDsaQuestions('Java + DSA', t),
      outputFile: 'questions_java-dsa_dsa.json'
    },
    {
      name: 'JavaScript Language',
      track: 'JavaScript + DSA',
      category: 'language',
      target: 1000,
      generatorFn: (t) => generateJsLanguageQuestions(t),
      outputFile: 'questions_javascript-dsa_language.json'
    },
    {
      name: 'JavaScript DSA',
      track: 'JavaScript + DSA',
      category: 'dsa',
      target: 1000,
      generatorFn: (t) => generateDsaQuestions('JavaScript + DSA', t),
      outputFile: 'questions_javascript-dsa_dsa.json'
    },
    {
      name: 'Python Language',
      track: 'Python + DSA',
      category: 'language',
      target: 1000,
      generatorFn: (t) => generatePythonLanguageQuestions(t),
      outputFile: 'questions_python-dsa_language.json'
    },
    {
      name: 'Python DSA',
      track: 'Python + DSA',
      category: 'dsa',
      target: 1000,
      generatorFn: (t) => generateDsaQuestions('Python + DSA', t),
      outputFile: 'questions_python-dsa_dsa.json'
    },
    {
      name: 'C++ Language',
      track: 'C++ + DSA',
      category: 'language',
      target: 1000,
      generatorFn: (t) => generateCppLanguageQuestions(t),
      outputFile: 'questions_cpp-dsa_language.json',
      aliasFile: 'questions_c++-dsa_language.json'
    },
    {
      name: 'C++ DSA',
      track: 'C++ + DSA',
      category: 'dsa',
      target: 1000,
      generatorFn: (t) => generateDsaQuestions('C++ + DSA', t),
      outputFile: 'questions_cpp-dsa_dsa.json',
      aliasFile: 'questions_c++-dsa_dsa.json'
    },
    {
      name: 'Core CS Fundamentals',
      track: 'Core CS Fundamentals',
      category: 'core',
      target: 2000,
      generatorFn: (t) => generateCoreCsQuestions(t),
      outputFile: 'questions_core-cs-fundamentals_core.json'
    }
  ];

  console.log(`Starting all 9 tasks in parallel...`);
  const startTime = Date.now();
  await Promise.all(tasks.map(runTask));
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nALL 9 RUNS COMPLETED IN PARALLEL in ${elapsed}s!`);
}

if (process.argv[1] && process.argv[1].endsWith('batch_runner.js')) {
  runAllInParallel().catch(err => {
    console.error('Batch runner error:', err);
    process.exit(1);
  });
}

