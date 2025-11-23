import { Freezable } from '../utils/Freezable.js';
import { FeatureValue, SimpleFeatureValue, SymbolicFeatureValue, StringFeatureValue } from './FeatureValue.js';

/**
 * Feature structure for linguistic features.
 * Represents a bundle of feature-value pairs with unification support.
 */
export class FeatureStruct extends FeatureValue {
  constructor() {
    super();
    this._features = new Map(); // Map<Feature, FeatureValue>
    this._frozen = false;
    this._hashCode = null;
  }

  /**
   * Gets the features in this structure.
   * @returns {Array<Feature>}
   */
  get features() {
    return Array.from(this._features.keys());
  }

  /**
   * Gets whether this structure is empty.
   * @returns {boolean}
   */
  get isEmpty() {
    return this._features.size === 0;
  }

  /**
   * Gets whether this structure has variables.
   * @returns {boolean}
   */
  get hasVariables() {
    return this._determineHasVariables(new Set());
  }

  /**
   * Gets whether this feature struct is frozen.
   * @returns {boolean}
   */
  get isFrozen() {
    return this._frozen;
  }

  /**
   * Determines if this structure has variables (recursive).
   * @param {Set<FeatureStruct>} visited - Visited structures
   * @returns {boolean}
   * @private
   */
  _determineHasVariables(visited) {
    if (visited.has(this)) {
      return false;
    }

    visited.add(this);

    for (const value of this._features.values()) {
      if (value instanceof FeatureStruct) {
        if (value._determineHasVariables(visited)) {
          return true;
        }
      } else if (value instanceof SimpleFeatureValue && value.isVariable) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets a feature value.
   * @param {Feature|string} feature - The feature or feature ID
   * @returns {FeatureValue|null}
   */
  getValue(feature) {
    const key = typeof feature === 'string' ? feature : feature;
    return this._features.get(key) ?? null;
  }

  /**
   * Adds or sets a feature value.
   * @param {Feature} feature - The feature
   * @param {FeatureValue|any} value - The value
   */
  addValue(feature, value) {
    this.checkFrozen();

    // Wrap primitive values
    let featureValue = value;
    if (!(value instanceof FeatureValue)) {
      featureValue = new SimpleFeatureValue(value);
    }

    this._features.set(feature, featureValue);
  }

  /**
   * Adds a symbolic feature value.
   * @param {SymbolicFeature} feature - The feature
   * @param {...FeatureSymbol} symbols - The symbols
   */
  addSymbols(feature, ...symbols) {
    this.addValue(feature, new SymbolicFeatureValue(symbols));
  }

  /**
   * Adds a string feature value.
   * @param {StringFeature} feature - The feature
   * @param {Array<string>} values - The string values
   * @param {boolean} [not=false] - Whether this is a negative constraint
   */
  addStrings(feature, values, not = false) {
    this.addValue(feature, new StringFeatureValue(values, not));
  }

  /**
   * Removes a feature.
   * @param {Feature} feature - The feature to remove
   * @returns {boolean} True if removed
   */
  removeValue(feature) {
    this.checkFrozen();
    return this._features.delete(feature);
  }

  /**
   * Checks if this structure contains a feature.
   * @param {Feature} feature - The feature
   * @returns {boolean}
   */
  containsFeature(feature) {
    return this._features.has(feature);
  }

  /**
   * Clones this feature structure.
   * @param {Map<FeatureValue, FeatureValue>} [copies] - Map of already copied values
   * @returns {FeatureStruct}
   */
  clone(copies = null) {
    return this.cloneImpl(copies || new Map());
  }

  /**
   * Implementation of clone.
   * @param {Map<FeatureValue, FeatureValue>} copies - Map of already copied values
   * @returns {FeatureStruct}
   */
  cloneImpl(copies) {
    if (copies.has(this)) {
      return copies.get(this);
    }

    const fs = new FeatureStruct();
    copies.set(this, fs);

    for (const [feature, value] of this._features) {
      const derefValue = FeatureValue.dereference(value);
      fs._features.set(feature, derefValue.cloneImpl(copies));
    }

    return fs;
  }

  /**
   * Checks if this feature structure equals another.
   * @param {FeatureValue|FeatureStruct} other - The other feature structure
   * @returns {boolean}
   */
  valueEquals(other) {
    if (!(other instanceof FeatureStruct)) {
      return false;
    }

    return this.valueEqualsImpl(other, new Set(), new Set(), new Map());
  }

  /**
   * Implementation of valueEquals.
   * @param {FeatureValue} other
   * @param {Set<FeatureValue>} visitedSelf
   * @param {Set<FeatureValue>} visitedOther
   * @param {Map<FeatureValue, FeatureValue>} visitedPairs
   * @returns {boolean}
   */
  valueEqualsImpl(other, visitedSelf, visitedOther, visitedPairs) {
    if (!(other instanceof FeatureStruct)) {
      return false;
    }

    if (visitedSelf.has(this)) {
      return visitedPairs.get(this) === other;
    }

    visitedSelf.add(this);
    visitedOther.add(other);
    visitedPairs.set(this, other);

    if (this._features.size !== other._features.size) {
      return false;
    }

    for (const [feature, value] of this._features) {
      if (!other._features.has(feature)) {
        return false;
      }

      const otherValue = other._features.get(feature);
      const derefValue = FeatureValue.dereference(value);
      const derefOtherValue = FeatureValue.dereference(otherValue);

      if (!derefValue.valueEqualsImpl(derefOtherValue, visitedSelf, visitedOther, visitedPairs)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Freezes this feature structure.
   */
  freeze() {
    if (this._frozen) return;

    this._frozen = true;
    this._hashCode = 23;

    for (const [feature, value] of this._features) {
      if (value.freeze) {
        value.freeze();
      }

      // Compute hash
      const featureHash = typeof feature === 'string' ? hashString(feature) : feature.id ? hashString(feature.id) : 0;
      const valueHash = value.getFrozenHashCode ? value.getFrozenHashCode() : hashValue(value);

      this._hashCode = (this._hashCode * 31 + featureHash) | 0;
      this._hashCode = (this._hashCode * 31 + valueHash) | 0;
    }
  }

  /**
   * Gets the frozen hash code.
   * @returns {number}
   */
  getFrozenHashCode() {
    if (!this._frozen) {
      throw new Error('FeatureStruct does not have a valid hash code because it is mutable');
    }
    return this._hashCode;
  }

  /**
   * Checks if frozen and throws if so.
   * @protected
   */
  checkFrozen() {
    if (this._frozen) {
      throw new Error('FeatureStruct is frozen and cannot be modified');
    }
  }

  /**
   * Converts to string.
   * @param {Set<FeatureValue>} [visited] - Visited values
   * @param {Map<FeatureValue, number>} [reentranceIds] - Reentrance IDs
   * @returns {string}
   */
  toString(visited = null, reentranceIds = null) {
    return this.toStringImpl(visited || new Set(), reentranceIds || new Map());
  }

  /**
   * Implementation of toString.
   * @param {Set<FeatureValue>} visited
   * @param {Map<FeatureValue, number>} reentranceIds
   * @returns {string}
   */
  toStringImpl(visited, reentranceIds) {
    if (visited.has(this)) {
      // Handle reentrance
      if (!reentranceIds.has(this)) {
        reentranceIds.set(this, reentranceIds.size + 1);
      }
      return `#${reentranceIds.get(this)}`;
    }

    visited.add(this);

    if (this._features.size === 0) {
      return '[]';
    }

    const entries = [];
    for (const [feature, value] of this._features) {
      const featureId = typeof feature === 'string' ? feature : feature.id;
      const derefValue = FeatureValue.dereference(value);
      const valueStr = derefValue.toStringImpl(visited, reentranceIds);
      entries.push(`${featureId}:${valueStr}`);
    }

    let result = `[${entries.join(' ')}]`;

    // Add reentrance ID if needed
    if (reentranceIds.has(this)) {
      result = `#${reentranceIds.get(this)}=${result}`;
    }

    return result;
  }

  /**
   * Creates a new feature structure (builder pattern).
   * @returns {FeatureStruct}
   */
  static create() {
    return new FeatureStruct();
  }
}

/**
 * Hashes a string value.
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Hashes a primitive value.
 * @param {any} value
 * @returns {number}
 */
function hashValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value | 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') return hashString(value);
  return 0;
}
