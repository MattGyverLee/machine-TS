import { MprFeatureSet } from './MprFeature.js';

/**
 * Morpheme types.
 */
export const MorphemeType = Object.freeze({
  Stem: 'stem',
  Affix: 'affix',
});

/**
 * Base class for morphemes.
 */
export class Morpheme {
  constructor() {
    this._morphemeCoOccurrenceRules = new Set();
    this._properties = new Map();
    this._stratum = null;
    this._id = '';
    this._gloss = '';
    this._isPartial = false;
  }

  /**
   * Gets the stratum this morpheme belongs to.
   * @returns {Stratum|null}
   */
  get stratum() {
    return this._stratum;
  }

  /**
   * Sets the stratum.
   * @param {Stratum|null} value
   */
  set stratum(value) {
    this._stratum = value;
  }

  /**
   * Gets the ID.
   * @returns {string}
   */
  get id() {
    return this._id;
  }

  /**
   * Sets the ID.
   * @param {string} value
   */
  set id(value) {
    this._id = value;
  }

  /**
   * Gets the category/part of speech.
   * @returns {string}
   */
  get category() {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Gets the gloss.
   * @returns {string}
   */
  get gloss() {
    return this._gloss;
  }

  /**
   * Sets the gloss.
   * @param {string} value
   */
  set gloss(value) {
    this._gloss = value;
  }

  /**
   * Gets the morpheme type.
   * @returns {string}
   */
  get morphemeType() {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Gets the number of allomorphs.
   * @returns {number}
   */
  get allomorphCount() {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Gets whether this morpheme is partially analyzed.
   * @returns {boolean}
   */
  get isPartial() {
    return this._isPartial;
  }

  /**
   * Sets whether this morpheme is partially analyzed.
   * @param {boolean} value
   */
  set isPartial(value) {
    this._isPartial = value;
  }

  /**
   * Gets an allomorph by index.
   * @param {number} index
   * @returns {Allomorph}
   */
  getAllomorph(index) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Gets the morpheme co-occurrence rules.
   * @returns {Set<MorphemeCoOccurrenceRule>}
   */
  get morphemeCoOccurrenceRules() {
    return this._morphemeCoOccurrenceRules;
  }

  /**
   * Gets custom properties.
   * @returns {Map<string, any>}
   */
  get properties() {
    return this._properties;
  }
}
