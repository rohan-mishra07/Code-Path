import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { makeQuestion, getDifficulty, getAnswerPos } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateCoreCsQuestions(targetCount = 2000) {
  const dataPath = path.join(__dirname, 'core_cs_data.json');
  const items = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const track = 'Core CS Fundamentals';
  const category = 'core';

  const questions = [];
  const count = Math.min(items.length, targetCount);

  for (let i = 0; i < count; i++) {
    const item = items[i];
    const diff = getDifficulty(i);
    const pos = getAnswerPos(i);
    const q = makeQuestion(track, category, item.topic, diff, item.q, item.c, item.w, pos, item.exp);
    questions.push(q);
  }

  return questions;
}

