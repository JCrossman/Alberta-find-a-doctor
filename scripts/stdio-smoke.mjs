import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdoutBuffer = '';
let stderrBuffer = '';
const pending = new Map();

child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => {
  stderrBuffer += chunk;
});

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdoutBuffer += chunk;
  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop() ?? '';

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const message = JSON.parse(line);
    const resolver = pending.get(message.id);
    if (resolver) {
      pending.delete(message.id);
      resolver(message);
    }
  }
});

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function request(id, method, params = undefined) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}. stderr: ${stderrBuffer}`));
    }, 10_000);

    pending.set(id, (message) => {
      clearTimeout(timer);
      resolve(message);
    });
    send({
      jsonrpc: '2.0',
      id,
      method,
      ...(params === undefined ? {} : { params }),
    });
  });
}

try {
  const initialized = await request(1, 'initialize', {
    capabilities: {},
    clientInfo: {
      name: 'repository-smoke-test',
      version: '1.0.0',
    },
    protocolVersion: '2025-11-25',
  });
  assert.equal(initialized.result?.serverInfo?.name, 'alberta-find-a-doctor');

  send({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  });

  const listed = await request(2, 'tools/list');
  const names = listed.result?.tools?.map((tool) => tool.name).sort();
  assert.deepEqual(names, [
    'find_provider',
    'find_provider_by_language',
    'get_provider_details',
    'search_provider_by_name',
  ]);

  console.log('MCP stdio smoke test passed: 4 tools registered.');
} finally {
  child.stdin.end();
  child.kill('SIGTERM');
}
