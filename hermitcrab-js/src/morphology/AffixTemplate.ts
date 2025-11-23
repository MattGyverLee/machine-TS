import { AffixProcessRule } from '../rules/AffixProcessRule';
import { Word } from './Word';
import { FeatureStruct } from '../features/FeatureStruct';

/**
 * Affix slot in a template.
 * Represents a position where an affix can be attached.
 */
export class AffixSlot {
  private _name: string;
  private _optional: boolean;
  private _rules: AffixProcessRule[];
  private _requiredFeatures: FeatureStruct | null;

  /**
   * Creates a new affix slot.
   * @param name - The name of this slot
   * @param optional - Whether this slot is optional
   */
  constructor(name: string, optional: boolean = false) {
    this._name = name;
    this._optional = optional;
    this._rules = [];
    this._requiredFeatures = null;
  }

  /**
   * Gets the name of this slot.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets whether this slot is optional.
   */
  get optional(): boolean {
    return this._optional;
  }

  /**
   * Sets whether this slot is optional.
   */
  set optional(value: boolean) {
    this._optional = value;
  }

  /**
   * Gets the rules for this slot.
   */
  get rules(): AffixProcessRule[] {
    return this._rules;
  }

  /**
   * Adds a rule to this slot.
   */
  addRule(rule: AffixProcessRule): void {
    this._rules.push(rule);
  }

  /**
   * Gets the required features for this slot.
   */
  get requiredFeatures(): FeatureStruct | null {
    return this._requiredFeatures;
  }

  /**
   * Sets the required features for this slot.
   */
  set requiredFeatures(value: FeatureStruct | null) {
    this._requiredFeatures = value;
  }

  /**
   * Checks if this slot can be filled given a word.
   */
  canFill(morpher: any, word: Word): boolean {
    // Check required features
    if (this._requiredFeatures) {
      if (!word.syntacticFeatureStruct.isUnifiable(this._requiredFeatures)) {
        return false;
      }
    }

    // Check if any rule can apply
    for (const rule of this._rules) {
      if (rule.canApply(morpher, word)) {
        return true;
      }
    }

    return this._optional;
  }

  /**
   * Applies this slot to a word.
   */
  *apply(morpher: any, word: Word): IterableIterator<Word> {
    // Try each rule in this slot
    for (const rule of this._rules) {
      if (rule.canApply(morpher, word)) {
        yield* rule.apply(morpher, word);
      }
    }

    // If optional, also yield the unchanged word
    if (this._optional) {
      yield word;
    }
  }

  toString(): string {
    const optMarker = this._optional ? '?' : '';
    return `${this._name}${optMarker}[${this._rules.length} rules]`;
  }
}

/**
 * Affix template defines the order and structure of affixes.
 * Templates ensure affixes are applied in the correct order.
 */
export class AffixTemplate {
  private _name: string;
  private _slots: AffixSlot[];
  private _requiredSyntacticFeatureStruct: FeatureStruct | null;
  private _finalOutputSyntacticFeatureStruct: FeatureStruct | null;

  /**
   * Creates a new affix template.
   * @param name - The name of this template
   */
  constructor(name: string) {
    this._name = name;
    this._slots = [];
    this._requiredSyntacticFeatureStruct = null;
    this._finalOutputSyntacticFeatureStruct = null;
  }

  /**
   * Gets the name of this template.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the slots in this template.
   */
  get slots(): AffixSlot[] {
    return this._slots;
  }

  /**
   * Adds a slot to this template.
   */
  addSlot(slot: AffixSlot): void {
    this._slots.push(slot);
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
   * Gets the final output syntactic feature structure.
   */
  get finalOutputSyntacticFeatureStruct(): FeatureStruct | null {
    return this._finalOutputSyntacticFeatureStruct;
  }

  /**
   * Sets the final output syntactic feature structure.
   */
  set finalOutputSyntacticFeatureStruct(value: FeatureStruct | null) {
    this._finalOutputSyntacticFeatureStruct = value;
  }

  /**
   * Checks if this template can apply to a word.
   */
  canApply(morpher: any, word: Word): boolean {
    // Check required features
    if (this._requiredSyntacticFeatureStruct) {
      if (!word.syntacticFeatureStruct.isUnifiable(this._requiredSyntacticFeatureStruct)) {
        return false;
      }
    }

    // Check if all non-optional slots can be filled
    for (const slot of this._slots) {
      if (!slot.optional && !slot.canFill(morpher, word)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Applies this template to a word.
   * Processes slots in order, potentially creating multiple output words.
   */
  *apply(morpher: any, word: Word): IterableIterator<Word> {
    if (!this.canApply(morpher, word)) {
      return;
    }

    // Apply slots recursively
    yield* this._applySlots(morpher, word, 0);
  }

  /**
   * Recursively applies slots starting from a given index.
   */
  private *_applySlots(morpher: any, word: Word, slotIndex: number): IterableIterator<Word> {
    // Base case: all slots processed
    if (slotIndex >= this._slots.length) {
      // Apply final output features if specified
      if (this._finalOutputSyntacticFeatureStruct) {
        const finalWord = word.clone();
        const unified = finalWord.syntacticFeatureStruct.unify(this._finalOutputSyntacticFeatureStruct);
        if (unified) {
          finalWord.syntacticFeatureStruct = unified;
          yield finalWord;
        }
      } else {
        yield word;
      }
      return;
    }

    const slot = this._slots[slotIndex];

    // Try to apply current slot
    let hasApplied = false;
    for (const slotResult of slot.apply(morpher, word)) {
      hasApplied = true;
      // Recursively apply remaining slots
      yield* this._applySlots(morpher, slotResult, slotIndex + 1);
    }

    // If slot couldn't apply and is not optional, fail
    if (!hasApplied && !slot.optional) {
      return;
    }

    // If slot is optional and didn't apply, skip to next slot
    if (!hasApplied && slot.optional) {
      yield* this._applySlots(morpher, word, slotIndex + 1);
    }
  }

  toString(): string {
    const slotStr = this._slots.map(s => s.toString()).join(' + ');
    return `${this._name}: ${slotStr}`;
  }
}
