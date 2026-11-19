import MarkdownIt from 'markdown-it';

/**
 * This is a fresh instance of markdown-it instead of the instance used by 11ty to be used for identifying which parts
 * of a Markdown document are code sections.
 */
const md = MarkdownIt({html: true});

// Record the position of each code span within its inline source, so it can be removed from that source later.
const backticks = md.inline.ruler.__rules__.find(rule => rule.name === 'backticks').fn;
md.inline.ruler.at('backticks', (state, silent) => {
  const start = state.pos;
  if (!backticks(state, silent)) return false;
  if (!silent) state.tokens[state.tokens.length - 1].meta = {start, end: state.pos};
  return true;
});

/**
 * Removes the code spans from an inline token's source. This allows the inline source to be parsed for Wikilinks
 * without accidentally parsing code spans.
 *
 * @param {import('markdown-it/lib/token.mjs').default} token
 * @return {string}
 */
const inlineSourceWithoutCode = (token) => {
  let source = token.content;
  const codeSpans = token.children.filter(child => child.type === 'code_inline' && child.meta);

  for (const {meta} of codeSpans.reverse()) {
    source = source.substring(0, meta.start) + source.substring(meta.end);
  }

  return source;
};

/**
 * Splits a Markdown document into the sources that should be searched for Wikilinks and for HTML links, leaving out
 * inline code, fenced code and indented code blocks.
 *
 * Wikilinks are searched for in the raw inline source, rather than markdown-it's text tokens, as that is what the
 * Wikilink render rule matches against.
 *
 * @param {string} document
 * @return {{wikilinkSource: string, htmlSource: string}}
 */
export const markdownLinkSources = (document) => {
  const wikilinkSource = [];
  const htmlSource = [];

  for (const token of md.parse(document, {})) {
    if (token.type === 'html_block') {
      wikilinkSource.push(token.content);
      htmlSource.push(token.content);
    }

    if (token.type === 'inline') {
      wikilinkSource.push(inlineSourceWithoutCode(token));
      for (const child of token.children) {
        if (child.type === 'html_inline') htmlSource.push(child.content);
      }
    }
  }

  return {
    wikilinkSource: wikilinkSource.join('\n'),
    htmlSource: htmlSource.join('\n'),
  };
};
