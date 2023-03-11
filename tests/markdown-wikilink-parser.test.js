const {wikilinkInlineRule} = require('../src/markdown-ext');
const WikilinkParser = require('../src/wikilink-parser');
const slugify = require('slugify');
const test = require('ava');

const wikilinkParser = new WikilinkParser({slugifyFn: (text) => slugify(text)});

test('inline rule correctly parses single wikilink', t => {
  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser,
    new Map,
    new Set,
    {}
  ));

  const parsed = md.parseInline('Hello world, this is some text with a [[wiki link]] inside!', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(1, parsed.length);
  t.is(3, parsed[0].children.length);
  t.is(1, parsed[0].children.filter(child => child.type === 'inline_wikilink').length);
});

test('inline rule correctly parses multiple wikilink', t => {
  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser,
    new Map,
    new Set,
    {}
  ));

  const parsed = md.parseInline('Hello world, this is some text with two [[wiki links]] inside! The second one is [[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(1, parsed.length);
  t.is(5, parsed[0].children.length);
  t.is(2, parsed[0].children.filter(child => child.type === 'inline_wikilink').length);
  t.is('wiki-links', parsed[0].children[1].content);
  t.is('here', parsed[0].children[3].content);
});

test('inline rule correctly parses single wikilink embed', t => {
  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser,
    new Map,
    new Set,
    {}
  ));

  const parsed = md.parseInline('Hello world, this is some text with a ![[wiki link embed]] inside!', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(1, parsed.length);
  t.is(3, parsed[0].children.length);
  t.is(1, parsed[0].children.filter(child => child.type === 'inline_wikilink').length);
});

test('inline rule correctly parses multiple wikilink embeds', t => {
  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser,
    new Map,
    new Set,
    {}
  ));

  const parsed = md.parseInline('Hello world, this is some text with two ![[wiki link embeds]] inside! The second one is ![[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(1, parsed.length);
  t.is(5, parsed[0].children.length);
  t.is(2, parsed[0].children.filter(child => child.type === 'inline_wikilink').length);
});

test('inline rule correctly parses mixed wikilink and wikilink embeds', t => {
  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser,
    new Map,
    new Set,
    {}
  ));

  const parsed = md.parseInline('Hello world, this is some text with mixed ![[wiki link embeds]] inside! The wiki link is [[here]].', {});

  // Check there is only one inline_wikilink_embed token in parsed result
  t.is(1, parsed.length);
  t.is(5, parsed[0].children.length);
  t.is(2, parsed[0].children.filter(child => child.type === 'inline_wikilink').length);
});
