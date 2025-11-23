/**
 * Morphological/phonological rule feature for restricting rule application.
 */
export class MprFeature {
  /**
   * Creates a new MprFeature.
   * @param {string} name - The feature name
   */
  constructor(name = '') {
    this._name = name;
    this._group = null;
  }

  /**
   * Gets the feature name.
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Sets the feature name.
   * @param {string} value
   */
  set name(value) {
    this._name = value;
  }

  /**
   * Gets the MPR feature group this belongs to.
   * @returns {MprFeatureGroup|null}
   */
  get group() {
    return this._group;
  }

  /**
   * Sets the MPR feature group (internal use).
   * @param {MprFeatureGroup|null} value
   */
  set group(value) {
    this._group = value;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._name || super.toString();
  }
}

/**
 * Match types for MPR feature groups.
 */
export const MprFeatureGroupMatchType = Object.freeze({
  All: 'all',
  Any: 'any',
});

/**
 * Output types for MPR feature groups.
 */
export const MprFeatureGroupOutput = Object.freeze({
  Overwrite: 'overwrite',
  Append: 'append',
});

/**
 * Group of MPR features.
 */
export class MprFeatureGroup {
  /**
   * Creates a new MprFeatureGroup.
   * @param {string} name - The group name
   */
  constructor(name = '') {
    this._name = name;
    this._mprFeatures = new Set();
    this._matchType = MprFeatureGroupMatchType.All;
    this._output = MprFeatureGroupOutput.Append;
  }

  /**
   * Gets the group name.
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Sets the group name.
   * @param {string} value
   */
  set name(value) {
    this._name = value;
  }

  /**
   * Gets the MPR features in this group.
   * @returns {Set<MprFeature>}
   */
  get mprFeatures() {
    return this._mprFeatures;
  }

  /**
   * Gets the match type.
   * @returns {string}
   */
  get matchType() {
    return this._matchType;
  }

  /**
   * Sets the match type.
   * @param {string} value
   */
  set matchType(value) {
    this._matchType = value;
  }

  /**
   * Gets the output type.
   * @returns {string}
   */
  get output() {
    return this._output;
  }

  /**
   * Sets the output type.
   * @param {string} value
   */
  set output(value) {
    this._output = value;
  }

  /**
   * Adds a feature to this group.
   * @param {MprFeature} feature
   */
  addFeature(feature) {
    this._mprFeatures.add(feature);
    feature.group = this;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._name || super.toString();
  }
}

/**
 * Set of MPR features.
 */
export class MprFeatureSet extends Set {
  /**
   * Creates a new MprFeatureSet.
   * @param {Iterable<MprFeature>} [features] - Initial features
   */
  constructor(features = []) {
    super(features);
  }

  /**
   * Gets all groups in this set.
   * @returns {Array<MprFeatureGroup>}
   */
  get groups() {
    const groups = new Set();
    for (const feat of this) {
      if (feat.group !== null) {
        groups.add(feat.group);
      }
    }
    return Array.from(groups);
  }

  /**
   * Adds output features, handling group overwrite logic.
   * @param {MprFeatureSet} mprFeats - Features to add
   */
  addOutput(mprFeats) {
    // Handle overwrite groups
    for (const group of mprFeats.groups) {
      if (group.output === MprFeatureGroupOutput.Overwrite) {
        for (const mprFeat of group.mprFeatures) {
          if (!mprFeats.has(mprFeat)) {
            this.delete(mprFeat);
          }
        }
      }
    }

    // Union with new features
    for (const feat of mprFeats) {
      this.add(feat);
    }
  }

  /**
   * Checks if a required match is satisfied.
   * @param {MprFeatureSet} mprFeats - Features to check against
   * @returns {{success: boolean, mismatchGroup: MprFeatureGroup|null}}
   */
  isMatchRequired(mprFeats) {
    // Group features by their group
    const grouped = this._groupBy((mf) => mf.group);

    for (const [group, features] of grouped) {
      if (group === null || group.matchType === MprFeatureGroupMatchType.All) {
        // All features in group must match
        if (features.some((mf) => !mprFeats.has(mf))) {
          return { success: false, mismatchGroup: group };
        }
      } else {
        // At least one feature in group must match
        if (features.every((mf) => !mprFeats.has(mf))) {
          return { success: false, mismatchGroup: group };
        }
      }
    }

    return { success: true, mismatchGroup: null };
  }

  /**
   * Checks if an excluded match is satisfied.
   * @param {MprFeatureSet} mprFeats - Features to check against
   * @returns {{success: boolean, mismatchGroup: MprFeatureGroup|null}}
   */
  isMatchExcluded(mprFeats) {
    const grouped = this._groupBy((mf) => mf.group);

    for (const [group, features] of grouped) {
      if (group === null || group.matchType === MprFeatureGroupMatchType.All) {
        // No features in group should match
        if (features.some((mf) => mprFeats.has(mf))) {
          return { success: false, mismatchGroup: group };
        }
      } else {
        // Not all features in group should match
        if (features.every((mf) => mprFeats.has(mf))) {
          return { success: false, mismatchGroup: group };
        }
      }
    }

    return { success: true, mismatchGroup: null };
  }

  /**
   * Checks if compound MPR features match.
   * @param {MprFeatureSet} stemMprFeatures - Stem features
   * @returns {boolean}
   */
  compoundMprFeaturesMatch(stemMprFeatures) {
    if (this.size === 0) return true;

    for (const feat of this) {
      if (stemMprFeatures.has(feat)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Groups features by a key function.
   * @param {Function} keyFn - Function to get group key
   * @returns {Map}
   * @private
   */
  _groupBy(keyFn) {
    const map = new Map();
    for (const item of this) {
      const key = keyFn(item);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    }
    return map;
  }

  /**
   * Clones this MPR feature set.
   * @returns {MprFeatureSet}
   */
  clone() {
    return new MprFeatureSet(this);
  }
}
