const Eleventy = require("@11ty/eleventy");
const path = require('node:path');
const {normalize, consoleMockMessages, findResultByUrl, fixturePath} = require('./helpers');
const test = require("ava");
const sinon = require("sinon");

// NOTE: Tests using sinon to mock console.warn need to be run with
// `test.serial` so that they don't run at the same time as one another to
// avoid the "Attempted to wrap warn which is already wrapped" error.
// @see https://stackoverflow.com/a/37900956/1225977

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

test.serial("Broken page (wikilinks and regular links)", async t => {
  const mock = sinon.stub(console, 'warn');

  let elev = new Eleventy(fixturePath('website-with-broken-links'), fixturePath('website-with-broken-links/_site'), {
    configPath: fixturePath('website-with-broken-links/eleventy.config.js'),
  });

  let results = await elev.toJSON();
  mock.restore();

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

  t.is(consoleMockMessages(mock).length, 4, 'console.warn should be called four times');
});

test("Sample page (markdown with embed)", async t => {
  let elev = new Eleventy(fixturePath('sample-with-simple-embed'), fixturePath('sample-with-simple-embed/_site'), {
    configPath: fixturePath('sample-with-simple-embed/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  // Embedded page is aware of its embedding
  t.is(
    normalize(findResultByUrl(results, '/about/').content),
    `<div><p>Hello world.</p></div><div><a href="/">Something</a></div>`
  );

  // Embed shows
  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p><p>Hello world.</p></p></div><div></div>`
  );
});

test.serial("Sample page (eleventyExcludeFromCollections set true)", async t => {
  const mock = sinon.stub(console, 'warn');

  let elev = new Eleventy(fixturePath('sample-with-excluded-file'), fixturePath('sample-with-excluded-file/_site'), {
    configPath: fixturePath('sample-with-excluded-file/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  mock.restore();
  t.is(consoleMockMessages(mock).length, 2, 'console.warn should be called twice');

  // Embedded page is aware of its embedding
  t.is(
    normalize(findResultByUrl(results, '/about/').content),
    `<div><p>This wikilink to <a href="/stubs">something</a> will not parse because the destination has eleventyExcludeFromCollections set true.</p></div><div></div>`
  );

  // Embed shows
  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p>Hello World, no links, wiki or otherwise will be parsed by the interlinker due to being excluded from collections.</p></div><div></div>`
  );
});
