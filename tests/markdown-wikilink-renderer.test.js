const {wikilinkInlineRule, wikilinkRenderRule} = require('../src/markdown-ext');
const WikilinkParser = require('../src/wikilink-parser');
const slugify = require('slugify');
const test = require('ava');
const fs = require('fs');

const opts = {slugifyFn: (text) => slugify(text)};
const wikilinkParser = new WikilinkParser(opts);

test('inline rule correctly parses single wikilink', t => {
  const linkMapCache = new Map;
  const compiledEmbeds = new Map;
  const deadWikiLinks = new Set;

  linkMapCache.set('wiki-link', {
    title: 'Wiki Link',
    page: {
      url: '/wiki-link'
    }
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    linkMapCache,
    compiledEmbeds,
    deadWikiLinks,
    opts
  );

  const rendered =

  t.is(
    "<p>Hello world, this is some text with a <a href=\"/wiki-link\">Wiki Link</a> inside!</p>\n",
    md.render('Hello world, this is some text with a [[wiki link]] inside!', {})
  );
});

test('inline rule correctly parses multiple wikilinks', t => {
  const linkMapCache = new Map;
  const compiledEmbeds = new Map;
  const deadWikiLinks = new Set;

  linkMapCache.set('wiki-link', {
    title: 'Wiki Link',
    page: {
      url: '/wiki-link'
    }
  });

  linkMapCache.set('another-wiki-link', {
    title: 'Another Wiki Link',
    page: {
      url: '/another-wiki-link'
    }
  });

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    linkMapCache,
    compiledEmbeds,
    deadWikiLinks,
    opts
  );

  const rendered =
    t.is(
      "<p>Hello world, this is some text with a <a href=\"/wiki-link\">Wiki Link</a> inside! There is also <a href=\"/another-wiki-link\">Another Wiki Link</a> in the same string.</p>\n",
      md.render('Hello world, this is some text with a [[wiki link]] inside! There is also [[another wiki link]] in the same string.', {})
    );
});

test('inline rule correctly parses single embed', t => {
  const linkMapCache = new Map;
  const compiledEmbeds = new Map;
  const deadWikiLinks = new Set;

  linkMapCache.set('wiki-embed', {
    title: 'Wiki Embed',
    page: {
      inputPath: '/src/wiki-embed.md',
      url: '/wiki-embed'
    }
  });

  compiledEmbeds.set('/src/wiki-embed.md', '<span>Wiki Embed Test</span>');

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    linkMapCache,
    compiledEmbeds,
    deadWikiLinks,
    opts
  );

  t.is(
    md.render('Hello world this is a ![[wiki-embed]]'),
    "<p>Hello world this is a <span>Wiki Embed Test</span></p>\n"
  );
});

test('inline rule correctly parses mixed wikilink and embed in multiline input', t => {
  const linkMapCache = new Map;
  const compiledEmbeds = new Map;
  const deadWikiLinks = new Set;

  linkMapCache.set('inline-embed', {
    title: 'Inline Embed',
    page: {
      inputPath: '/src/inline-embed.md',
      url: '/inline-embed'
    }
  });

  linkMapCache.set('this-is-an-embed-on-its-own', {
    title: 'This is an embed on its own',
    page: {
      inputPath: '/src/lonely-embed.md',
      url: '/lonely-embed'
    }
  });

  linkMapCache.set('wiki-link', {
    title: 'Wiki Link',
    page: {
      inputPath: '/src/wiki-link.md',
      url: '/wiki-link'
    }
  });

  compiledEmbeds.set('/src/inline-embed.md', '<span>inline embed</span>');
  compiledEmbeds.set('/src/lonely-embed.md', '<div>Embed on its own</div>');

  const md = require('markdown-it')({html: true});
  md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
    wikilinkParser
  ));

  md.renderer.rules.inline_wikilink = wikilinkRenderRule(
    wikilinkParser,
    linkMapCache,
    compiledEmbeds,
    deadWikiLinks,
    opts
  );

  const markdown = fs.readFileSync(__dirname + '/fixtures/multiline.md', {encoding:'utf8', flag:'r'});
  const html = fs.readFileSync(__dirname + '/fixtures/multiline.html', {encoding:'utf8', flag:'r'});

  t.is(md.render(markdown), html);
});
