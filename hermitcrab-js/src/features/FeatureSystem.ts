import { Freezable } from '../utils/Freezable.js';
import { Feature, FeatureSymbol } from './Feature.js';

/**
 * Feature system - container for all features and symbols.
 */
export class FeatureSystem extends Freezable {
  constructor() {
    super();
    this._features = new Map(); // Map<string, Feature>
    this._symbols = new Map(); // Map<string, FeatureSymbol>
  }

  /**
   * Gets a feature by ID.
   * @param {string} id - The feature ID
   * @returns {Feature}
   * @throws {Error} If feature not found
   */
  getFeature(id) {
    const feature = this._features.get(id);
    if (!feature) {
      throw new Error(`Feature '${id}' not found`);
    }
    return feature;
  }

  /**
   * Tries to get a feature by ID.
   * @param {string} id - The feature ID
   * @returns {{success: boolean, feature: Feature|null}}
   */
  tryGetFeature(id) {
    const feature = this._features.get(id);
    return {
      success: feature !== undefined,
      feature: feature ?? null,
    };
  }

  /**
   * Gets a feature by index (bracket notation).
   * @param {string} id - The feature ID
   * @returns {Feature}
   */
  get(id) {
    return this.getFeature(id);
  }

  /**
   * Adds a feature to the system.
   * @param {Feature} feature - The feature to add
   */
  addFeature(feature) {
    this.checkFrozen();

    if (this._features.has(feature.id)) {
      throw new Error(`Feature '${feature.id}' already exists`);
    }

    this._features.set(feature.id, feature);
  }

  /**
   * Checks if a feature exists by ID.
   * @param {string} id - The feature ID
   * @returns {boolean}
   */
  containsFeature(id) {
    return this._features.has(id);
  }

  /**
   * Checks if a feature object is in the system.
   * @param {Feature} feature - The feature
   * @returns {boolean}
   */
  hasFeature(feature) {
    return this._features.get(feature.id) === feature;
  }

  /**
   * Gets all features.
   * @returns {Array<Feature>}
   */
  get features() {
    return Array.from(this._features.values());
  }

  /**
   * Gets the symbol with the specified ID.
   * @param {string} id - The symbol ID
   * @returns {FeatureSymbol}
   * @throws {Error} If symbol not found
   */
  getSymbol(id) {
    const symbol = this._symbols.get(id);
    if (!symbol) {
      throw new Error(`Symbol '${id}' not found`);
    }
    return symbol;
  }

  /**
   * Tries to get a symbol by ID.
   * @param {string} id - The symbol ID
   * @returns {{success: boolean, symbol: FeatureSymbol|null}}
   */
  tryGetSymbol(id) {
    const symbol = this._symbols.get(id);
    return {
      success: symbol !== undefined,
      symbol: symbol ?? null,
    };
  }

  /**
   * Adds a symbol to the system.
   * @param {FeatureSymbol} symbol - The symbol to add
   */
  addSymbol(symbol) {
    this.checkFrozen();

    if (this._symbols.has(symbol.id)) {
      throw new Error(`Symbol '${symbol.id}' already exists`);
    }

    this._symbols.set(symbol.id, symbol);
  }

  /**
   * Checks if a symbol exists by ID.
   * @param {string} id - The symbol ID
   * @returns {boolean}
   */
  containsSymbol(id) {
    return this._symbols.has(id);
  }

  /**
   * Gets all symbols.
   * @returns {Array<FeatureSymbol>}
   */
  get symbols() {
    return Array.from(this._symbols.values());
  }

  /**
   * Gets the number of features.
   * @returns {number}
   */
  get count() {
    return this._features.size;
  }

  /**
   * Iterates over features.
   * @returns {IterableIterator<Feature>}
   */
  *[Symbol.iterator]() {
    yield* this._features.values();
  }

  /**
   * Freezes the feature system.
   */
  freeze() {
    if (this._frozen) return;

    super.freeze();

    // Freeze all features and symbols
    for (const feature of this._features.values()) {
      feature.freeze();
    }

    for (const symbol of this._symbols.values()) {
      symbol.freeze();
    }
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    const featureList = Array.from(this._features.keys()).join(', ');
    return `FeatureSystem[${featureList}]`;
  }
}
