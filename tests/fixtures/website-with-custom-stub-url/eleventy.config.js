import WikiLinksPlugin from '../../../index.js';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(WikiLinksPlugin, {
    stubUrl: '/custom-stub-url/',
  });

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
