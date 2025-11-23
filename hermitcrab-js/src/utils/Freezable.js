/**
 * Base class for objects that can be frozen (made immutable).
 * This is equivalent to C#'s IFreezable interface.
 */
export class Freezable {
  constructor() {
    this._frozen = false;
    this._hashCode = null;
  }

  /**
   * Gets whether this object is frozen.
   * @returns {boolean}
   */
  get isFrozen() {
    return this._frozen;
  }

  /**
   * Freezes this object, making it immutable.
   */
  freeze() {
    if (this._frozen) return;
    this._frozen = true;
  }

  /**
   * Checks if this object is frozen and throws an error if it is.
   * @protected
   */
  checkFrozen() {
    if (this._frozen) {
      throw new Error('Object is frozen and cannot be modified');
    }
  }

  /**
   * Gets the frozen hash code for this object.
   * Only valid if the object is frozen.
   * @returns {number}
   */
  getFrozenHashCode() {
    if (!this._frozen) {
      throw new Error('Object does not have a valid hash code because it is mutable');
    }
    return this._hashCode;
  }

  /**
   * Computes a hash code from multiple values.
   * @param {...any} values - Values to hash
   * @returns {number}
   */
  static computeHashCode(...values) {
    let hash = 23;
    for (const value of values) {
      hash = (hash * 31 + (value?.getFrozenHashCode?.() ?? hashValue(value))) | 0;
    }
    return hash;
  }
}

/**
 * Computes a hash code for a primitive value.
 * @param {any} value - The value to hash
 * @returns {number}
 */
function hashValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value | 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    return hash;
  }
  if (typeof value === 'object' && value.getFrozenHashCode) {
    return value.getFrozenHashCode();
  }
  return 0;
}

export { hashValue };
