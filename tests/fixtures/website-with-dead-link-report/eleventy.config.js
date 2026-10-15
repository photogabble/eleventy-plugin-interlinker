import WikiLinksPlugin from '../../../index.js';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(WikiLinksPlugin, {
    deadLinkReport: 'json',
  });

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
