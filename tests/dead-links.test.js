import DeadLinks from '../src/dead-links.js';
import {consoleMockMessages} from './helpers.js';
import sinon from 'sinon';
import test from 'ava';

test.serial('dead links console report labels wikilinks and internal links', t => {
  const deadLinks = new DeadLinks();
  deadLinks.add('[[wiki link]]', './a.md');
  deadLinks.add('![[embedded link]]', './b.md');
  deadLinks.add('/internal-link', './c.md');

  const mock = sinon.stub(console, 'warn');
  deadLinks.report('console');
  mock.restore();

  const messages = consoleMockMessages(mock);

  t.true(messages.some(message => message.includes('WARNING Wikilink ([[wiki link]]) found pointing to non-existent page in:')));
  t.true(messages.some(message => message.includes('WARNING Wikilink (![[embedded link]]) found pointing to non-existent page in:')));
  t.true(messages.some(message => message.includes('WARNING Internal Link (/internal-link) found pointing to non-existent page in:')));
});
