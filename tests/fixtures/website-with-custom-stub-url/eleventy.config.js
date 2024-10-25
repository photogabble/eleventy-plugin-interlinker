module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(
    require('../../../index.js'), {
      stubUrl: '/custom-stub-url/',
    }
  );

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
