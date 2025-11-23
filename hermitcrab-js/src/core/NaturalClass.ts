import { FeatureStruct } from '../features/FeatureStruct.js';
import { HCFeatureSystem } from './HCFeatureSystem.js';

/**
 * Represents a natural class of phonological segments.
 */
export class NaturalClass {
  /**
   * Creates a new NaturalClass.
   * @param {FeatureStruct} fs - The feature structure defining this natural class
   * @param {string} [name=''] - The name of the natural class
   */
  constructor(fs, name = '') {
    if (!fs.isFrozen) {
      fs.addValue(HCFeatureSystem.Type, HCFeatureSystem.Segment);
      fs.freeze();
    }

    this._featureStruct = fs;
    this._name = name;
  }

  /**
   * Gets the name of this natural class.
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Sets the name of this natural class.
   * @param {string} value
   */
  set name(value) {
    this._name = value;
  }

  /**
   * Gets the feature structure.
   * @returns {FeatureStruct}
   */
  get featureStruct() {
    return this._featureStruct;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._name || super.toString();
  }
}
