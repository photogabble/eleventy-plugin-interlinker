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
  t.is(pageDirectory.findByLink({href: '/something/else', isEmbed: false}).fileSlug, 'something-else');
});

test('pageLookup (find by wikilink)', t => {
  t.is(pageDirectory.findByLink({
    title: 'Hello World, Title',
    name: 'hello-world',
    anchor: null,
    link: '[[hello-world]]',
    slug: 'hello-world',
    isEmbed: false,
  }).fileSlug, 'hello-world');
});

test('pageLookup (find by alias)', t => {
  t.is(pageDirectory.findByLink({
    title: 'This is another page',
    name: 'test-alias',
    anchor: null,
    link: '[[test-alias]]',
    slug: 'test-alias',
    isEmbed: false,
  }).fileSlug, 'something-else');
});