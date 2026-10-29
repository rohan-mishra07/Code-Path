import fs from 'fs';
import path from 'path';

export function getDifficulty(index) {
  const mod = index % 5;
  if (mod === 0 || mod === 1) return 'easy';
  if (mod === 2 || mod === 3) return 'medium';
  return 'hard';
}

export function getAnswerPos(index) {
  return index % 4;
}

/**
 * Creates a validated question object with guaranteed distinct options,
 * correct answer at targetPos (0-3), and no duplicate options.
 */
export function makeQuestion(track, category, topic, difficulty, questionText, correctOpt, wrongOpts = [], targetPos = 0, explanation = '') {
  const cleanQ = questionText.trim();
  const cleanCorrect = String(correctOpt).trim();
  const uniqueWrongs = [];
  const seen = new Set([cleanCorrect.toLowerCase()]);

  // Collect unique provided wrong options
  for (const w of wrongOpts) {
    const cleanW = String(w).trim();
    if (cleanW && !seen.has(cleanW.toLowerCase())) {
      seen.add(cleanW.toLowerCase());
      uniqueWrongs.push(cleanW);
    }
    if (uniqueWrongs.length === 3) break;
  }

  // If fewer than 3 unique wrong options were provided, generate plausible unique fallbacks
  if (uniqueWrongs.length < 3) {
    const isNum = !isNaN(Number(cleanCorrect)) && cleanCorrect !== '';
    if (isNum) {
      const num = Number(cleanCorrect);
      const candidates = [
        num + 1,
        num - 1,
        num + 2,
        num - 2,
        num + 3,
        num * 2,
        0,
        -1
      ].map(String);
      for (const cand of candidates) {
        if (!seen.has(cand.toLowerCase())) {
          seen.add(cand.toLowerCase());
          uniqueWrongs.push(cand);
        }
        if (uniqueWrongs.length === 3) break;
      }
    } else {
      const fallbacks = [
        'None of the above',
        'Undefined behavior',
        'Compilation Error',
        'Runtime Exception',
        'Depends on runtime environment',
        'Not supported in standard specification',
        'Implementation dependent'
      ];
      for (const fb of fallbacks) {
        if (!seen.has(fb.toLowerCase())) {
          seen.add(fb.toLowerCase());
          uniqueWrongs.push(fb);
        }
        if (uniqueWrongs.length === 3) break;
      }
    }
  }

  const options = new Array(4);
  const pos = targetPos % 4;
  options[pos] = cleanCorrect;

  let wrongIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i !== pos) {
      options[i] = uniqueWrongs[wrongIdx++];
    }
  }

  return {
    track,
    category,
    topic,
    difficulty,
    question: cleanQ,
    options,
    answer: pos,
    explanation: (explanation || `The correct answer is "${cleanCorrect}".`).trim()
  };
}

/**
 * Handles batching and appending to a JSON file in batches of 100.
 */
export class BatchFileAppender {
  constructor(filePath, targetCount) {
    this.filePath = filePath;
    this.targetCount = targetCount;
    this.items = [];
    this.seenQuestions = new Set();

    // Start with empty array file
    fs.writeFileSync(this.filePath, '[\n', 'utf-8');
    this.totalWritten = 0;
  }

  add(q) {
    const norm = q.question.toLowerCase().replace(/\s+/g, ' ').trim();
    if (this.seenQuestions.has(norm)) {
      return false; // skip duplicate
    }
    this.seenQuestions.add(norm);
    this.items.push(q);

    // When 100 items accumulated, flush batch
    if (this.items.length >= 100) {
      this.flushBatch();
    }
    return true;
  }

  flushBatch() {
    if (this.items.length === 0) return;
    const batch = this.items.splice(0, this.items.length);

    let chunk = '';
    for (let i = 0; i < batch.length; i++) {
      const isFirstItemEver = (this.totalWritten === 0 && i === 0);
      const prefix = isFirstItemEver ? '  ' : ',\n  ';
      chunk += prefix + JSON.stringify(batch[i]);
    }

    fs.appendFileSync(this.filePath, chunk, 'utf-8');
    this.totalWritten += batch.length;
    console.log(`[${path.basename(this.filePath)}] Appended batch of ${batch.length} (${this.totalWritten}/${this.targetCount})`);
  }

  finalize() {
    // Flush any remaining
    if (this.items.length > 0) {
      this.flushBatch();
    }
    // Close array
    fs.appendFileSync(this.filePath, '\n]\n', 'utf-8');
    console.log(`[${path.basename(this.filePath)}] Complete! Total written: ${this.totalWritten}/${this.targetCount}`);
  }
}

