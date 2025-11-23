import { Morpheme, MorphemeType } from './Morpheme.js';
import { MprFeatureSet } from './MprFeature.js';
import { FeatureStruct } from '../features/FeatureStruct.js';

/**
 * Lexical entry (root/stem).
 */
export class LexEntry extends Morpheme {
  constructor() {
    super();
    this._allomorphs = [];
    this._mprFeatures = new MprFeatureSet();
    this._syntacticFeatureStruct = FeatureStruct.create();
    this._family = null;
  }

  /**
   * Gets the primary allomorph (first one).
   * @returns {RootAllomorph|null}
   */
  get primaryAllomorph() {
    return this._allomorphs.length > 0 ? this._allomorphs[0] : null;
  }

  /**
   * Gets the allomorphs.
   * @returns {Array<RootAllomorph>}
   */
  get allomorphs() {
    return this._allomorphs;
  }

  /**
   * Adds an allomorph.
   * @param {RootAllomorph} allomorph
   */
  addAllomorph(allomorph) {
    allomorph.morpheme = this;
    allomorph.index = this._allomorphs.length;
    this._allomorphs.push(allomorph);
  }

  /**
   * Removes an allomorph.
   * @param {RootAllomorph} allomorph
   * @returns {boolean}
   */
  removeAllomorph(allomorph) {
    const index = this._allomorphs.indexOf(allomorph);
    if (index === -1) {
      return false;
    }

    this._allomorphs.splice(index, 1);
    allomorph.morpheme = null;
    allomorph.index = -1;

    // Reindex remaining allomorphs
    for (let i = index; i < this._allomorphs.length; i++) {
      this._allomorphs[i].index = i;
    }

    return true;
  }

  /**
   * Gets the MPR features.
   * @returns {MprFeatureSet}
   */
  get mprFeatures() {
    return this._mprFeatures;
  }

  /**
   * Sets the MPR features.
   * @param {MprFeatureSet} value
   */
  set mprFeatures(value) {
    this._mprFeatures = value;
  }

  /**
   * Gets the syntactic feature structure.
   * @returns {FeatureStruct}
   */
  get syntacticFeatureStruct() {
    return this._syntacticFeatureStruct;
  }

  /**
   * Sets the syntactic feature structure.
   * @param {FeatureStruct} value
   */
  set syntacticFeatureStruct(value) {
    this._syntacticFeatureStruct = value;
  }

  /**
   * Gets the lexical family.
   * @returns {LexFamily|null}
   */
  get family() {
    return this._family;
  }

  /**
   * Sets the lexical family (internal use).
   * @param {LexFamily|null} value
   */
  set family(value) {
    this._family = value;
  }

  /**
   * Gets the category/part of speech.
   * @returns {string}
   */
  get category() {
    // TODO: Extract from syntactic feature struct
    // For now, return empty string
    return '';
  }

  /**
   * Gets the morpheme type.
   * @returns {string}
   */
  get morphemeType() {
    return MorphemeType.Stem;
  }

  /**
   * Gets the number of allomorphs.
   * @returns {number}
   */
  get allomorphCount() {
    return this._allomorphs.length;
  }

  /**
   * Gets an allomorph by index.
   * @param {number} index
   * @returns {RootAllomorph}
   */
  getAllomorph(index) {
    return this._allomorphs[index];
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    if (this._allomorphs.length === 0 || !this._stratum) {
      return super.toString();
    }
    return this.primaryAllomorph.segments.toString();
  }
}
