module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(
    require('../../../index.js'),
    {
      deadLinkReport: 'none'
    }
  );

  return {
    dir: {
      includes: "_includes",
      layouts: "_layouts",
    }
  }
}
