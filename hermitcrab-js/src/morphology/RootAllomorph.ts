import { Allomorph } from './Allomorph.js';
import { HCFeatureSystem } from '../core/HCFeatureSystem.js';

/**
 * Root allomorph in a lexical entry.
 */
export class RootAllomorph extends Allomorph {
  /**
   * Creates a new RootAllomorph.
   * @param {Segments} segments - The phonological segments
   */
  constructor(segments) {
    super();
    this._segments = segments;
    this._stemName = null;
    this._isBound = false;
    this._isPattern = false;

    // Check if this is a pattern
    for (const node of segments.shape.getNodes(segments.shape.range)) {
      // Check for iterative nodes or optional segments
      if (
        node.annotation.data?.iterative ||
        (node.annotation.optional &&
          node.annotation.featureStruct.getValue(HCFeatureSystem.Type) !==
            HCFeatureSystem.Boundary)
      ) {
        this._isPattern = true;
        break;
      }
    }
  }

  /**
   * Gets the phonological segments.
   * @returns {Segments}
   */
  get segments() {
    return this._segments;
  }

  /**
   * Gets the stem name.
   * @returns {StemName|null}
   */
  get stemName() {
    return this._stemName;
  }

  /**
   * Sets the stem name.
   * @param {StemName|null} value
   */
  set stemName(value) {
    this._stemName = value;
  }

  /**
   * Gets whether this is a bound root.
   * @returns {boolean}
   */
  get isBound() {
    return this._isBound;
  }

  /**
   * Sets whether this is a bound root.
   * @param {boolean} value
   */
  set isBound(value) {
    this._isBound = value;
  }

  /**
   * Gets whether this represents a lexical pattern.
   * @returns {boolean}
   */
  get isPattern() {
    return this._isPattern;
  }

  /**
   * Checks if constraints are equal to another allomorph.
   * @param {Allomorph} other
   * @returns {boolean}
   * @protected
   */
  constraintsEqual(other) {
    if (!(other instanceof RootAllomorph)) {
      return false;
    }

    return super.constraintsEqual(other) && this._isBound === other._isBound;
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
    // Check if bound root used alone
    if (this._isBound && word.allomorphs.length === 1) {
      if (morpher?.traceManager?.isTracing) {
        morpher.traceManager.failed(morpher.language, word, 'BoundRoot', this, null);
      }
      return false;
    }

    // Check required stem name
    if (this._stemName && !this._stemName.isRequiredMatch(word.syntacticFeatureStruct)) {
      if (morpher?.traceManager?.isTracing) {
        morpher.traceManager.failed(
          morpher.language,
          word,
          'RequiredStemName',
          this,
          this._stemName
        );
      }
      return false;
    }

    // Check excluded stem names
    if (this.morpheme) {
      const lexEntry = this.morpheme;
      for (const otherAllo of lexEntry.allomorphs || []) {
        if (otherAllo !== this && otherAllo.stemName) {
          if (
            !otherAllo.stemName.isExcludedMatch(word.syntacticFeatureStruct, this._stemName)
          ) {
            if (morpher?.traceManager?.isTracing) {
              morpher.traceManager.failed(
                morpher.language,
                word,
                'ExcludedStemName',
                this,
                otherAllo.stemName
              );
            }
            return false;
          }
        }
      }
    }

    return super.checkAllomorphConstraints(morpher, allomorph, word);
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._segments.toString();
  }
}
