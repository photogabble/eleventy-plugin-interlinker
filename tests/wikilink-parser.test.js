const WikilinkParser = require('../src/wikilink-parser');
const test = require('ava');
const {pageLookup} = require("../src/find-page");
const slugify = require("slugify");

const pageDirectory = pageLookup([
  {
    fileSlug: 'hello-world',
    data: {
      title: 'Hello World, Title',
    },
  }
], slugify);

test('parses wikilink', t => {
  const parser = new WikilinkParser({slugifyFn: slugify}, new Set());
  t.like(parser.parseSingle('[[hello world]]', pageDirectory), {
    title: 'Hello World, Title',
    anchor: null,
    name: 'hello world',
    isEmbed: false
  });
});

test('parses wikilink with title', t => {
  const parser = new WikilinkParser({slugifyFn: slugify}, new Set());
  t.like(parser.parseSingle('[[hello world|Howdy]]', pageDirectory), {
    title: 'Howdy',
    anchor: null,
    name: 'hello world',
    isEmbed: false
  });
});

test('parses wikilink with anchor', t => {
  const parser = new WikilinkParser({slugifyFn: slugify}, new Set());
  t.like(parser.parseSingle('[[hello world#heading one]]', pageDirectory), {
    title: 'Hello World, Title',
    anchor: 'heading one',
    name: 'hello world',
    isEmbed: false
  });
});

test('parses wikilink embed', t => {
  const parser = new WikilinkParser({slugifyFn: slugify}, new Set());
  t.like(parser.parseSingle('![[hello world]]', pageDirectory), {
    title: 'Hello World, Title',
    anchor: null,
    name: 'hello world',
    isEmbed: true
  });
});

test('parses wikilinks with weird formatting', t => {
  const parser = new WikilinkParser({slugifyFn: slugify}, new Set());

  const checks = [
    {
      str: '[[hello world]]',
      result: {
        title: 'Hello World, Title',
        name: 'hello world',
        isEmbed: false
      }
    },
    {
      str: '[[hello world|custom title]]',
      result: {
        title: 'custom title',
        name: 'hello world',
        isEmbed: false
      }
    },
    {
      str: '[[ hello world | custom title ]]',
      result: {
        title: 'custom title',
        name: 'hello world',
        isEmbed: false
      }
    },
    {
      str: '[[ hello world   |  custom title ]]',
      result: {
        title: 'custom title',
        name: 'hello world',
        isEmbed: false
      }
    },
    {
      str: '![[hello world]]',
      result: {
        title: 'Hello World, Title',
        name: 'hello world',
        isEmbed: true
      }
    },
  ];

  for (const check of checks) {
    const result = parser.parseSingle(check.str, pageDirectory);
    t.like(result, check.result);
  }
});

test('populates dead links set', t => {
  const deadLinks = new Set();
  const parser = new WikilinkParser({slugifyFn: slugify}, deadLinks);
  t.is(deadLinks.size, 0);

  parser.parseSingle('[[hello world]]', pageDirectory);
  t.is(deadLinks.size, 0);

  const invalid = parser.parseSingle('[[invalid]]', pageDirectory);
  t.is(deadLinks.size, 1);
  t.is(invalid.href, '/stubs');
})
