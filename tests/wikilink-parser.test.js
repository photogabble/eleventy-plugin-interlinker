const WikilinkParser = require('../src/wikilink-parser');
const test = require('ava');

test('parses wikilink', t => {
  const parser = new WikilinkParser({slugifyFn: () => '...'});
  t.like(parser.parseSingle('[[hello world]]'), {
    title: null,
    anchor: null,
    name: 'hello world',
    isEmbed: false
  });
});

test('parses wikilink with title', t => {
  const parser = new WikilinkParser({slugifyFn: () => '...'});
  t.like(parser.parseSingle('[[hello world|Howdy]]'), {
    title: 'Howdy',
    anchor: null,
    name: 'hello world',
    isEmbed: false
  });
});

test('parses wikilink with anchor', t => {
  const parser = new WikilinkParser({slugifyFn: () => '...'});
  t.like(parser.parseSingle('[[hello world#heading one]]'), {
    title: null,
    anchor: 'heading one',
    name: 'hello world',
    isEmbed: false
  });
});

test('parses wikilink embed', t => {
  const parser = new WikilinkParser({slugifyFn: () => '...'});
  t.like(parser.parseSingle('![[hello world]]'), {
    title: null,
    anchor: null,
    name: 'hello world',
    isEmbed: true
  });
});

test('parses wikilinks with weird formatting', t => {
  const parser = new WikilinkParser({slugifyFn: () => '...'});

  const checks = [
    {
      str: '[[hello world]]',
      result: {
        title: null,
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
        title: null,
        name: 'hello world',
        isEmbed: true
      }
    },
  ];

  for (const check of checks) {
    const result = parser.parseSingle(check.str);
    t.like(result, check.result);
  }
});
