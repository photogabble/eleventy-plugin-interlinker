import WikiLinksPlugin from '../../../index.js';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(WikiLinksPlugin,
    {
      resolvingFns: new Map([
        ['howdy', (link, page) => `Hello ${link.name}!`],
        ['issue', (link, page) => `<a href="${page.data.github}/issues/${link.name}">#${link.name}</a>`],
      ]),
      deadLinkReport: 'json',
    }
  );

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
