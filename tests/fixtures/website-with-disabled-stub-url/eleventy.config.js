module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(
    require('../../../index.js'), {
      stubUrl: false,
    }
  );

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
