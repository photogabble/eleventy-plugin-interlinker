import { fileURLToPath } from 'url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function normalize(str) {
  return str.trim().replace(/\r?\n|\r/g, '');
}

export function consoleMockMessages(mock) {
  let logLines = [];
  for (let i = 0; i < mock.callCount; i++) {
    const line = normalize(mock.getCall(i).args.join(' '))
    // Sometimes 11ty will output benchmark info, failing the test randomly.
    if (line.includes('[11ty]')) continue;
    logLines.push(line);
  }
  return logLines;
}

export function findResultByUrl(results, url) {
  const [result] = results.filter(result => result.url === url);
  return result;
}

export const fixturePath = (p) => path.normalize(path.join(__dirname, 'fixtures', p));
