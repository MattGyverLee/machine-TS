import { Stratum } from './Stratum';
import { CharacterDefinitionTable } from './CharacterDefinitionTable';
import { NaturalClass } from './NaturalClass';
import { FeatureSystem } from '../features/FeatureSystem';
import { StemName } from '../morphology/StemName';
import { MprFeature, MprFeatureGroup } from '../morphology/MprFeature';
import { LexFamily } from '../morphology/LexFamily';
import { Morpheme } from '../morphology/Morpheme';
import { Allomorph } from '../morphology/Allomorph';

/**
 * Represents all linguistic information required to parse words in a language.
 * Encapsulates feature systems, rules, character definitions, and lexicon.
 */
export class Language {
  private _strata: Stratum[];
  private _phonologicalFeatureSystem: FeatureSystem;
  private _syntacticFeatureSystem: FeatureSystem;
  private _naturalClasses: NaturalClass[];
  private _stemNames: StemName[];
  private _mprFeatures: MprFeature[];
  private _mprFeatureGroups: MprFeatureGroup[];
  private _characterDefinitionTables: CharacterDefinitionTable[];
  private _families: LexFamily[];
  private _phonologicalRules: any[]; // IPhonologicalRule[]
  private _morphemeCoOccurrenceRules: Array<{ morpheme: Morpheme; rule: any }>;
  private _allomorphCoOccurrenceRules: Array<{ allomorph: Allomorph; rule: any }>;
  private _name: string;

  /**
   * Creates a new Language.
   */
  constructor() {
    this._strata = [];
    this._phonologicalFeatureSystem = new FeatureSystem();
    this._syntacticFeatureSystem = new FeatureSystem();
    this._naturalClasses = [];
    this._stemNames = [];
    this._mprFeatures = [];
    this._mprFeatureGroups = [];
    this._characterDefinitionTables = [];
    this._families = [];
    this._phonologicalRules = [];
    this._morphemeCoOccurrenceRules = [];
    this._allomorphCoOccurrenceRules = [];
    this._name = '';
  }

  /**
   * Gets the name of this language.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Sets the name of this language.
   */
  set name(value: string) {
    this._name = value;
  }

  /**
   * Gets the surface stratum (last stratum).
   */
  get surfaceStratum(): Stratum | null {
    if (this._strata.length === 0) {
      return null;
    }
    return this._strata[this._strata.length - 1];
  }

  /**
   * Gets the phonological feature system.
   */
  get phonologicalFeatureSystem(): FeatureSystem {
    return this._phonologicalFeatureSystem;
  }

  /**
   * Sets the phonological feature system.
   */
  set phonologicalFeatureSystem(value: FeatureSystem) {
    this._phonologicalFeatureSystem = value;
  }

  /**
   * Gets the syntactic feature system.
   */
  get syntacticFeatureSystem(): FeatureSystem {
    return this._syntacticFeatureSystem;
  }

  /**
   * Sets the syntactic feature system.
   */
  set syntacticFeatureSystem(value: FeatureSystem) {
    this._syntacticFeatureSystem = value;
  }

  /**
   * Gets all strata.
   */
  get strata(): Stratum[] {
    return this._strata;
  }

  /**
   * Adds a stratum.
   */
  addStratum(stratum: Stratum): void {
    this._strata.push(stratum);
    this._updateStrataDepths();
  }

  /**
   * Removes a stratum.
   */
  removeStratum(stratum: Stratum): boolean {
    const index = this._strata.indexOf(stratum);
    if (index === -1) return false;

    this._strata.splice(index, 1);
    stratum.depth = -1;
    this._updateStrataDepths();
    return true;
  }

  /**
   * Updates stratum depths after changes.
   */
  private _updateStrataDepths(): void {
    for (let i = 0; i < this._strata.length; i++) {
      this._strata[i].depth = i;
    }
  }

  /**
   * Gets natural classes.
   */
  get naturalClasses(): NaturalClass[] {
    return this._naturalClasses;
  }

  /**
   * Adds a natural class.
   */
  addNaturalClass(naturalClass: NaturalClass): void {
    this._naturalClasses.push(naturalClass);
  }

  /**
   * Gets stem names.
   */
  get stemNames(): StemName[] {
    return this._stemNames;
  }

  /**
   * Adds a stem name.
   */
  addStemName(stemName: StemName): void {
    this._stemNames.push(stemName);
  }

  /**
   * Gets MPR features.
   */
  get mprFeatures(): MprFeature[] {
    return this._mprFeatures;
  }

  /**
   * Adds an MPR feature.
   */
  addMprFeature(feature: MprFeature): void {
    this._mprFeatures.push(feature);
  }

  /**
   * Gets MPR feature groups.
   */
  get mprFeatureGroups(): MprFeatureGroup[] {
    return this._mprFeatureGroups;
  }

  /**
   * Adds an MPR feature group.
   */
  addMprFeatureGroup(group: MprFeatureGroup): void {
    this._mprFeatureGroups.push(group);
  }

  /**
   * Gets character definition tables.
   */
  get characterDefinitionTables(): CharacterDefinitionTable[] {
    return this._characterDefinitionTables;
  }

  /**
   * Adds a character definition table.
   */
  addCharacterDefinitionTable(table: CharacterDefinitionTable): void {
    this._characterDefinitionTables.push(table);
  }

  /**
   * Gets lexical families.
   */
  get families(): LexFamily[] {
    return this._families;
  }

  /**
   * Adds a lexical family.
   */
  addFamily(family: LexFamily): void {
    this._families.push(family);
  }

  /**
   * Gets phonological rules.
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
   * Gets morpheme co-occurrence rules.
   */
  get morphemeCoOccurrenceRules(): Array<{ morpheme: Morpheme; rule: any }> {
    return this._morphemeCoOccurrenceRules;
  }

  /**
   * Adds a morpheme co-occurrence rule.
   */
  addMorphemeCoOccurrenceRule(morpheme: Morpheme, rule: any): void {
    this._morphemeCoOccurrenceRules.push({ morpheme, rule });
  }

  /**
   * Gets allomorph co-occurrence rules.
   */
  get allomorphCoOccurrenceRules(): Array<{ allomorph: Allomorph; rule: any }> {
    return this._allomorphCoOccurrenceRules;
  }

  /**
   * Adds an allomorph co-occurrence rule.
   */
  addAllomorphCoOccurrenceRule(allomorph: Allomorph, rule: any): void {
    this._allomorphCoOccurrenceRules.push({ allomorph, rule });
  }

  /**
   * Compiles an analysis rule for the entire language.
   * @param morpher - The morpher
   * @returns The compiled analysis rule
   */
  compileAnalysisRule(morpher: any): any {
    // TODO: Return AnalysisLanguageRule
    throw new Error('Not yet implemented');
  }

  /**
   * Compiles a synthesis rule for the entire language.
   * @param morpher - The morpher
   * @returns The compiled synthesis rule
   */
  compileSynthesisRule(morpher: any): any {
    // TODO: Return PipelineRuleCascade with all strata
    throw new Error('Not yet implemented');
  }

  /**
   * Converts to string.
   */
  toString(): string {
    return this._name || `Language[${this._strata.length} strata]`;
  }
}
