import { Word } from '../morphology/Word';
import { Allomorph } from '../morphology/Allomorph';
import { FeatureStruct } from '../features/FeatureStruct';

/**
 * Morpheme type for morphological rules.
 */
export enum MorphemeType {
  /**
   * Affix (prefix, suffix, infix, etc.)
   */
  Affix = 'affix',

  /**
   * Root/stem
   */
  Root = 'root',

  /**
   * Clitic
   */
  Clitic = 'clitic'
}

/**
 * Base class for all morphological rules.
 * Morphological rules combine morphemes to form words.
 */
export abstract class MorphologicalRule {
  private _name: string;
  private _blockable: boolean;
  private _requiredSyntacticFeatureStruct: FeatureStruct | null;
  private _excludedSyntacticFeatureStruct: FeatureStruct | null;

  /**
   * Creates a new morphological rule.
   * @param name - The name of this rule
   * @param blockable - Whether this rule can be blocked (default true)
   */
  constructor(name: string, blockable: boolean = true) {
    this._name = name;
    this._blockable = blockable;
    this._requiredSyntacticFeatureStruct = null;
    this._excludedSyntacticFeatureStruct = null;
  }

  /**
   * Gets the name of this rule.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets whether this rule can be blocked.
   */
  get blockable(): boolean {
    return this._blockable;
  }

  /**
   * Gets the required syntactic feature structure.
   */
  get requiredSyntacticFeatureStruct(): FeatureStruct | null {
    return this._requiredSyntacticFeatureStruct;
  }

  /**
   * Sets the required syntactic feature structure.
   */
  set requiredSyntacticFeatureStruct(value: FeatureStruct | null) {
    this._requiredSyntacticFeatureStruct = value;
  }

  /**
   * Gets the excluded syntactic feature structure.
   */
  get excludedSyntacticFeatureStruct(): FeatureStruct | null {
    return this._excludedSyntacticFeatureStruct;
  }

  /**
   * Sets the excluded syntactic feature structure.
   */
  set excludedSyntacticFeatureStruct(value: FeatureStruct | null) {
    this._excludedSyntacticFeatureStruct = value;
  }

  /**
   * Applies this rule to a word.
   * @param morpher - The morpher context
   * @param word - The word to transform
   * @returns An iterator of transformed words
   */
  abstract apply(morpher: any, word: Word): IterableIterator<Word>;

  /**
   * Checks if this rule can apply to a word.
   * @param morpher - The morpher context
   * @param word - The word to check
   * @returns True if the rule can apply
   */
  abstract canApply(morpher: any, word: Word): boolean;

  /**
   * Checks if the word satisfies syntactic feature constraints.
   */
  protected checkSyntacticFeatures(word: Word): boolean {
    if (this._requiredSyntacticFeatureStruct) {
      if (!word.syntacticFeatureStruct.isUnifiable(this._requiredSyntacticFeatureStruct)) {
        return false;
      }
    }

    if (this._excludedSyntacticFeatureStruct) {
      if (word.syntacticFeatureStruct.isUnifiable(this._excludedSyntacticFeatureStruct)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets a description of what this rule does.
   */
  abstract getDescription(): string;

  toString(): string {
    return this._name || this.getDescription();
  }
}
