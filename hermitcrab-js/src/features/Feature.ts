import { Freezable } from '../utils/Freezable.js';

/**
 * Base class for features.
 */
export class Feature extends Freezable {
  /**
   * Creates a new Feature.
   * @param {string} id - The feature ID
   */
  constructor(id) {
    super();
    this._id = id;
    this._defaultValue = null;
  }

  /**
   * Gets the feature ID.
   * @returns {string}
   */
  get id() {
    return this._id;
  }

  /**
   * Gets the default value for this feature.
   * @returns {FeatureValue|null}
   */
  get defaultValue() {
    return this._defaultValue;
  }

  /**
   * Sets the default value for this feature.
   * @param {FeatureValue|null} value
   */
  set defaultValue(value) {
    this.checkFrozen();
    this._defaultValue = value;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._id;
  }
}

/**
 * Feature with symbolic values (phonological features, etc.).
 */
export class SymbolicFeature extends Feature {
  /**
   * Creates a new SymbolicFeature.
   * @param {string} id - The feature ID
   * @param {...FeatureSymbol} possibleSymbols - Possible symbols for this feature
   */
  constructor(id, ...possibleSymbols) {
    super(id);
    this._possibleSymbols = new Set(possibleSymbols);
  }

  /**
   * Gets the possible symbols for this feature.
   * @returns {Set<FeatureSymbol>}
   */
  get possibleSymbols() {
    return this._possibleSymbols;
  }

  /**
   * Adds a possible symbol.
   * @param {FeatureSymbol} symbol - The symbol to add
   */
  addSymbol(symbol) {
    this.checkFrozen();
    this._possibleSymbols.add(symbol);
  }
}

/**
 * Feature with string values.
 */
export class StringFeature extends Feature {
  /**
   * Creates a new StringFeature.
   * @param {string} id - The feature ID
   */
  constructor(id) {
    super(id);
  }
}

/**
 * Feature with complex/nested values (feature structures).
 */
export class ComplexFeature extends Feature {
  /**
   * Creates a new ComplexFeature.
   * @param {string} id - The feature ID
   */
  constructor(id) {
    super(id);
  }
}

/**
 * Feature symbol (value for symbolic features).
 */
export class FeatureSymbol extends Freezable {
  /**
   * Creates a new FeatureSymbol.
   * @param {string} id - The symbol ID
   */
  constructor(id) {
    super();
    this._id = id;
  }

  /**
   * Gets the symbol ID.
   * @returns {string}
   */
  get id() {
    return this._id;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._id;
  }

  /**
   * Checks equality.
   * @param {FeatureSymbol} other
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof FeatureSymbol && this._id === other._id;
  }
}
