import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for allomorphs.
 */
export class Allomorph {
  constructor() {
    this._id = `allomorph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this._morpheme = null;
    this._index = -1;
    this._environments = new Set();
    this._allomorphCoOccurrenceRules = new Set();
    this._properties = new Map();
    this._guessed = false;
  }

  /**
   * Gets the internal ID.
   * @returns {string}
   */
  get ID() {
    return this._id;
  }

  /**
   * Gets the morpheme this allomorph belongs to.
   * @returns {Morpheme|null}
   */
  get morpheme() {
    return this._morpheme;
  }

  /**
   * Sets the morpheme (internal use).
   * @param {Morpheme|null} value
   */
  set morpheme(value) {
    this._morpheme = value;
  }

  /**
   * Gets the index of this allomorph in the morpheme.
   * @returns {number}
   */
  get index() {
    return this._index;
  }

  /**
   * Sets the index (internal use).
   * @param {number} value
   */
  set index(value) {
    this._index = value;
  }

  /**
   * Gets the environments where this allomorph can occur.
   * @returns {Set<AllomorphEnvironment>}
   */
  get environments() {
    return this._environments;
  }

  /**
   * Gets the allomorph co-occurrence rules.
   * @returns {Set<AllomorphCoOccurrenceRule>}
   */
  get allomorphCoOccurrenceRules() {
    return this._allomorphCoOccurrenceRules;
  }

  /**
   * Gets custom properties.
   * @returns {Map<string, any>}
   */
  get properties() {
    return this._properties;
  }

  /**
   * Gets whether this allomorph was guessed by a lexical pattern.
   * @returns {boolean}
   */
  get guessed() {
    return this._guessed;
  }

  /**
   * Sets whether this allomorph was guessed.
   * @param {boolean} value
   */
  set guessed(value) {
    this._guessed = value;
  }

  /**
   * Checks if this allomorph freely fluctuates with another.
   * @param {Allomorph} other - The other allomorph
   * @returns {boolean}
   */
  freeFluctuatesWith(other) {
    if (this === other) {
      return true;
    }

    if (this._morpheme !== other._morpheme) {
      return false;
    }

    const minIndex = Math.min(this._index, other._index);
    const maxIndex = Math.max(this._index, other._index);

    for (let i = minIndex; i < maxIndex; i++) {
      const cur = this._morpheme.getAllomorph(i);
      const next = this._morpheme.getAllomorph(i + 1);
      if (!cur.constraintsEqual(next)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if constraints are equal to another allomorph.
   * @param {Allomorph} other
   * @returns {boolean}
   * @protected
   */
  constraintsEqual(other) {
    // Check if environments are equal
    if (this._environments.size !== other._environments.size) {
      return false;
    }

    for (const env of this._environments) {
      if (!other._environments.has(env)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if a word is valid for this allomorph.
   * @param {Morpher} morpher - The morpher
   * @param {Word} word - The word to check
   * @returns {boolean}
   */
  isWordValid(morpher, word) {
    if (!this.checkAllomorphConstraints(morpher, this, word)) {
      return false;
    }

    const morphs = word.getMorphs(this);
    for (const morph of morphs) {
      // Check environments
      if (this._environments.size > 0) {
        let envValid = false;
        for (const env of this._environments) {
          if (env.isWordValid(word, morph)) {
            envValid = true;
            break;
          }
        }

        if (!envValid) {
          if (morpher.traceManager?.isTracing) {
            morpher.traceManager.failed(
              morpher.language,
              word,
              'Environments',
              this,
              this._environments
            );
          }
          return false;
        }
      }

      // Check disjunctive allomorphs
      const disjunctiveApps = word.getDisjunctiveAllomorphApplications(morph);
      const range = disjunctiveApps ?? Array.from({ length: this._index }, (_, i) => i);

      for (const i of range) {
        const disjunctiveAllomorph = this._morpheme.getAllomorph(i);

        if (
          !this.freeFluctuatesWith(disjunctiveAllomorph) &&
          (disjunctiveAllomorph.environments.size === 0 ||
            Array.from(disjunctiveAllomorph.environments).some((e) =>
              e.isWordValid(word, morph)
            )) &&
          disjunctiveAllomorph.checkAllomorphConstraints(null, this, word)
        ) {
          if (morpher.traceManager?.isTracing) {
            morpher.traceManager.failed(
              morpher.language,
              word,
              'DisjunctiveAllomorph',
              this,
              disjunctiveAllomorph
            );
          }
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Checks allomorph constraints.
   * @param {Morpher|null} morpher - The morpher
   * @param {Allomorph} allomorph - The allomorph
   * @param {Word} word - The word
   * @returns {boolean}
   * @protected
   */
  checkAllomorphConstraints(morpher, allomorph, word) {
    // Check allomorph co-occurrence rules
    if (this._allomorphCoOccurrenceRules.size > 0) {
      for (const rule of this._allomorphCoOccurrenceRules) {
        if (!rule.isWordValid(allomorph, word)) {
          if (morpher?.traceManager?.isTracing) {
            morpher.traceManager.failed(
              morpher.language,
              word,
              'AllomorphCoOccurrenceRules',
              this,
              rule
            );
          }
          return false;
        }
      }
    }

    // Check morpheme co-occurrence rules
    if (this._morpheme && this._morpheme.morphemeCoOccurrenceRules.size > 0) {
      for (const rule of this._morpheme.morphemeCoOccurrenceRules) {
        if (!rule.isWordValid(this._morpheme, word)) {
          if (morpher?.traceManager?.isTracing) {
            morpher.traceManager.failed(
              morpher.language,
              word,
              'MorphemeCoOccurrenceRules',
              this,
              rule
            );
          }
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Compares this allomorph to another.
   * @param {Allomorph} other
   * @returns {number} -1, 0, or 1
   */
  compareTo(other) {
    if (other === null) {
      return 1;
    }

    // Compare by morpheme hash code
    const morphemeHash1 = this._morpheme ? this._morpheme.constructor.name.length : 0;
    const morphemeHash2 = other._morpheme ? other._morpheme.constructor.name.length : 0;

    const res = morphemeHash1 < morphemeHash2 ? -1 : morphemeHash1 > morphemeHash2 ? 1 : 0;
    if (res !== 0) {
      return res;
    }

    // Compare by index
    return this._index < other._index ? -1 : this._index > other._index ? 1 : 0;
  }
}
