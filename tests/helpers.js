const path = require("node:path");

function normalize(str) {
  return str.trim().replace(/\r?\n|\r/g, '');
}

function consoleMockMessages(mock) {
  let logLines = [];
  for (let i = 0; i < mock.callCount; i++) {
    const line = normalize(mock.getCall(i).args.join(' '))
    // Sometimes 11ty will output benchmark info, failing the test randomly.
    if (line.includes('[11ty]')) continue;
    logLines.push(line);
  }
  return logLines;
}

function findResultByUrl(results, url) {
  const [result] = results.filter(result => result.url === url);
  return result;
}

const fixturePath = (p) => path.normalize(path.join(__dirname, 'fixtures', p));

module.exports = {
  normalize,
  consoleMockMessages,
  findResultByUrl,
  fixturePath,
}
