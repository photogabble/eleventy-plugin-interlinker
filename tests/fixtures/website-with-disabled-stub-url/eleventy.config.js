import WikiLinksPlugin from '../../../index.js';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(WikiLinksPlugin, {
    stubUrl: false,
  });

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
