const entities = require("entities");
/**
 * Default Resolving function for converting Wikilinks into html links.
 *
 * @param {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta} link
 * @param {*} currentPage
 * @param {import('./interlinker')} interlinker
 * @return {Promise<string|undefined>}
 */
const defaultResolvingFn = async (link, currentPage, interlinker) => {
  const text = entities.encodeHTML(link.title ?? link.name);
  let href = link.href;

  if (link.anchor) {
    href = `${href}#${link.anchor}`;
  }

  return `<a href="${href}">${text}</a>`;
}

/**
 * Default Resolving function for converting Wikilinks into Embeds.
 *
 * @param {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta} link
 * @param {*} currentPage
 * @param {import('./interlinker')} interlinker
 * @return {Promise<string|undefined>}
 */
const defaultEmbedFn = async (link, currentPage, interlinker) => {
  if (!link.exists || !interlinker.templateConfig || !interlinker.extensionMap) return;

  const page = link.page;
  const frontMatter = page.template.frontMatter;

  const layout = (page.data.hasOwnProperty(interlinker.opts.layoutKey))
    ? page.data[interlinker.opts.layoutKey]
    : interlinker.opts.defaultLayout;

  // TODO this should be based upon the layout extension
  const language = (page.data.hasOwnProperty(interlinker.opts.layoutTemplateLangKey))
    ? page.data[interlinker.opts.layoutTemplateLangKey]
    : interlinker.opts.defaultLayoutLang === null
      ? page.page.templateSyntax
      : interlinker.opts.defaultLayoutLang;

  // TODO: the layout below is liquid, will break if content contains invalid template tags such as passing njk file src
  const tpl = layout === null
    ? frontMatter.content
    : `{% layout "${layout}" %} {% block content %} ${frontMatter.content} {% endblock %}`;

  const fn = await interlinker.rm.compile(tpl, language, {
    templateConfig: interlinker.templateConfig,
    extensionMap: interlinker.extensionMap
  });

  return fn({content: frontMatter.content, ...page.data});
}

module.exports = {
  defaultEmbedFn,
  defaultResolvingFn,
}
