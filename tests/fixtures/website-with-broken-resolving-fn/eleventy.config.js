import WikiLinksPlugin from '../../../index.js';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(WikiLinksPlugin);

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
