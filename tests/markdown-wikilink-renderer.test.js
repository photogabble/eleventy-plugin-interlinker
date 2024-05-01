const {wikilinkInlineRule, wikilinkRenderRule} = require('../src/markdown-ext');
const WikilinkParser = require('../src/wikilink-parser');
const {normalize} = require('./helpers');
const slugify = require('slugify');
const test = require('ava');
const fs = require('fs');

const opts = {
  slugifyFn: (text) => slugify(text),
};

test('inline rule correctly parses single wikilink', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  const compiledEmbeds = new Map;

  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki Link',
    href: '/wiki-link/',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    compiledEmbeds,
    opts
  );

  t.is(
    "<p>Hello world, this is some text with a <a href=\"/wiki-link/\">Wiki Link</a> inside!</p>\n",
    md.render('Hello world, this is some text with a [[wiki link]] inside!', {})
  );
});

test('inline rule correctly parses multiple wikilinks', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  const compiledEmbeds = new Map;

  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki Link',
    href: '/wiki-link/',
    isEmbed: false,
  });

  wikilinkParser.linkCache.set('[[another wiki link]]', {
    title: 'Another Wiki Link',
    href: '/another-wiki-link/',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    compiledEmbeds,
    opts
  );

  t.is(
    "<p>Hello world, this is some text with a <a href=\"/wiki-link/\">Wiki Link</a> inside! There is also <a href=\"/another-wiki-link/\">Another Wiki Link</a> in the same string.</p>\n",
    md.render('Hello world, this is some text with a [[wiki link]] inside! There is also [[another wiki link]] in the same string.', {})
  );
});

test('inline rule correctly parses single embed', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  const compiledEmbeds = new Map;

  wikilinkParser.linkCache.set('![[wiki-embed]]', {
    title: 'Wiki Embed',
    href: '/wiki-embed/',
    isEmbed: true,
  });

  compiledEmbeds.set('/wiki-embed/', '<span>Wiki Embed Test</span>');

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    compiledEmbeds,
    opts
  );

  t.is(
    md.render('Hello world this is a ![[wiki-embed]]'),
    "<p>Hello world this is a <span>Wiki Embed Test</span></p>\n"
  );
});

test('inline rule correctly parses mixed wikilink and embed in multiline input', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  const compiledEmbeds = new Map;

  wikilinkParser.linkCache.set('![[inline embed]]', {
    title: 'Inline Embed',
    href: '/inline-embed/',
    isEmbed: true,
  });

  wikilinkParser.linkCache.set('![[this is an embed on its own]]', {
    title: 'This is an embed on its own',
    href: '/lonely-embed/',
    isEmbed: true,
  });

  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki Link',
    href: '/wiki-link/',
    isEmbed: false,
  });

  wikilinkParser.linkCache.set('[[wiki link|Wikilinks]]', {
    title: 'Wikilinks',
    href: '/wiki-link/',
    isEmbed: false,
  });

  compiledEmbeds.set('/inline-embed/', '<span>inline embed</span>');
  compiledEmbeds.set('/lonely-embed/', '<div>Embed on its own</div>');

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    compiledEmbeds,
    opts
  );

  const markdown = fs.readFileSync(__dirname + '/fixtures/multiline.md', {encoding:'utf8', flag:'r'});
  const html = fs.readFileSync(__dirname + '/fixtures/multiline.html', {encoding:'utf8', flag:'r'});

  t.is(
    normalize(md.render(markdown)),
    normalize(html)
  );
});

test('inline rule correctly displays unable to load embed content', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  const compiledEmbeds = new Map;

  wikilinkParser.linkCache.set('![[wiki-embed]]', {
    title: 'Wiki Embed',
    href: '/wiki-embed/',
    link: '![[wiki-embed]]',
    isEmbed: true,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    compiledEmbeds,
    {
      ...opts,
      unableToLocateEmbedFn: () => '[TESTING]'
    }
  );

  t.is(
    md.render('Hello world this is a ![[wiki-embed]]'),
    "<p>Hello world this is a [TESTING]</p>\n"
  );
})
