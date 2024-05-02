const Eleventy = require("@11ty/eleventy");
const path = require('node:path');
const {normalize} = require('./helpers');
const sinon = require('sinon');
const test = require("ava");

function findResultByUrl(results, url) {
  const [result] = results.filter(result => result.url === url);
  return result;
}

const fixturePath = (p) => path.normalize(path.join(__dirname, 'fixtures', p));

test("Sample page (wikilinks and regular links)", async t => {
  let elev = new Eleventy(fixturePath('sample-small-website'), fixturePath('sample-small-website/_site'), {
    configPath: fixturePath('sample-small-website/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  t.is(results.length, 2);

  t.is(
    normalize(findResultByUrl(results, '/about/').content),
    `<div><p>This is to show that we can link between Markdown files and <a href="/hello/">liquid files</a>.</p></div><div><a href="/hello/">Hello</a></div>`
  );

  t.is(
    normalize(findResultByUrl(results, '/hello/').content),
    '<div>This is to show that we can link back via <a href="/about">regular <em>internal</em> links</a>.</div><div><a href="/about/">About</a></div>',
  );
});

test("Broken page (wikilinks and regular links)", async t => {
  const messages = [];
  const consoleStub = sinon.stub(console, 'warn').callsFake(msg => messages.push());

  let elev = new Eleventy(fixturePath('website-with-broken-links'), fixturePath('website-with-broken-links/_site'), {
    configPath: fixturePath('website-with-broken-links/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  let logLines = [];
  for (let i = 0; i < consoleStub.callCount; i++) {
    const line = normalize(consoleStub.getCall(i).args.join(' '))
    // Sometimes 11ty will output benchmark info, failing the test randomly.
    if (line.includes('[11ty]')) continue;
    logLines.push(line);
  }

  consoleStub.restore();

  // Markdown will have the link href set to /stubs
  t.is(
    normalize(findResultByUrl(results, '/something/').content),
    `<div><p>This page has a <a href="/stubs">broken link</a>.</p></div>`
  );

  // HTML
  t.is(
    normalize(findResultByUrl(results, '/hello/').content),
    `<div>This is to show that we can identify <a href="/broken">broken <em>internal</em> links</a>.</div>`
  );

  t.is(logLines.length, 4, 'console.warn should be called three times');
});

test("Sample page (with embed)", async t => {
  let elev = new Eleventy(fixturePath('sample-with-simple-embed'), fixturePath('sample-with-simple-embed/_site'), {
    configPath: fixturePath('sample-with-simple-embed/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  // Embedded page is aware of its embedding
  t.is(
    normalize(findResultByUrl(results, '/about/').content),
    `<div><p>Hello world.</p></div><div><a href="/">Homepage</a></div>`
  );

  // Embed shows
  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p><p>Hello world.</p></p></div><div></div>`
  );
});
