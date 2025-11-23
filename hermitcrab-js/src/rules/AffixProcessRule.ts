import { MorphologicalRule, MorphemeType } from './MorphologicalRule';
import { Word } from '../morphology/Word';
import { Allomorph } from '../morphology/Allomorph';
import { Morpheme } from '../morphology/Morpheme';
import { PhonologicalRule } from './PhonologicalRule';
import { FeatureStruct } from '../features/FeatureStruct';

/**
 * Affix slot position.
 */
export enum AffixPosition {
  /**
   * Prefix (before root)
   */
  Prefix = 'prefix',

  /**
   * Suffix (after root)
   */
  Suffix = 'suffix',

  /**
   * Infix (inside root)
   */
  Infix = 'infix',

  /**
   * Circumfix (around root)
   */
  Circumfix = 'circumfix'
}

/**
 * Affix process rule handles affixation.
 * Adds affixes (prefixes, suffixes, infixes) to words.
 */
export class AffixProcessRule extends MorphologicalRule {
  private _allomorphs: Allomorph[];
  private _position: AffixPosition;
  private _phonologicalRules: PhonologicalRule[];
  private _requiredMprFeatures: Set<string>;
  private _excludedMprFeatures: Set<string>;

  /**
   * Creates a new affix process rule.
   * @param name - The name of this rule
   * @param allomorphs - The allomorphs for this affix
   * @param position - The position of the affix
   * @param blockable - Whether this rule can be blocked
   */
  constructor(
    name: string,
    allomorphs: Allomorph[],
    position: AffixPosition = AffixPosition.Suffix,
    blockable: boolean = true
  ) {
    super(name, blockable);
    this._allomorphs = allomorphs;
    this._position = position;
    this._phonologicalRules = [];
    this._requiredMprFeatures = new Set();
    this._excludedMprFeatures = new Set();
  }

  /**
   * Gets the allomorphs for this affix.
   */
  get allomorphs(): Allomorph[] {
    return this._allomorphs;
  }

  /**
   * Adds an allomorph to this rule.
   */
  addAllomorph(allomorph: Allomorph): void {
    this._allomorphs.push(allomorph);
  }

  /**
   * Gets the position of this affix.
   */
  get position(): AffixPosition {
    return this._position;
  }

  /**
   * Gets the phonological rules applied by this affix.
   */
  get phonologicalRules(): PhonologicalRule[] {
    return this._phonologicalRules;
  }

  /**
   * Adds a phonological rule.
   */
  addPhonologicalRule(rule: PhonologicalRule): void {
    this._phonologicalRules.push(rule);
  }

  /**
   * Gets required MPR features.
   */
  get requiredMprFeatures(): Set<string> {
    return this._requiredMprFeatures;
  }

  /**
   * Gets excluded MPR features.
   */
  get excludedMprFeatures(): Set<string> {
    return this._excludedMprFeatures;
  }

  /**
   * Applies this rule to a word.
   */
  *apply(morpher: any, word: Word): IterableIterator<Word> {
    if (!this.checkSyntacticFeatures(word)) {
      return;
    }

    // Try each allomorph
    for (const allomorph of this._allomorphs) {
      // Check if allomorph is valid for this word
      if (!allomorph.isWordValid(morpher, word)) {
        continue;
      }

      // Apply the affix based on position
      const newWord = this._applyAffix(word, allomorph);
      if (!newWord) continue;

      // Apply phonological rules
      let processedWord = newWord;
      for (const rule of this._phonologicalRules) {
        for (const result of rule.apply(processedWord)) {
          processedWord = result;
          break; // Take first result for now
        }
      }

      yield processedWord;
    }
  }

  /**
   * Applies the affix to the word based on position.
   */
  private _applyAffix(word: Word, allomorph: Allomorph): Word | null {
    const newWord = word.clone();

    switch (this._position) {
      case AffixPosition.Prefix:
        return this._applyPrefix(newWord, allomorph);

      case AffixPosition.Suffix:
        return this._applySuffix(newWord, allomorph);

      case AffixPosition.Infix:
        return this._applyInfix(newWord, allomorph);

      case AffixPosition.Circumfix:
        return this._applyCircumfix(newWord, allomorph);

      default:
        return null;
    }
  }

  /**
   * Applies a prefix.
   */
  private _applyPrefix(word: Word, allomorph: Allomorph): Word | null {
    // Get the shape nodes for the allomorph
    const affixNodes = allomorph.getShapeNodes();
    if (!affixNodes) return null;

    // Add nodes to the beginning of the word's shape
    for (let i = affixNodes.length - 1; i >= 0; i--) {
      word.shape.addFirst(affixNodes[i].clone());
    }

    // Mark the morph
    word.markMorph(affixNodes, allomorph, this.name);

    // Update features
    if (allomorph.morpheme) {
      word.mprFeatures.addAll(allomorph.morpheme.mprFeatures);
    }

    return word;
  }

  /**
   * Applies a suffix.
   */
  private _applySuffix(word: Word, allomorph: Allomorph): Word | null {
    // Get the shape nodes for the allomorph
    const affixNodes = allomorph.getShapeNodes();
    if (!affixNodes) return null;

    // Add nodes to the end of the word's shape
    for (const node of affixNodes) {
      word.shape.addLast(node.clone());
    }

    // Mark the morph
    word.markMorph(affixNodes, allomorph, this.name);

    // Update features
    if (allomorph.morpheme) {
      word.mprFeatures.addAll(allomorph.morpheme.mprFeatures);
    }

    return word;
  }

  /**
   * Applies an infix.
   */
  private _applyInfix(word: Word, allomorph: Allomorph): Word | null {
    // TODO: Implement infix insertion logic
    // Infixes require a pattern to determine insertion point
    return null;
  }

  /**
   * Applies a circumfix.
   */
  private _applyCircumfix(word: Word, allomorph: Allomorph): Word | null {
    // TODO: Implement circumfix logic
    // Circumfixes have two parts: one prefix and one suffix
    return null;
  }

  canApply(morpher: any, word: Word): boolean {
    if (!this.checkSyntacticFeatures(word)) {
      return false;
    }

    // Check if any allomorph can apply
    for (const allomorph of this._allomorphs) {
      if (allomorph.isWordValid(morpher, word)) {
        return true;
      }
    }

    return false;
  }

  getDescription(): string {
    const posStr = this._position.toString();
    return `${posStr} [${this._allomorphs.length} allomorphs]`;
  }
}
