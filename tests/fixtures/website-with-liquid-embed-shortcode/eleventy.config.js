import WikiLinksPlugin from '../../../index.js';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(WikiLinksPlugin);

  eleventyConfig.addPairedShortcode('sc', (content) => `<figure>${content}</figure>`);

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
