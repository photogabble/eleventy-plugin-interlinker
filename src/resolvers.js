import {EleventyRenderPlugin} from "@11ty/eleventy";
import {encodeHTML} from 'entities';

/**
 * Default Resolving function for converting Wikilinks into html links.
 *
 * @param {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta} link
 * @param {*} currentPage
 * @param {import('./interlinker')} interlinker
 * @return {Promise<string|undefined>}
 */
export const defaultResolvingFn = async (link, currentPage, interlinker) => {
  const text = encodeHTML(link.title ?? link.name);
  let href = link.href;

  if (link.anchor) {
    href = `${href}#${link.anchor}`;
  }

  return href === false ? link.link : `<a href="${href}">${text}</a>`;
}

/**
 * Default Resolving function for converting Wikilinks into Embeds.
 *
 * @param {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta} link
 * @param {*} currentPage
 * @param {import('./interlinker')} interlinker
 * @return {Promise<string|undefined>}
 */
export const defaultEmbedFn = async (link, currentPage, interlinker) => {
  if (!link.exists || !interlinker.templateConfig || !interlinker.extensionMap) return;

  const page = link.page;
  const template = await page.template.read();

  const layout = (page.data.hasOwnProperty(interlinker.opts.layoutKey))
    ? page.data[interlinker.opts.layoutKey]
    : interlinker.opts.defaultLayout;

  // TODO this should be based upon the layout extension
  const language = (page.data.hasOwnProperty(interlinker.opts.layoutTemplateLangKey))
    ? page.data[interlinker.opts.layoutTemplateLangKey]
    : interlinker.opts.defaultLayoutLang === null
      ? page.page.templateSyntax
      : interlinker.opts.defaultLayoutLang;

  // TODO: (#36) the layout below is liquid, will break if content contains invalid template tags such as passing njk file src
  const tpl = layout === null
    ? template.content
    : `{% layout "${layout}" %} {% block content %} ${template.content} {% endblock %}`;

  const compiler = EleventyRenderPlugin.String;

  const fn = await compiler(tpl, language, {
    templateConfig: interlinker.templateConfig,
    extensionMap: interlinker.extensionMap
  });

  return fn({content: template.content, ...page.data});
}
