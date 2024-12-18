import WikilinkParser from '../src/wikilink-parser.js';
import {defaultResolvingFn, defaultEmbedFn} from '../src/resolvers.js';
import {pageLookup} from '../src/find-page.js';
import test from 'ava';

const pageDirectory = pageLookup([
  {
    inputPath: '/home/user/website/hello-world.md',
    filePathStem: '/hello-world',
    fileSlug: 'hello-world',
    data: {
      title: 'Hello World, Title',
    },
  },
  {
    inputPath: '/home/user/website/blog/a-blog-post.md',
    filePathStem: '/blog/a-blog-post',
    fileSlug: 'a-blog-post',
    data: {
      title: 'Blog Post',
    },
  },
  {
    inputPath: '/home/user/website/bookmark/2024-01-04-♡-cinnis-dream-home-♡.md',
    filePathStem: '/bookmark/2024-01-04-♡-cinnis-dream-home-♡',
    fileSlug: 'cinnis-dream-home',
    data: {
      title: "♡ cinni''s dream home ♡"
    }
  }
]);

const opts = {
  resolvingFns: new Map([
    ['default', defaultResolvingFn],
    ['default-embed', defaultEmbedFn],
  ]),
  stubUrl: '/stubs/',
};

test('parses wikilink', t => {
  const parser = new WikilinkParser(opts, new Set(), new Map());
  t.like(parser.parseSingle('[[hello-world]]', pageDirectory), {
    title: 'Hello World, Title',
    anchor: null,
    name: 'hello-world',
    isEmbed: false
  });
});

test('parses wikilink with title', t => {
  const parser = new WikilinkParser(opts, new Set(), new Map());
  t.like(parser.parseSingle('[[hello-world|Howdy]]', pageDirectory), {
    title: 'Howdy',
    anchor: null,
    name: 'hello-world',
    isEmbed: false
  });
});

test('parses wikilink with anchor', t => {
  const parser = new WikilinkParser(opts, new Set(), new Map());
  t.like(parser.parseSingle('[[hello-world#heading one]]', pageDirectory), {
    title: 'Hello World, Title',
    anchor: 'heading one',
    name: 'hello-world',
    isEmbed: false
  });
});

test('parses wikilink embed', t => {
  const parser = new WikilinkParser(opts, new Set(), new Map());
  t.like(parser.parseSingle('![[hello-world]]', pageDirectory), {
    title: 'Hello World, Title',
    anchor: null,
    name: 'hello-world',
    isEmbed: true
  });
});

test('parses wikilinks with weird formatting', t => {
  const parser = new WikilinkParser(opts, new Set(), new Map());

  const checks = [
    {
      str: '[[hello-world]]',
      result: {
        title: 'Hello World, Title',
        name: 'hello-world',
        isEmbed: false
      }
    },
    {
      str: '[[hello-world|custom title]]',
      result: {
        title: 'custom title',
        name: 'hello-world',
        isEmbed: false
      }
    },
    {
      str: '[[ hello-world | custom title ]]',
      result: {
        title: 'custom title',
        name: 'hello-world',
        isEmbed: false
      }
    },
    {
      str: '[[ hello-world   |  custom title ]]',
      result: {
        title: 'custom title',
        name: 'hello-world',
        isEmbed: false
      }
    },
    {
      str: '![[hello-world]]',
      result: {
        title: 'Hello World, Title',
        name: 'hello-world',
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
  const parser = new WikilinkParser(opts, deadLinks, new Map());
  t.is(deadLinks.size, 0);

  parser.parseSingle('[[hello-world]]', pageDirectory);
  t.is(deadLinks.size, 0);

  const invalid = parser.parseSingle('[[invalid]]', pageDirectory);
  t.is(deadLinks.size, 1);
  t.is(invalid.href, '/stubs/');
})

test('parses path lookup', t => {
  const deadLinks = new Set();
  const parser = new WikilinkParser(opts, deadLinks, new Map());

  const parsed = parser.parseSingle('[[/blog/a-blog-post.md]]', pageDirectory);
  t.is(parsed.isPath, true);
  t.is(parsed.exists, true);
  t.is(parsed.title, 'Blog Post');
})

test('parses relative path lookup (single back step)', t => {
  const deadLinks = new Set();
  const parser = new WikilinkParser(opts, deadLinks, new Map());

  const parsed = parser.parseSingle('[[../a-blog-post.md]]', pageDirectory, '/blog/sub-dir/some-page');
  t.is(parsed.isPath, true);
  t.is(parsed.exists, true);
  t.is(parsed.title, 'Blog Post');
})

test('parses relative path lookup (multiple back step)', t => {
  const deadLinks = new Set();
  const parser = new WikilinkParser(opts, deadLinks, new Map());

  const parsed = parser.parseSingle('[[../../a-blog-post.md]]', pageDirectory, '/blog/sub-dir/sub-dir/some-page');
  t.is(parsed.isPath, true);
  t.is(parsed.exists, true);
  t.is(parsed.title, 'Blog Post');
})

test('throws error on failure to find resolvingFn', t => {
  const parser = new WikilinkParser(opts, new Set(), new Map());
  let errorMsg;

  try {
    parser.parseSingle('[[fail:1234]]', pageDirectory, '/directory/filename');
  } catch (e) {
    errorMsg = e.message;
  }

  t.is(errorMsg, 'Unable to find resolving fn [fail] for wikilink [[fail:1234]] on page [/directory/filename]');
})

test('sets resolvingFnName on finding resolvingFn', t => {
  const parser = new WikilinkParser({
    resolvingFns: new Map([
      ['test', () => 'Hello World']
    ]),
  }, new Set(), new Map());

  const link = parser.parseSingle('[[test:1234]]', pageDirectory, '/directory/filename');

  t.is(link.resolvingFnName, 'test');
  t.is(link.name, '1234');
})

test('regex does not match on whitespace', t => {
  const deadLinks = new Set();
  const parser = new WikilinkParser(opts, deadLinks, new Map());
  t.is(parser.find("[[ broken \nwikilink ]]", pageDirectory, '/').length, 0);
  t.is(parser.find("[[ broken |wikilink \n]]", pageDirectory, '/').length, 0);
  t.is(parser.find("[[\n broken wikilink]]", pageDirectory, '/').length, 0);
})

test('regex does match special ASCII', t => {
  const deadLinks = new Set();
  const parser = new WikilinkParser(opts, deadLinks, new Map());
  t.is(parser.find("[[♡ cinni''s dream home ♡]]", pageDirectory, '/').length, 1);
  t.is(parser.find("[[♡ cinni''s dream home ♡|Cinni]]", pageDirectory, '/').length, 1);
  t.is(deadLinks.size, 0);
})
