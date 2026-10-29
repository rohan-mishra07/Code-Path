import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const serverPath = path.join(__dirname, 'server.js');
  const server = spawn('node', [serverPath], {
    cwd: __dirname,
  });

  server.stdout.on('data', (d) => process.stdout.write(`[SERVER] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

  // Wait 3 seconds for server to start
  await new Promise((res) => setTimeout(res, 3000));

  try {
    const testPath = path.join(__dirname, 'test_limits.mjs');
    const test = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: __dirname,
    });

    await new Promise((resolve, reject) => {
      test.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Test exited with code ${code}`));
      });
      test.on('error', reject);
    });
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error('Runner failed:', err);
  process.exit(1);
});

