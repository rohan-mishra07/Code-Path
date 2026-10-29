import fs from 'fs';
import path from 'path';

// Helper to write a JS module exporting a function returning array of { q, c, w, exp }
export function writeTopicModule(fileName, exportName, questions) {
  const filePath = path.join(process.cwd(), 'generator', fileName);
  const code = `// Auto-generated topic questions for ${fileName}
export function ${exportName}() {
  return ${JSON.stringify(questions, null, 2)};
}
`;
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log(`Wrote ${questions.length} questions to ${fileName}`);
}

