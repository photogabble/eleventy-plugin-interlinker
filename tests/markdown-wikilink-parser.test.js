const {wikilinkInlineRule} = require('../src/markdown-ext');
const WikilinkParser = require('../src/wikilink-parser');
const slugify = require('slugify');
const test = require('ava');

const opts = {slugifyFn: (text) => slugify(text)};

test('inline rule correctly parses single wikilink', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki link',
    href: '/test/',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  const parsed = md.parseInline('Hello world, this is some text with a [[wiki link]] inside!', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 3);
  t.is(parsed[0].children.filter(child => child.type === 'inline_wikilink').length, 1);
});

test('inline rule correctly parses multiple wikilink', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  wikilinkParser.linkCache.set('[[wiki links]]', {
    title: 'Wiki link',
    slug: 'wiki-links',
    href: '/test/',
    isEmbed: false,
  });
  wikilinkParser.linkCache.set('[[here]]', {
    title: 'here',
    slug: 'here',
    href: '/here/',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  const parsed = md.parseInline('Hello world, this is some text with two [[wiki links]] inside! The second one is [[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 5);
  t.is(parsed[0].children.filter(child => child.type === 'inline_wikilink').length, 2);
  t.is(parsed[0].children[1].meta.slug, 'wiki-links');
  t.is(parsed[0].children[3].meta.slug, 'here');
});

test('inline rule correctly parses single wikilink embed', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  wikilinkParser.linkCache.set('![[wiki link embed]]', {
    title: 'wiki link embed',
    slug: 'wiki-link-embed',
    href: '/test/',
    isEmbed: true,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  const parsed = md.parseInline('Hello world, this is some text with a ![[wiki link embed]] inside!', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 3);
  t.is(parsed[0].children.filter(child => child.type === 'inline_wikilink').length, 1);
});

test('inline rule correctly parses multiple wikilink embeds', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  wikilinkParser.linkCache.set('![[wiki link embeds]]', {
    title: 'wiki link embed',
    slug: 'wiki-link-embed',
    href: '/test/',
    isEmbed: true,
  });
  wikilinkParser.linkCache.set('![[here]]', {
    title: 'here embed',
    slug: 'here',
    href: '/test/',
    isEmbed: true,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  const parsed = md.parseInline('Hello world, this is some text with two ![[wiki link embeds]] inside! The second one is ![[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 5);
  t.is(parsed[0].children.filter(child => child.type === 'inline_wikilink').length, 2);
});

test('inline rule correctly parses mixed wikilink and wikilink embeds', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set);
  wikilinkParser.linkCache.set('![[wiki link embeds]]', {
    title: 'wiki link embeds',
    slug: 'wiki-link-embeds',
    href: '/test/',
    isEmbed: true,
  });
  wikilinkParser.linkCache.set('[[here]]', {
    title: 'here',
    slug: 'here',
    href: '/test/',
    isEmbed: false,
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  const parsed = md.parseInline('Hello world, this is some text with mixed ![[wiki link embeds]] inside! The wiki link is [[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 5);
  t.is(parsed[0].children.filter(child => child.type === 'inline_wikilink').length, 2);
});
