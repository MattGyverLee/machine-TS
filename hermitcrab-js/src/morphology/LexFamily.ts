/**
 * Lexical family - group of related lexical entries.
 */
export class LexFamily {
  constructor() {
    this._entries = [];
    this._name = '';
  }

  /**
   * Gets the name.
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Sets the name.
   * @param {string} value
   */
  set name(value) {
    this._name = value;
  }

  /**
   * Gets the entries in this family.
   * @returns {Array<LexEntry>}
   */
  get entries() {
    return this._entries;
  }

  /**
   * Adds an entry to this family.
   * @param {LexEntry} entry
   */
  addEntry(entry) {
    if (entry.family) {
      entry.family.removeEntry(entry);
    }

    this._entries.push(entry);
    entry.family = this;
  }

  /**
   * Removes an entry from this family.
   * @param {LexEntry} entry
   * @returns {boolean}
   */
  removeEntry(entry) {
    const index = this._entries.indexOf(entry);
    if (index === -1) {
      return false;
    }

    this._entries.splice(index, 1);
    entry.family = null;
    return true;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._name || super.toString();
  }
}
