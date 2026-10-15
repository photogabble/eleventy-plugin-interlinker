import path from 'node:path';
import chalk from 'chalk';
import fs from 'node:fs';

export default class DeadLinks {
  constructor() {
    this.gravestones = new Map;
  }

  /**
   * @param {string} link
   * @return {boolean}
   */
  has(link) {
    return this.gravestones.has(link);
  }

  /**
   * Add a deadlink to the graveyard.
   *
   * @param {string} link
   * @param {string|undefined} fileSrc
   */
  add(link, fileSrc = 'unknown') {
    if (!fileSrc) fileSrc = 'unknown';

    const names = this.gravestones.has(link)
      ? this.gravestones.get(link)
      : [];

    if (!names.includes(fileSrc)) names.push(fileSrc);

    this.gravestones.set(link, names);
  }

  /**
   * @param {'console'|'json'} format
   */
  report(format) {
    if (format === 'console') {
      for (const [link, files] of this.gravestones.entries()) {
        console.warn(
          chalk.blue('[@photogabble/wikilinks]'),
          chalk.yellow('WARNING'),
          `${(link.includes('href') ? 'Link' : 'Wikilink')} (${link}) found pointing to to non-existent page in:`
        );

        for (const file of files) {
          console.warn(`\t- ${file}`);
        }
      }
      return;
    }

    let obj = {};
    for (const [link, files] of this.gravestones.entries()) {
      obj[link] = files;
    }

    fs.writeFileSync(
      path.join(process.env.ELEVENTY_ROOT, '.dead-links.json'),
      JSON.stringify(obj)
    );
  }

  /**
   * Reset to initial state
   */
  clear() {
    this.gravestones.clear();
  }
}
