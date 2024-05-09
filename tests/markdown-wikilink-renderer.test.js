const {wikilinkInlineRule, wikilinkRenderRule} = require('../src/markdown-ext');
const WikilinkParser = require('../src/wikilink-parser');
const {normalize} = require('./helpers');
const test = require('ava');
const fs = require('fs');

const opts = {};

test('inline rule correctly parses single wikilink', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);

  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki Link',
    link: '[[wiki link]]',
    href: '/wiki-link/',
    content: '<a href="/wiki-link/">Wiki Link</a>',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule();

  t.is(
    "<p>Hello world, this is some text with a <a href=\"/wiki-link/\">Wiki Link</a> inside!</p>\n",
    md.render('Hello world, this is some text with a [[wiki link]] inside!', {})
  );
});

test('inline rule correctly parses multiple wikilinks', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);

  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki Link',
    link: '[[wiki link]]',
    href: '/wiki-link/',
    content: '<a href="/wiki-link/">Wiki Link</a>',
    isEmbed: false,
  });

  wikilinkParser.linkCache.set('[[another wiki link]]', {
    title: 'Another Wiki Link',
    link: '[[another wiki link]]',
    href: '/another-wiki-link/',
    content: '<a href="/another-wiki-link/">Another Wiki Link</a>',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule();

  t.is(
    "<p>Hello world, this is some text with a <a href=\"/wiki-link/\">Wiki Link</a> inside! There is also <a href=\"/another-wiki-link/\">Another Wiki Link</a> in the same string.</p>\n",
    md.render('Hello world, this is some text with a [[wiki link]] inside! There is also [[another wiki link]] in the same string.', {})
  );
});

test('inline rule correctly parses single embed', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);

  wikilinkParser.linkCache.set('![[wiki-embed]]', {
    title: 'Wiki Embed',
    href: '/wiki-embed/',
    link: '![[wiki-embed]]',
    content: '<span>Wiki Embed Test</span>',
    isEmbed: true,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule();

  t.is(
    md.render('Hello world this is a ![[wiki-embed]]'),
    "<p>Hello world this is a <span>Wiki Embed Test</span></p>\n"
  );
});

test('inline rule correctly parses mixed wikilink and embed in multiline input', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);

  wikilinkParser.linkCache.set('![[inline embed]]', {
    title: 'Inline Embed',
    link: '![[inline embed]]',
    href: '/inline-embed/',
    content: '<span>inline embed</span>',
    isEmbed: true,
  });

  wikilinkParser.linkCache.set('![[this is an embed on its own]]', {
    title: 'This is an embed on its own',
    link: '![[this is an embed on its own]]',
    href: '/lonely-embed/',
    content: '<div>Embed on its own</div>',
    isEmbed: true,
  });

  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki Link',
    link: '[[wiki link]]',
    href: '/wiki-link/',
    content: '<a href="/wiki-link/">Wiki Link</a>',
    isEmbed: false,
  });

  wikilinkParser.linkCache.set('[[wiki link|Wikilinks]]', {
    title: 'Wikilinks',
    link: '[[wiki link|Wikilinks]]',
    href: '/wiki-link/',
    content: '<a href="/wiki-link/">Wikilinks</a>',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule();

  const markdown = fs.readFileSync(__dirname + '/fixtures/multiline.md', {encoding:'utf8', flag:'r'});
  const html = fs.readFileSync(__dirname + '/fixtures/multiline.html', {encoding:'utf8', flag:'r'});

  t.is(
    normalize(md.render(markdown)),
    normalize(html)
  );
});
