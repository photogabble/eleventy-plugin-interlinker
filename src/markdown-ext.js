const chalk = require('chalk');

/**
 * This rule will be looped through an inline token by markdown-it.
 *
 * @param {WikilinkParser} wikilinkParser
 * @returns {(function(*, *): (boolean|undefined))|*}
 */
const wikilinkInlineRule = (wikilinkParser) => (state, silent) => {
  // Have we found the start of a WikiLink Embed `![[`
  if (['!', '['].includes(state.src.charAt(state.pos)) === false || silent) return false;

  if (state.src.charAt(state.pos) === '[' && state.src.charAt(state.pos + 1) !== '[') return false; // Not wikilink opening
  if (state.src.charAt(state.pos) === '!' && state.src.substring(state.pos, state.pos + 3) !== '![[') return false; // Not embed opening

  const matches = state.src.match(wikilinkParser.wikiLinkRegExp);
  if (!matches) return false;

  // We have found the start of a WikiLink (`[[`) or Embed (`![[`)
  // char at state.pos will be either [ or !, need to walk through state.src until ]] is encountered
  let pos = state.pos;
  let text = '';
  let found = false;
  while (pos <= state.posMax) {
    text += state.src.charAt(pos);
    if (text.length > 2 && text.substring(text.length - 2) === ']]') {
      found = true;
      break;
    }
    pos++;
  }

  if (!found) return false;

  const token = state.push('inline_wikilink', '', 0);
  const wikiLink = wikilinkParser.parseSingle(text);

  token.content = wikiLink.slug;
  token.meta = wikiLink;

  state.pos = state.pos + text.length;
  return true;
};

/**
 *
 * @param {WikilinkParser} wikilinkParser
 * @param { Map } linkMapCache
 * @param { Map } compiledEmbeds
 * @param { Set } deadWikiLinks
 * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts
 * @returns {(function(*, *): (string))|*}
 */
const wikilinkRenderRule = (wikilinkParser, linkMapCache, compiledEmbeds, deadWikiLinks, opts) => (tokens, idx) => {
  const token = tokens[idx];
  const link = linkMapCache.get(token.content);
  const wikilink = token.meta;

  if (token.meta.isEmbed) {
    if (!link) {
      console.error(chalk.blue('[@photogabble/wikilinks]'), chalk.red('ERROR'), `WikiLink Embed found pointing to non-existent [${token.content}], doesn't exist.`);
      return (typeof opts.unableToLocateEmbedFn === 'function')
        ? opts.unableToLocateEmbedFn(token.content)
        : '';
    }

    const templateContent = compiledEmbeds.get(link.page.inputPath);
    if (!templateContent) throw new Error(`WikiLink Embed found pointing to [${token.content}], has no compiled template.`);

    return compiledEmbeds.get(link.page.inputPath);
  }

  const anchor = {
    href: '#',
    text: '',
  };

  if (!link) {
    deadWikiLinks.add(token.content);
    anchor.text = wikilink.title ?? wikilink.name;
    anchor.href = '/stubs';
  } else {
    anchor.text = wikilink.title ?? link.title;
    anchor.href = link.page.url;
  }

  return `<a href="${anchor.href}">${anchor.text}</a>`;
};

module.exports = {
  wikilinkRenderRule,
  wikilinkInlineRule
}
