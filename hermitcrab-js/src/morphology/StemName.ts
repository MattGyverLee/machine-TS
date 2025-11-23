import { FeatureStruct } from '../features/FeatureStruct.js';

/**
 * Represents a stem name with feature structure regions.
 */
export class StemName {
  /**
   * Creates a new StemName.
   * @param {...FeatureStruct|Array<FeatureStruct>} regions - Feature structure regions
   */
  constructor(...regions) {
    // Handle both ...regions and single array argument
    let regionsArray;
    if (regions.length === 1 && Array.isArray(regions[0])) {
      regionsArray = regions[0];
    } else {
      regionsArray = regions;
    }

    if (regionsArray.length === 0) {
      throw new Error('A region must be specified');
    }

    this._regions = Object.freeze([...regionsArray]);
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
   * Gets the regions.
   * @returns {ReadonlyArray<FeatureStruct>}
   */
  get regions() {
    return this._regions;
  }

  /**
   * Checks if this is a required match for a feature structure.
   * @param {FeatureStruct} fs - Feature structure to check
   * @returns {boolean}
   */
  isRequiredMatch(fs) {
    // TODO: Implement proper subsumption check
    // For now, check if any region contains all features of fs
    for (const region of this._regions) {
      if (this._subsumes(region, fs)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if this is an excluded match for a feature structure.
   * @param {FeatureStruct} fs - Feature structure to check
   * @param {StemName|null} stemName - Stem name to exclude from check
   * @returns {boolean}
   */
  isExcludedMatch(fs, stemName = null) {
    // Get regions not in the excluded stem name
    const excludedRegions = stemName ? stemName.regions : [];
    const regionsToCheck = this._regions.filter(
      (r) => !excludedRegions.some((er) => r.valueEquals(er))
    );

    // All remaining regions should not subsume fs
    return regionsToCheck.every((r) => !this._subsumes(r, fs));
  }

  /**
   * Checks if region subsumes fs (simplified).
   * @param {FeatureStruct} region
   * @param {FeatureStruct} fs
   * @returns {boolean}
   * @private
   */
  _subsumes(region, fs) {
    // TODO: Implement proper subsumption
    // For now, check if all features in region are in fs with same values
    for (const feature of region.features) {
      const regionValue = region.getValue(feature);
      const fsValue = fs.getValue(feature);

      if (!fsValue || !this._valuesMatch(regionValue, fsValue)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if two feature values match (simplified).
   * @param {FeatureValue} v1
   * @param {FeatureValue} v2
   * @returns {boolean}
   * @private
   */
  _valuesMatch(v1, v2) {
    if (v1 === v2) return true;
    if (v1 && v1.valueEquals) return v1.valueEquals(v2);
    return false;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._name || super.toString();
  }
}
