const entities = require("entities");

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

  const wikiLink = wikilinkParser.linkCache.get(text);

  // By this time in the execution cycle the wikilink parser's cache should contain all
  // wikilinks. In the unlikely case that it doesn't we ignore the wikilink.
  if (!wikiLink) return false;

  const token = state.push('inline_wikilink', '', 0);
  token.content = wikiLink.slug;
  token.meta = wikiLink;

  state.pos = state.pos + text.length;
  return true;
};

/**
 * @returns {(function(*, *): (string))|*}
 */
const wikilinkRenderRule = () => (tokens, idx) => {
  const {meta} = tokens[idx];
  return meta.content;
};

module.exports = {
  wikilinkRenderRule,
  wikilinkInlineRule
}
