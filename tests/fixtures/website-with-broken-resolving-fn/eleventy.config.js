module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(
    require('../../../index.js')
  );

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
