import { CharacterDefinitionTable } from './CharacterDefinitionTable';
import { LexEntry } from '../morphology/LexEntry';

/**
 * Morphological rule ordering.
 */
export enum MorphologicalRuleOrder {
  Linear = 'linear',
  Unordered = 'unordered',
}

/**
 * Represents a linguistic stratum with its character definitions, rules, and lexicon.
 * A stratum is a layer in the morphophonological system.
 */
export class Stratum {
  private _charDefTable: CharacterDefinitionTable;
  private _morphologicalRules: any[]; // IMorphologicalRule[]
  private _phonologicalRules: any[]; // IPhonologicalRule[]
  private _affixTemplates: any[]; // AffixTemplate[]
  private _entries: LexEntry[];
  private _depth: number;
  private _morphologicalRuleOrder: MorphologicalRuleOrder;
  private _name: string;

  /**
   * Creates a new Stratum.
   * @param charDefTable - The character definition table
   */
  constructor(charDefTable: CharacterDefinitionTable) {
    this._charDefTable = charDefTable;
    this._morphologicalRules = [];
    this._phonologicalRules = [];
    this._affixTemplates = [];
    this._entries = [];
    this._depth = -1;
    this._morphologicalRuleOrder = MorphologicalRuleOrder.Linear;
    this._name = '';
  }

  /**
   * Gets the character definition table.
   */
  get characterDefinitionTable(): CharacterDefinitionTable {
    return this._charDefTable;
  }

  /**
   * Gets the morphological rules.
   */
  get morphologicalRules(): any[] {
    return this._morphologicalRules;
  }

  /**
   * Adds a morphological rule.
   */
  addMorphologicalRule(rule: any): void {
    rule.stratum = this;
    this._morphologicalRules.push(rule);
  }

  /**
   * Removes a morphological rule.
   */
  removeMorphologicalRule(rule: any): boolean {
    const index = this._morphologicalRules.indexOf(rule);
    if (index === -1) return false;

    this._morphologicalRules.splice(index, 1);
    rule.stratum = null;
    return true;
  }

  /**
   * Gets the phonological rules.
   */
  get phonologicalRules(): any[] {
    return this._phonologicalRules;
  }

  /**
   * Adds a phonological rule.
   */
  addPhonologicalRule(rule: any): void {
    this._phonologicalRules.push(rule);
  }

  /**
   * Removes a phonological rule.
   */
  removePhonologicalRule(rule: any): boolean {
    const index = this._phonologicalRules.indexOf(rule);
    if (index === -1) return false;

    this._phonologicalRules.splice(index, 1);
    return true;
  }

  /**
   * Gets the affix templates.
   */
  get affixTemplates(): any[] {
    return this._affixTemplates;
  }

  /**
   * Adds an affix template.
   */
  addAffixTemplate(template: any): void {
    template.stratum = this;
    this._affixTemplates.push(template);
  }

  /**
   * Removes an affix template.
   */
  removeAffixTemplate(template: any): boolean {
    const index = this._affixTemplates.indexOf(template);
    if (index === -1) return false;

    this._affixTemplates.splice(index, 1);
    template.stratum = null;
    return true;
  }

  /**
   * Gets the lexical entries.
   */
  get entries(): LexEntry[] {
    return this._entries;
  }

  /**
   * Adds a lexical entry.
   */
  addEntry(entry: LexEntry): void {
    entry.stratum = this;
    this._entries.push(entry);
  }

  /**
   * Removes a lexical entry.
   */
  removeEntry(entry: LexEntry): boolean {
    const index = this._entries.indexOf(entry);
    if (index === -1) return false;

    this._entries.splice(index, 1);
    entry.stratum = null;
    return true;
  }

  /**
   * Gets the depth of this stratum in the system.
   */
  get depth(): number {
    return this._depth;
  }

  /**
   * Sets the depth (internal use).
   */
  set depth(value: number) {
    this._depth = value;
  }

  /**
   * Gets the morphological rule order.
   */
  get morphologicalRuleOrder(): MorphologicalRuleOrder {
    return this._morphologicalRuleOrder;
  }

  /**
   * Sets the morphological rule order.
   */
  set morphologicalRuleOrder(value: MorphologicalRuleOrder) {
    this._morphologicalRuleOrder = value;
  }

  /**
   * Gets the name of this stratum.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Sets the name of this stratum.
   */
  set name(value: string) {
    this._name = value;
  }

  /**
   * Compiles an analysis rule for this stratum.
   * @param morpher - The morpher
   * @returns The compiled analysis rule
   */
  compileAnalysisRule(morpher: any): any {
    // TODO: Return AnalysisStratumRule
    throw new Error('Not yet implemented');
  }

  /**
   * Compiles a synthesis rule for this stratum.
   * @param morpher - The morpher
   * @returns The compiled synthesis rule
   */
  compileSynthesisRule(morpher: any): any {
    // TODO: Return SynthesisStratumRule
    throw new Error('Not yet implemented');
  }

  /**
   * Converts to string.
   */
  toString(): string {
    return this._name || `Stratum[depth=${this._depth}]`;
  }
}
