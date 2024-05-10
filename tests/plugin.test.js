const mockFactory = (src = {}) => {
  return new Proxy({
    ...src,
    calls: new Map(),
    wasCalled: function () { return this.calls.size > 0 },
    mockedFunctions: new Map(),
    addMock: function (name, fn) {
      this.mockedFunctions.set(name, fn);
    },
    addNullMock: function (names) {
      if (Array.isArray(names)) {
        for(const name of names) {
          this.addMock(name, () => {});
        }
      } else {
        this.addMock(name, () => {});
      }
    }
  }, {
    get: function(obj, field) {
      if (field in obj) return obj[field];

      let fieldCalls = obj.calls.get(field) ?? 0;
      fieldCalls++;
      obj.calls.set(field, fieldCalls);

      if (obj.mockedFunctions.has(field)) return obj.mockedFunctions.get(field);
    }
  });
};

const plugin = require('../index');
const test = require('ava');

test('hooks into eleventy.config', t => {
  const eleventyMock = mockFactory();
  eleventyMock.addNullMock(['on', 'amendLibrary', 'addGlobalData']);

  t.false(eleventyMock.wasCalled());
  plugin(eleventyMock);
  t.true(eleventyMock.wasCalled());

  t.is(eleventyMock.calls.get('on'), 4); // eleventy.config, eleventy.extensionmap, eleventy.after, eleventy.beforeWatch
  t.is(eleventyMock.calls.get('amendLibrary'), 1); // Adding Markdown-it ext
  t.is(eleventyMock.calls.get('addGlobalData'), 1); // Adding global eleventyComputed data
});

test('registers parse and render rules with markdown-it', t => {
  const eleventyMock = mockFactory();

  const mdMock = mockFactory({
    inline: {
      ruler: {
        push: function (name, fn) {
          this[name] = fn;
        }
      }
    },
    renderer: {
      rules: {}
    },
    linkify: {
      add: () => {}
    }
  });

  eleventyMock.addNullMock(['on', 'addGlobalData']);

  eleventyMock.addMock('amendLibrary', function(name, fn) {
    t.is(name, 'md');
    t.is(typeof fn, 'function');

    t.is(typeof mdMock.inline.ruler.inline_wikilink, 'undefined');
    t.is(typeof mdMock.renderer.rules.inline_wikilink, 'undefined');

    fn(mdMock);

    t.is(typeof mdMock.inline.ruler.inline_wikilink, 'function');
    t.is(typeof mdMock.renderer.rules.inline_wikilink, 'function');
  });

  plugin(eleventyMock);
});
