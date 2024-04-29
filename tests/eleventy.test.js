const test = require("ava");
const Eleventy = require("@11ty/eleventy");
const{normalize} = require('./helpers');

test("Sample page (wikilink from markdown to liquid)", async t => {
  let elev = new Eleventy(`${__dirname}/fixtures/sample-small-website/`, `${__dirname}/fixtures/sample-small-website/_site`, {
    configPath: `${__dirname}/fixtures/sample-small-website/eleventy.config.js`
  });

  let results = await elev.toJSON();

  t.is(2, results.length);

  const [result] = results.filter(result => result.url === '/about/');

  t.is(
    '<p>This is to show that we can link between Markdown files and <a href="/hello/">liquid files</a>.</p>',
    normalize(result.content)
  );
});


