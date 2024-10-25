import path from 'node:path';
import chalk from 'chalk';
import fs from 'node:fs';

export default class DeadLinks {
  constructor() {
    this.gravestones = new Map;
    this.fileSrc = 'unknown';
  }

  setFileSrc(fileSrc) {
    this.fileSrc = fileSrc;
  }

  /**
   * @param {string} link
   */
  add(link) {
    if (!this.fileSrc) this.fileSrc = 'unknown';

    const names = this.gravestones.has(link)
      ? this.gravestones.get(link)
      : [];

    names.push(this.fileSrc)

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
    this.fileSrc = 'unknown';
    this.gravestones.clear();
  }
}
