import WikilinkParser from '../src/wikilink-parser.js';
import {install} from '../src/markdown-ext.js';
import {defaultResolvingFn} from '../src/resolvers.js';
import MarkdownIt from 'markdown-it';
import test from 'ava';

const opts = {
  resolvingFns: new Map([
    ['default', defaultResolvingFn]
  ]),
};

test('inline rule correctly parses single wikilink', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set(), new Map());
  wikilinkParser.linkCache.set('[[wiki link]]', {
    title: 'Wiki link',
    href: '/test/',
    isEmbed: false,
    content: '...',
  });

  const md = MarkdownIt({html: true});
  install(md, wikilinkParser);

  const parsed = md.parseInline('Hello world, this is some text with a [[wiki link]] inside!', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 3);
  t.is(parsed[0].children.filter(child => child.type === 'html_inline').length, 1);
});

test('inline rule correctly parses multiple wikilink', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set(), new Map());
  wikilinkParser.linkCache.set('[[wiki links]]', {
    title: 'Wiki link',
    slug: 'wiki-links',
    href: '/test/',
    isEmbed: false,
    content: '<wiki-links/>',
  });
  wikilinkParser.linkCache.set('[[here]]', {
    title: 'here',
    slug: 'here',
    href: '/here/',
    isEmbed: false,
    content: '<here/>',
  });

  const md = MarkdownIt({html: true});
  install(md, wikilinkParser);

  const parsed = md.parseInline('Hello world, this is some text with two [[wiki links]] inside! The second one is [[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 5);
  t.is(parsed[0].children.filter(child => child.type === 'html_inline').length, 2);
  t.is(parsed[0].children[1].content, '<wiki-links/>');
  t.is(parsed[0].children[3].content, '<here/>');
});

test('inline rule correctly parses single wikilink embed', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set(), new Map());
  wikilinkParser.linkCache.set('![[wiki link embed]]', {
    title: 'wiki link embed',
    slug: 'wiki-link-embed',
    href: '/test/',
    isEmbed: true,
    content: '...',
  });

  const md = MarkdownIt({html: true});
  install(md, wikilinkParser);

  const parsed = md.parseInline('Hello world, this is some text with a ![[wiki link embed]] inside!', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 3);
  t.is(parsed[0].children.filter(child => child.type === 'html_inline').length, 1);
});

test('inline rule correctly parses multiple wikilink embeds', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set(), new Map());
  wikilinkParser.linkCache.set('![[wiki link embeds]]', {
    title: 'wiki link embed',
    slug: 'wiki-link-embed',
    href: '/test/',
    content: '<strong>Wiki Link Embed</strong>',
    isEmbed: true,
  });
  wikilinkParser.linkCache.set('![[here]]', {
    title: 'here embed',
    slug: 'here',
    href: '/test/',
    content: '<strong>Here Embed</strong>',
    isEmbed: true,
  });

  const md = new MarkdownIt({html: true});
  install(md, wikilinkParser);

  const parsed = md.parseInline('Hello world, this is some text with two ![[wiki link embeds]] inside! The second one is ![[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 5);
  t.is(parsed[0].children.filter(child => child.type === 'html_inline').length, 2);
});

test('inline rule correctly parses mixed wikilink and wikilink embeds', t => {
  const wikilinkParser = new WikilinkParser(opts, new Set(), new Map());
  wikilinkParser.linkCache.set('![[wiki link embeds]]', {
    title: 'wiki link embeds',
    slug: 'wiki-link-embeds',
    href: '/test/',
    isEmbed: true,
    content: '...',
  });
  wikilinkParser.linkCache.set('[[here]]', {
    title: 'here',
    slug: 'here',
    href: '/test/',
    isEmbed: false,
    content: '...',
  });

  const md = MarkdownIt({html: true});
  install(md, wikilinkParser);

  const parsed = md.parseInline('Hello world, this is some text with mixed ![[wiki link embeds]] inside! The wiki link is [[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(parsed.length, 1);
  t.is(parsed[0].children.length, 5);
  t.is(parsed[0].children.filter(child => child.type === 'html_inline').length, 2);
});
