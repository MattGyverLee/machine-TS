import { MorphologicalRule } from './MorphologicalRule';
import { Word } from '../morphology/Word';
import { LexEntry } from '../morphology/LexEntry';
import { PhonologicalRule } from './PhonologicalRule';

/**
 * Compounding rule combines two or more roots/stems to form compound words.
 * Example: "black" + "board" → "blackboard"
 */
export class CompoundingRule extends MorphologicalRule {
  private _phonologicalRules: PhonologicalRule[];
  private _maxApplicationCount: number;
  private _headMustBeRoot: boolean;
  private _nonHeadMustBeRoot: boolean;

  /**
   * Creates a new compounding rule.
   * @param name - The name of this rule
   * @param maxApplicationCount - Maximum number of times this can apply (default 2)
   * @param blockable - Whether this rule can be blocked
   */
  constructor(
    name: string,
    maxApplicationCount: number = 2,
    blockable: boolean = true
  ) {
    super(name, blockable);
    this._phonologicalRules = [];
    this._maxApplicationCount = maxApplicationCount;
    this._headMustBeRoot = true;
    this._nonHeadMustBeRoot = true;
  }

  /**
   * Gets the phonological rules applied during compounding.
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
   * Gets the maximum number of times this rule can apply.
   */
  get maxApplicationCount(): number {
    return this._maxApplicationCount;
  }

  /**
   * Gets whether the head must be a root.
   */
  get headMustBeRoot(): boolean {
    return this._headMustBeRoot;
  }

  /**
   * Sets whether the head must be a root.
   */
  set headMustBeRoot(value: boolean) {
    this._headMustBeRoot = value;
  }

  /**
   * Gets whether the non-head must be a root.
   */
  get nonHeadMustBeRoot(): boolean {
    return this._nonHeadMustBeRoot;
  }

  /**
   * Sets whether the non-head must be a root.
   */
  set nonHeadMustBeRoot(value: boolean) {
    this._nonHeadMustBeRoot = value;
  }

  /**
   * Applies this rule to a word by combining it with another entry.
   */
  *apply(morpher: any, word: Word): IterableIterator<Word> {
    if (!this.checkSyntacticFeatures(word)) {
      return;
    }

    // Check if we've reached max application count
    const currentCount = this._getCompoundingCount(word);
    if (currentCount >= this._maxApplicationCount) {
      return;
    }

    // TODO: Get candidate entries from morpher/lexicon
    // For now, this is a placeholder that would need access to the lexicon
    const candidates: LexEntry[] = [];

    for (const entry of candidates) {
      // Check if entry satisfies head/non-head constraints
      if (this._nonHeadMustBeRoot && !this._isRoot(entry)) {
        continue;
      }

      // Create compound word
      const compound = this._createCompound(word, entry);
      if (!compound) continue;

      // Apply phonological rules
      let processedWord = compound;
      for (const rule of this._phonologicalRules) {
        for (const result of rule.apply(processedWord)) {
          processedWord = result;
          break; // Take first result
        }
      }

      yield processedWord;
    }
  }

  /**
   * Creates a compound word by combining the base word with an entry.
   */
  private _createCompound(word: Word, entry: LexEntry): Word | null {
    const newWord = word.clone();

    // Try each allomorph of the entry
    for (const allomorph of entry.allomorphs) {
      const nodes = allomorph.getShapeNodes();
      if (!nodes) continue;

      // Add nodes to the word's shape (typically at the beginning for left-headed compounds)
      // Or at the end for right-headed compounds
      // This is a simplification - actual implementation would depend on compound type

      for (const node of nodes) {
        newWord.shape.addLast(node.clone());
      }

      // Mark the morph
      newWord.markMorph(nodes, allomorph, this.name);

      // Merge features
      newWord.syntacticFeatureStruct = newWord.syntacticFeatureStruct.clone();
      if (entry.syntacticFeatureStruct) {
        const unified = newWord.syntacticFeatureStruct.unify(entry.syntacticFeatureStruct);
        if (unified) {
          newWord.syntacticFeatureStruct = unified;
        }
      }

      return newWord;
    }

    return null;
  }

  /**
   * Gets the number of times compounding has been applied to this word.
   */
  private _getCompoundingCount(word: Word): number {
    // Count how many compound morphs are in the word
    // This would examine word.morphs to count compound applications
    // Placeholder implementation
    return 0;
  }

  /**
   * Checks if an entry is a root.
   */
  private _isRoot(entry: LexEntry): boolean {
    // Check if the entry is marked as a root
    // This would examine entry properties or allomorph types
    return true; // Placeholder
  }

  canApply(morpher: any, word: Word): boolean {
    if (!this.checkSyntacticFeatures(word)) {
      return false;
    }

    const currentCount = this._getCompoundingCount(word);
    return currentCount < this._maxApplicationCount;
  }

  getDescription(): string {
    return `Compounding (max: ${this._maxApplicationCount})`;
  }
}
