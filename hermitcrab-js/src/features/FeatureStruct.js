import { Freezable } from '../utils/Freezable.js';

/**
 * Feature structure for linguistic features.
 * This is a placeholder - full implementation will come later.
 */
export class FeatureStruct extends Freezable {
  constructor() {
    super();
    this._features = new Map();
  }

  /**
   * Clones this feature structure.
   * @returns {FeatureStruct}
   */
  clone() {
    const fs = new FeatureStruct();
    for (const [key, value] of this._features) {
      fs._features.set(key, value);
    }
    return fs;
  }

  /**
   * Checks if this feature structure equals another.
   * @param {FeatureStruct} other - The other feature structure
   * @returns {boolean}
   */
  valueEquals(other) {
    if (!(other instanceof FeatureStruct)) return false;
    if (this._features.size !== other._features.size) return false;

    for (const [key, value] of this._features) {
      if (!other._features.has(key)) return false;
      const otherValue = other._features.get(key);
      if (value !== otherValue) return false;
    }

    return true;
  }

  /**
   * Freezes this feature structure.
   */
  freeze() {
    if (this._frozen) return;
    super.freeze();
    this._hashCode = Freezable.computeHashCode(...Array.from(this._features.entries()).flat());
  }

  /**
   * Gets a value from the feature structure.
   * @param {string} key - The feature key
   * @returns {any}
   */
  get(key) {
    return this._features.get(key);
  }

  /**
   * Sets a value in the feature structure.
   * @param {string} key - The feature key
   * @param {any} value - The feature value
   */
  set(key, value) {
    this.checkFrozen();
    this._features.set(key, value);
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    const entries = Array.from(this._features.entries())
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
    return `[${entries}]`;
  }
}
