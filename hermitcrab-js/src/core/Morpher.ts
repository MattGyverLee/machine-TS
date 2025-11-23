import { Language } from './Language';
import { Word } from '../morphology/Word';
import { LexEntry } from '../morphology/LexEntry';
import { Stratum } from './Stratum';
import { CharacterDefinitionTable } from './CharacterDefinitionTable';
import { FeatureStruct } from '../features/FeatureStruct';
import { Shape } from '../annotations/Shape';

/**
 * Analysis result for a parsed word.
 */
export class AnalysisResult {
  private _word: Word;
  private _morphemes: string[];
  private _gloss: string;

  constructor(word: Word, morphemes: string[], gloss: string = '') {
    this._word = word;
    this._morphemes = morphemes;
    this._gloss = gloss;
  }

  /**
   * Gets the analyzed word.
   */
  get word(): Word {
    return this._word;
  }

  /**
   * Gets the morpheme breakdown.
   */
  get morphemes(): string[] {
    return this._morphemes;
  }

  /**
   * Gets the gloss.
   */
  get gloss(): string {
    return this._gloss;
  }

  toString(): string {
    return `${this._morphemes.join('-')} (${this._gloss || 'no gloss'})`;
  }
}

/**
 * Morpher performs morphological analysis and synthesis.
 * This is the main engine that uses a Language definition to parse
 * and generate words.
 */
export class Morpher {
  private _language: Language;
  private _traceManager: any | null; // TraceManager type
  private _maxAnalysesPerWord: number;
  private _maxSynthesesPerEntry: number;

  /**
   * Creates a new morpher.
   * @param language - The language definition to use
   */
  constructor(language: Language) {
    this._language = language;
    this._traceManager = null;
    this._maxAnalysesPerWord = 100;
    this._maxSynthesesPerEntry = 100;
  }

  /**
   * Gets the language.
   */
  get language(): Language {
    return this._language;
  }

  /**
   * Gets the trace manager.
   */
  get traceManager(): any | null {
    return this._traceManager;
  }

  /**
   * Sets the trace manager.
   */
  set traceManager(value: any | null) {
    this._traceManager = value;
  }

  /**
   * Gets the maximum number of analyses per word.
   */
  get maxAnalysesPerWord(): number {
    return this._maxAnalysesPerWord;
  }

  /**
   * Sets the maximum number of analyses per word.
   */
  set maxAnalysesPerWord(value: number) {
    this._maxAnalysesPerWord = value;
  }

  /**
   * Gets the maximum number of syntheses per entry.
   */
  get maxSynthesesPerEntry(): number {
    return this._maxSynthesesPerEntry;
  }

  /**
   * Sets the maximum number of syntheses per entry.
   */
  set maxSynthesesPerEntry(value: number) {
    this._maxSynthesesPerEntry = value;
  }

  /**
   * Parses a word string into morphological analyses.
   * @param wordStr - The word to analyze
   * @returns An iterator of possible analyses
   */
  *parseWord(wordStr: string): IterableIterator<AnalysisResult> {
    // Get the surface stratum
    const surfaceStratum = this._language.surfaceStratum;
    if (!surfaceStratum) {
      throw new Error('Language has no surface stratum');
    }

    // Parse the string into a shape using the character definition table
    const charTable = surfaceStratum.characterDefinitionTable;
    if (!charTable) {
      throw new Error('Surface stratum has no character definition table');
    }

    const parseResult = charTable.getShapeNodes(wordStr, false);
    if (!parseResult.success || !parseResult.nodes) {
      return; // Could not parse the word
    }

    // Create initial word with the parsed shape
    const initialWord = new Word();
    const shape = new Shape();
    for (const node of parseResult.nodes) {
      shape.add(node);
    }
    initialWord.shape = shape;

    // Perform analysis through strata (bottom-up)
    let count = 0;
    for (const analysis of this._analyzeWord(initialWord)) {
      if (count >= this._maxAnalysesPerWord) break;

      // Extract morpheme information
      const morphemes = this._extractMorphemes(analysis);
      const gloss = this._extractGloss(analysis);

      yield new AnalysisResult(analysis, morphemes, gloss);
      count++;
    }
  }

  /**
   * Analyzes a word through all strata.
   */
  private *_analyzeWord(word: Word): IterableIterator<Word> {
    // For now, this is a placeholder that would implement
    // multi-stratal analysis using the compiled analysis rules
    // In full implementation, this would:
    // 1. Start from surface stratum
    // 2. Apply phonological rules in reverse
    // 3. Try to match lexical entries
    // 4. Build up morphological structure

    yield word; // Placeholder
  }

  /**
   * Generates word forms from a lexical entry.
   * @param entry - The lexical entry to generate from
   * @param features - Optional syntactic features to apply
   * @returns An iterator of generated word forms
   */
  *generateWord(entry: LexEntry, features: FeatureStruct | null = null): IterableIterator<Word> {
    // Get the base stratum (first stratum with lexicon)
    const baseStratum = this._findLexiconStratum(entry);
    if (!baseStratum) {
      throw new Error('Could not find stratum for entry');
    }

    // Create initial word from entry
    let count = 0;
    for (const word of this._createInitialWords(entry, features)) {
      // Apply morphological and phonological rules through strata
      for (const synthesized of this._synthesizeWord(word, baseStratum)) {
        if (count >= this._maxSynthesesPerEntry) return;
        yield synthesized;
        count++;
      }
    }
  }

  /**
   * Finds the stratum that contains a lexical entry.
   */
  private _findLexiconStratum(entry: LexEntry): Stratum | null {
    for (const stratum of this._language.strata) {
      if (stratum.entries.includes(entry)) {
        return stratum;
      }
    }
    return null;
  }

  /**
   * Creates initial words from a lexical entry.
   */
  private *_createInitialWords(entry: LexEntry, features: FeatureStruct | null): IterableIterator<Word> {
    // Try each allomorph
    for (const allomorph of entry.allomorphs) {
      const word = new Word();

      // Set up the shape from the allomorph
      const nodes = allomorph.getShapeNodes();
      if (!nodes) continue;

      const shape = new Shape();
      for (const node of nodes) {
        shape.add(node.clone());
      }
      word.shape = shape;

      // Set up features
      word.syntacticFeatureStruct = entry.syntacticFeatureStruct?.clone() || new FeatureStruct();
      if (features) {
        const unified = word.syntacticFeatureStruct.unify(features);
        if (!unified) continue; // Features don't unify
        word.syntacticFeatureStruct = unified;
      }

      word.mprFeatures.addAll(entry.mprFeatures);

      // Mark the root morph
      word.markMorph(nodes, allomorph, 'root');

      yield word;
    }
  }

  /**
   * Synthesizes a word through strata.
   */
  private *_synthesizeWord(word: Word, startStratum: Stratum): IterableIterator<Word> {
    // For now, this is a placeholder that would implement
    // multi-stratal synthesis using the compiled synthesis rules
    // In full implementation, this would:
    // 1. Start from base stratum
    // 2. Apply morphological rules (affixation, compounding, templates)
    // 3. Apply phonological rules
    // 4. Move up through strata to surface form

    yield word; // Placeholder
  }

  /**
   * Extracts morpheme labels from a word.
   */
  private _extractMorphemes(word: Word): string[] {
    const morphemes: string[] = [];

    // This would examine the word's morph annotations
    // and extract morpheme identifiers
    // Placeholder implementation
    morphemes.push('?');

    return morphemes;
  }

  /**
   * Extracts gloss from a word.
   */
  private _extractGloss(word: Word): string {
    // This would build a gloss from the morpheme annotations
    // Placeholder implementation
    return '';
  }

  /**
   * Renders a word to its surface string form.
   * @param word - The word to render
   * @returns The surface string
   */
  renderWord(word: Word): string {
    const surfaceStratum = this._language.surfaceStratum;
    if (!surfaceStratum?.characterDefinitionTable) {
      throw new Error('No character definition table available');
    }

    return surfaceStratum.characterDefinitionTable.shapeToString(word.shape);
  }
}
