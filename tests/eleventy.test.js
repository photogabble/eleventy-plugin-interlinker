const test = require("ava");
const Eleventy = require("@11ty/eleventy");
const {normalize} = require('./helpers');
const path = require('node:path');

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

  t.is(2, results.length);

  t.is(
    `<div><p>This is to show that we can link between Markdown files and <a href="/hello/">liquid files</a>.</p></div><div><a href="/hello/">Hello</a></div>`,
    normalize(findResultByUrl(results, '/about/').content)
  );

  t.is(
    '<div>This is to show that we can link back via <a href="/about">regular <em>internal</em> links</a>.</div><div><a href="/about/">About</a></div>',
    normalize(findResultByUrl(results, '/hello/').content)
  );
});
