const test = require("ava");
const {pageLookup} = require("../src/find-page");
const slugify = require("slugify");

const pageDirectory = pageLookup([
  {
    fileSlug: 'hello-world',
    data: {
      title: 'Hello World, Title',
      aliases: null
    },
    url: '/hello-world/'
  },
  {
    fileSlug: 'hello-world-1',
    data: {
      title: 'Hello World, One Title',
      aliases: [],
    },
    url: '/hello-world/1/'
  },
  {
    fileSlug: 'something-else',
    data: {
      title: 'This is another page',
      aliases: ['test-alias']
    },
    url: '/something/else/'
  }
], slugify);

test('pageLookup (find by href)', t => {
  const {page} = pageDirectory.findByLink({href: '/something/else', isEmbed: false});
  t.is(page.fileSlug, 'something-else');
});

test('pageLookup (find by wikilink)', t => {
  const {page} = pageDirectory.findByLink({
    title: 'Hello World, Title',
    name: 'Hello World, Title',
    anchor: null,
    link: '[[Hello World, Title]]',
    slug: 'hello-world',
    isEmbed: false,
  });

  t.is(page.fileSlug, 'hello-world');
});

test('pageLookup (find by alias)', t => {
  const {page} = pageDirectory.findByLink({
    title: 'This is another page',
    name: 'test-alias',
    anchor: null,
    link: '[[test-alias]]',
    slug: 'test-alias',
    isEmbed: false,
  });
  t.is(page.fileSlug, 'something-else');
});

// TODO: add testing when two pages share the same alias, what _should_ happen ?
