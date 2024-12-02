import Eleventy from '@11ty/eleventy';
import {normalize, consoleMockMessages, findResultByUrl, fixturePath} from './helpers.js';
import fs from 'node:fs';
import sinon from 'sinon';
import test from 'ava';

// NOTE: Tests using sinon to mock console.warn need to be run with
// `test.serial` so that they don't run at the same time as one another to
// avoid the "Attempted to wrap warn which is already wrapped" error.
// @see https://stackoverflow.com/a/37900956/1225977

test.afterEach(() => {
  const deadLinksPathname = fixturePath('website-with-custom-resolving-fn/.dead-links.json');
  if (fs.existsSync(deadLinksPathname)) {
    fs.rmSync(deadLinksPathname);
  }
})

test("Sample small Website (wikilinks and regular links)", async t => {
  let elev = new Eleventy(fixturePath('sample-small-website'), fixturePath('sample-small-website/_site'), {
    configPath: fixturePath('sample-small-website/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  t.is(results.length, 10);

  t.is(
    normalize(findResultByUrl(results, '/about/').content),
    `<div><p>This is to show that we can link between Markdown files and <a href="/hello/">liquid files</a>.</p></div><div><a href="/hello/">Hello</a></div>`
  );

  t.is(
    normalize(findResultByUrl(results, '/hello/').content),
    '<div>This is to show that we can link back via <a href="/about">regular <em>internal</em> links</a>.</div><div><a href="/about/">About</a></div>',
  );
});

test("Sample small Website (hash in page title)", async t => {
  let elev = new Eleventy(fixturePath('sample-small-website'), fixturePath('sample-small-website/_site'), {
    configPath: fixturePath('sample-small-website/eleventy.config.js'),
  });

  let results = await elev.toJSON();
  t.is(
    normalize(findResultByUrl(results, '/linking-to-hash-in-title/').content),
    `<p>This should work: <a href="/hash-in-title/">Building a self-contained game in C&num; under 2 kilobytes</a>.</p>`
  );
});

test("Sample small Website (path links)", async t => {
  let elev = new Eleventy(fixturePath('sample-small-website'), fixturePath('sample-small-website/_site'), {
    configPath: fixturePath('sample-small-website/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  // page-b is linked to from page-a
  // path-link-outer is linked to from page-a

  t.is(
    normalize(findResultByUrl(results, '/path-links/page-a/').content),
    `<div><p>We can Wikilink reference <a href="/path-links/hello/world/page-b/">by full project path</a>, and <a href="/path-links/hello/world/page-b/">by relative path</a> from current file path <a href="/path-link-outer/">Relative page up directory</a>.</p></div><div></div>`
  );

  t.is(
    normalize(findResultByUrl(results, '/path-links/hello/world/page-b/').content),
    `<div><p>This is Page B.</p></div><div><a href="/path-links/page-a/">Path Link Page A</a></div>`
  );

  t.is(
    normalize(findResultByUrl(results, '/path-link-outer/').content),
    `<div><p>Path Link test page</p></div><div><a href="/path-links/page-a/">Path Link Page A</a></div>`,
  );
});

test("Sample small Website (html entities)", async t => {
  let elev = new Eleventy(fixturePath('sample-small-website'), fixturePath('sample-small-website/_site'), {
    configPath: fixturePath('sample-small-website/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  t.is(
    normalize(findResultByUrl(results, '/linking-to-lonelyjuly/').content),
    `<div><p><a href="/lonelyjuly/">&gt;&gt;LONELYJULY&lt;&lt;</a> website.</p></div><div></div>`
  );
});

test("Sample small Website (alias text used for link)", async t => {
  let elev = new Eleventy(fixturePath('sample-small-website'), fixturePath('sample-small-website/_site'), {
    configPath: fixturePath('sample-small-website/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  t.is(
    normalize(findResultByUrl(results, '/aliased-link-to-lonelyjuly/').content),
    `<div><p>This should link with the alias as text <a href="/lonelyjuly/">Aliased WikiLink</a>.</p></div><div></div>`
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
    `<div><p>This page has a <a href="/stubs/">broken link</a>.</p></div>`
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
    `<div><p>Hello world.</p></div><div></div>`
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
    `<div><p>This wikilink to <a href="/stubs/">something</a> will not parse because the destination has eleventyExcludeFromCollections set true.</p></div><div></div>`
  );

  // Embed shows
  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p>Hello World, no links, wiki or otherwise will be parsed by the interlinker due to being excluded from collections.</p></div><div></div>`
  );
});

test("Sample page (files with hash in title)", async t => {
  let elev = new Eleventy(fixturePath('sample-with-hash-in-title'), fixturePath('sample-with-hash-in-title/_site'), {
    configPath: fixturePath('sample-with-hash-in-title/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  // Linked page is aware of its linking
  t.is(
    normalize(findResultByUrl(results, '/page/hello/').content),
    `<div><p>Howdy!</p></div><div><a href="/">Something</a></div>`
  );

  // Embedded page is aware of its embedding
  t.is(
    normalize(findResultByUrl(results, '/building-a-self-contained-game-in-c-under-2-kilobytes/').content),
    `<div><p>Hello world.</p></div><div><a href="/">Something</a></div>`
  );

  // Embed shows
  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p>This link should be to <a href="/page/hello/#some-heading">a fragment identifier</a>.</p><p>Hello world.</p></div><div></div>`
  );
});

test("Sample with simple embed (broken embed)", async t => {
  let elev = new Eleventy(fixturePath('sample-with-simple-embed'), fixturePath('sample-with-simple-embed/_site'), {
    configPath: fixturePath('sample-with-simple-embed/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  // Bad Wikilink Embed shows default text
  t.is(
    normalize(findResultByUrl(results, '/broken/').content),
    `<div>[UNABLE TO LOCATE EMBED]</div><div></div>`
  );
});

/**
 * Test that permalink frontmatter is used for the Wikilinks href as raised in issue #43.
 * @see https://github.com/photogabble/eleventy-plugin-interlinker/issues/43
 */
test("Permalink should be used for link href", async t => {
  let elev = new Eleventy(fixturePath('website-with-permalink'), fixturePath('website-with-permalink/_site'), {
    configPath: fixturePath('website-with-permalink/eleventy.config.js'),
  });

  let results = await elev.toJSON();

  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p>Link to <a href="/wlink-tst/">Wikilink test</a> should be to <code>/wlink-tst/</code>.</p></div><div></div>`
  );

  t.is(
    normalize(findResultByUrl(results, '/wlink-tst/').content),
    `<div><p>Hello World!</p></div><div><a href="/">Homepage</a></div>`
  );
});

/**
 * This test checks that custom resolving functions are invoked if they exist, and if not
 * an exception isn't thrown if the page can be looked up (see issue #50).
 *
 * Must be serial test due to usage of fs.existsSync, which will pass when running as a
 * single test, but fail when run as part of a parallel set.
 */
test.serial("Custom resolving functions (are invoked)", async t => {
  let elev = new Eleventy(fixturePath('website-with-custom-resolving-fn'), fixturePath('website-with-custom-resolving-fn/_site'), {
    configPath: fixturePath('website-with-custom-resolving-fn/eleventy.config.js'),
  });

  // TODO: move this to another test
  t.false(fs.existsSync(fixturePath('website-with-custom-resolving-fn/.dead-links.json')));

  let results = await elev.toJSON();

  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p>These wikilinks use custom resolving functions:</p><ul><li>Hello RWC!</li><li><a href="https://github.com/photogabble/eleventy-plugin-interlinker/issues/19">#19</a></li><li><a href="/php-space-mines-introduction/">Moon Miner</a></li></ul></div><div></div>`
  );

  t.true(fs.existsSync(fixturePath('website-with-custom-resolving-fn/.dead-links.json')));
});

/**
 * This test must be run serially as the exception being thrown appears to interfere
 * with other tests.
 */
test.serial("Custom resolving functions (throw exception on not found)", async t => {
  let elev = new Eleventy(fixturePath('website-with-broken-resolving-fn'), fixturePath('website-with-broken-resolving-fn/_site'), {
    configPath: fixturePath('website-with-broken-resolving-fn/eleventy.config.js'),
  });

  // Disable the console log output of 11tys error handler
  const errorHandler = elev.errorHandler;
  errorHandler.log = () => {};

  const error = await t.throwsAsync(elev.toJSON());
  t.is(error.message, 'Unable to find resolving fn [PHP Space Mines] for wikilink [[PHP Space Mines: Introduction|Moon Miner]] on page [/index]');
});

test("Stub URL Config (can be customised)", async t => {
  let elev = new Eleventy(fixturePath('website-with-custom-stub-url'), fixturePath('website-with-custom-stub-url/_site'), {
    configPath: fixturePath('website-with-custom-stub-url/eleventy.config.js'),
  });

  const results = await elev.toJSON();

  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p>Broken link with custom stub url <a href="/custom-stub-url/">broken link</a>.</p></div>`
  );
})

test("Stub URL Config (can be disabled)", async t => {
  let elev = new Eleventy(fixturePath('website-with-disabled-stub-url'), fixturePath('website-with-disabled-stub-url/_site'), {
    configPath: fixturePath('website-with-disabled-stub-url/eleventy.config.js'),
  });

  const results = await elev.toJSON();

  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<div><p>Broken link with custom stub url [[ broken link ]].</p></div>`
  );
})

test("Embedded file shortcodes get run", async t => {
  let elev = new Eleventy(fixturePath('website-with-liquid-embed-shortcode'), fixturePath('website-with-liquid-embed-shortcode/_site'), {
    configPath: fixturePath('website-with-liquid-embed-shortcode/eleventy.config.js'),
  });

  const results = await elev.toJSON();
  t.is(
    normalize(findResultByUrl(results, '/').content),
    `<h1>Embed Below</h1><figure>Hello world</figure><h1>Embed 2 Below</h1><div><figure>Hello world</figure></div>`
  );
});

test("Wikilinks within code blocks get ignored", async t => {
  let elev = new Eleventy(fixturePath('website-with-embeds'), fixturePath('website-with-embeds/_site'), {
    configPath: fixturePath('website-with-embeds/eleventy.config.js'),
  });

  const results = await elev.toJSON();
  t.is(
    normalize(findResultByUrl(results, '/within-code/').content),
    `<h1>Test Markdown File</h1><pre><code>[[Wiki Link]]</code></pre><p>This contains a wiki link <code>[[Wiki Link]]</code> within an inline code element. This sentence does not: <a href="/wiki-link/">Wiki Link</a>.</p>`
  );
});
