import { Shape } from '../annotations/Shape';
import { ShapeNode } from '../annotations/ShapeNode';
import { Annotation } from '../annotations/Annotation';
import { AnnotationList } from '../annotations/AnnotationList';
import { Range } from '../utils/Range';
import { Freezable } from '../utils/Freezable';
import { FeatureStruct } from '../features/FeatureStruct';
import { Feature } from '../features/Feature';
import { MprFeatureSet } from './MprFeature';
import { RootAllomorph } from './RootAllomorph';
import { Allomorph } from './Allomorph';
import { Morpheme } from './Morpheme';
import { LexEntry } from './LexEntry';
import { HCFeatureSystem } from '../core/HCFeatureSystem';
import { StringFeatureValue } from '../features/FeatureValue';

/**
 * Represents a word during morphological analysis or synthesis.
 * Tracks the phonological shape, applied morphemes, and feature structures.
 */
export class Word extends Freezable {
  static readonly ROOT_MORPH_ID = 'ROOT';

  private _allomorphs: Map<string, Allomorph>;
  private _rootAllomorph: RootAllomorph | null;
  private _shape: Shape;
  private _mruleApps: any[]; // IMorphologicalRule[]
  private _mruleAppIndex: number;
  private _mrulesUnapplied: Map<any, number>;
  private _mrulesApplied: Map<any, number>;
  private _nonHeadApps: Word[];
  private _nonHeadAppIndex: number;
  private _mprFeatures: MprFeatureSet;
  private _obligatorySyntacticFeatures: Set<Feature>;
  private _syntacticFeatureStruct: FeatureStruct;
  private _realizationalFS: FeatureStruct;
  private _stratum: any | null; // Stratum
  private _isLastAppliedRuleFinal: boolean | null;
  private _isPartial: boolean;
  private _disjunctiveAllomorphIndices: Map<string, Set<number>>;
  private _mruleAppCount: number;
  private _alternatives: Word[];
  private _source: Word | null;
  private _currentTrace: any;

  /**
   * Creates a Word from a root allomorph and realizational features.
   */
  constructor(rootAllomorphOrStratum: RootAllomorph | any, realizationalFSOrShape?: FeatureStruct | Shape) {
    super();

    this._allomorphs = new Map();
    this._mprFeatures = new MprFeatureSet();
    this._mruleApps = [];
    this._mruleAppIndex = -1;
    this._mrulesUnapplied = new Map();
    this._mrulesApplied = new Map();
    this._nonHeadApps = [];
    this._nonHeadAppIndex = -1;
    this._obligatorySyntacticFeatures = new Set();
    this._isLastAppliedRuleFinal = null;
    this._disjunctiveAllomorphIndices = new Map();
    this._mruleAppCount = 0;
    this._alternatives = [];
    this._source = null;
    this._currentTrace = null;
    this._rootAllomorph = null;
    this._stratum = null;
    this._isPartial = false;

    // Handle different constructor overloads
    if (rootAllomorphOrStratum instanceof RootAllomorph) {
      // Word(RootAllomorph, FeatureStruct)
      const rootAllomorph = rootAllomorphOrStratum;
      const realizationalFS = realizationalFSOrShape as FeatureStruct;

      this._shape = rootAllomorph.segments.shape.clone();
      this.resetDirty();
      this.setRootAllomorph(rootAllomorph);
      this._realizationalFS = realizationalFS;
      this._syntacticFeatureStruct = new FeatureStruct();
    } else {
      // Word(Stratum, Shape)
      const stratum = rootAllomorphOrStratum;
      const shape = realizationalFSOrShape as Shape;

      this._stratum = stratum;
      this._shape = shape;
      this.resetDirty();
      this._syntacticFeatureStruct = new FeatureStruct();
      this._realizationalFS = new FeatureStruct();
      this._isPartial = false;
    }
  }

  /**
   * Copy constructor.
   */
  static clone(word: Word): Word {
    const cloned = Object.create(Word.prototype);

    cloned._allomorphs = new Map(word._allomorphs);
    cloned._stratum = word._stratum;
    cloned._source = word;
    cloned._shape = word._shape.clone();
    cloned._rootAllomorph = word._rootAllomorph;
    cloned._syntacticFeatureStruct = word._syntacticFeatureStruct.clone();
    cloned._realizationalFS = word._realizationalFS.clone();
    cloned._mprFeatures = word._mprFeatures.clone();
    cloned._mruleApps = [...word._mruleApps];
    cloned._mruleAppIndex = word._mruleAppIndex;
    cloned._mrulesUnapplied = new Map(word._mrulesUnapplied);
    cloned._mrulesApplied = new Map(word._mrulesApplied);
    cloned._nonHeadApps = word._nonHeadApps.map(w => Word.clone(w));
    cloned._nonHeadAppIndex = word._nonHeadAppIndex;
    cloned._obligatorySyntacticFeatures = new Set(word._obligatorySyntacticFeatures);
    cloned._isLastAppliedRuleFinal = word._isLastAppliedRuleFinal;
    cloned._isPartial = word._isPartial;
    cloned._currentTrace = word._currentTrace;
    cloned._disjunctiveAllomorphIndices = new Map();
    for (const [key, value] of word._disjunctiveAllomorphIndices) {
      cloned._disjunctiveAllomorphIndices.set(key, new Set(value));
    }
    cloned._mruleAppCount = word._mruleAppCount;
    cloned._alternatives = [];

    return cloned;
  }

  /**
   * Gets all morph annotations.
   */
  get morphs(): Annotation<ShapeNode>[] {
    const morphs: Annotation<ShapeNode>[] = [];

    for (const ann of this._shape.annotations) {
      this.postorderTraverse(ann, (a) => {
        const type = a.featureStruct.getValue(HCFeatureSystem.Type);
        if (type === HCFeatureSystem.Morph) {
          morphs.push(a);
        }
      });
    }

    return morphs;
  }

  /**
   * Post-order traversal of annotation tree.
   */
  private postorderTraverse(ann: Annotation<ShapeNode>, action: (a: Annotation<ShapeNode>) => void): void {
    if (!ann.isLeaf) {
      for (const child of ann.children) {
        this.postorderTraverse(child, action);
      }
    }
    action(ann);
  }

  /**
   * Gets allomorphs in morphological order.
   */
  get allomorphsInMorphOrder(): Allomorph[] {
    const seen = new Set<Allomorph>();
    const result: Allomorph[] = [];

    for (const morph of this.morphs) {
      const allomorph = this.getAllomorph(morph);
      if (allomorph && !seen.has(allomorph)) {
        seen.add(allomorph);
        result.push(allomorph);
      }
    }

    return result;
  }

  /**
   * Gets all allomorphs.
   */
  get allomorphs(): Allomorph[] {
    return Array.from(this._allomorphs.values());
  }

  /**
   * Gets the root allomorph.
   */
  get rootAllomorph(): RootAllomorph | null {
    return this._rootAllomorph;
  }

  /**
   * Sets the root allomorph.
   */
  set rootAllomorph(value: RootAllomorph) {
    this.checkFrozen();
    this._shape = value.segments.shape.clone();
    this.setRootAllomorph(value);
  }

  /**
   * Sets the root allomorph (internal).
   */
  private setRootAllomorph(rootAllomorph: RootAllomorph): void {
    this._rootAllomorph = rootAllomorph;
    const entry = rootAllomorph.morpheme as LexEntry;
    this._stratum = entry.stratum;
    this.markMorph(Array.from(this._shape), rootAllomorph, Word.ROOT_MORPH_ID);
    this._syntacticFeatureStruct = entry.syntacticFeatureStruct.clone();
    this._mprFeatures.clear();
    for (const feat of entry.mprFeatures) {
      this._mprFeatures.add(feat);
    }
    this._isPartial = entry.isPartial;
  }

  /**
   * Gets the phonological shape.
   */
  get shape(): Shape {
    return this._shape;
  }

  /**
   * Gets the syntactic feature structure.
   */
  get syntacticFeatureStruct(): FeatureStruct {
    return this._syntacticFeatureStruct;
  }

  /**
   * Sets the syntactic feature structure.
   */
  set syntacticFeatureStruct(value: FeatureStruct) {
    this._syntacticFeatureStruct = value;
  }

  /**
   * Gets the realizational feature structure.
   */
  get realizationalFeatureStruct(): FeatureStruct {
    return this._realizationalFS;
  }

  /**
   * Sets the realizational feature structure.
   */
  set realizationalFeatureStruct(value: FeatureStruct) {
    this.checkFrozen();
    this._realizationalFS = value;
  }

  /**
   * Gets the MPR features.
   */
  get mprFeatures(): MprFeatureSet {
    return this._mprFeatures;
  }

  /**
   * Gets obligatory syntactic features.
   */
  get obligatorySyntacticFeatures(): Set<Feature> {
    return this._obligatorySyntacticFeatures;
  }

  /**
   * Gets the range.
   */
  get range(): Range<ShapeNode> {
    return this._shape.range;
  }

  /**
   * Gets the annotations.
   */
  get annotations(): AnnotationList<ShapeNode> {
    return this._shape.annotations;
  }

  /**
   * Gets the stratum.
   */
  get stratum(): any {
    return this._stratum;
  }

  /**
   * Sets the stratum.
   */
  set stratum(value: any) {
    this.checkFrozen();
    this._stratum = value;
  }

  /**
   * Gets whether this word is partial.
   */
  get isPartial(): boolean {
    return this._isPartial;
  }

  /**
   * Sets whether this word is partial.
   */
  set isPartial(value: boolean) {
    this.checkFrozen();
    this._isPartial = value;
  }

  /**
   * Gets the current trace.
   */
  get currentTrace(): any {
    return this._currentTrace;
  }

  /**
   * Sets the current trace.
   */
  set currentTrace(value: any) {
    this._currentTrace = value;
  }

  /**
   * Gets the source word (for cloned words).
   */
  get source(): Word | null {
    return this._source;
  }

  /**
   * Gets morphemes in application order.
   */
  get morphemesInApplicationOrder(): Morpheme[] {
    const result: Morpheme[] = [];

    if (this._rootAllomorph) {
      result.push(this._rootAllomorph.morpheme!);
    }

    // Add morphemes from rule applications in reverse order
    let j = this._nonHeadApps.length - 1;
    for (let i = this._mruleApps.length - 1; i >= 0; i--) {
      const rule = this._mruleApps[i];
      if (rule === null || rule.constructor.name === 'CompoundingRule') {
        if (j >= 0) {
          result.push(this._nonHeadApps[j--].rootAllomorph!.morpheme!);
        }
      } else {
        result.push(rule as any); // MorphemicMorphologicalRule
      }
    }

    return result;
  }

  /**
   * Marks a morph annotation.
   */
  markMorph(nodes: ShapeNode[], allomorph: Allomorph, morphID: string): Annotation<ShapeNode> | null {
    if (nodes.length === 0) {
      return null;
    }

    const fs = new FeatureStruct();
    fs.addValue(HCFeatureSystem.Type, HCFeatureSystem.Morph);
    fs.addValue(HCFeatureSystem.Allomorph, new StringFeatureValue([allomorph.ID]));
    fs.addValue(HCFeatureSystem.MorphID, new StringFeatureValue([morphID]));

    const ann = new Annotation(
      Range.create(nodes[0], nodes[nodes.length - 1]),
      fs
    );

    for (const node of nodes) {
      ann.children.add(node.annotation, false);
    }

    this._shape.annotations.add(ann, false);
    this._allomorphs.set(allomorph.ID, allomorph);

    return ann;
  }

  /**
   * Gets the allomorph for a morph annotation.
   */
  getAllomorph(morph: Annotation<ShapeNode>): Allomorph | null {
    const allomorphValue = morph.featureStruct.getValue(HCFeatureSystem.Allomorph) as StringFeatureValue;
    if (allomorphValue && allomorphValue.values.size > 0) {
      const allomorphID = Array.from(allomorphValue.values)[0];
      return this._allomorphs.get(allomorphID) || null;
    }
    return null;
  }

  /**
   * Gets morphs for a specific allomorph.
   */
  getMorphs(allomorph: Allomorph): Annotation<ShapeNode>[] {
    return this.morphs.filter(morph => this.getAllomorph(morph) === allomorph);
  }

  /**
   * Gets disjunctive allomorph applications for a morph.
   */
  getDisjunctiveAllomorphApplications(morph: Annotation<ShapeNode>): number[] | null {
    const morphIDValue = morph.featureStruct.getValue(HCFeatureSystem.MorphID) as StringFeatureValue;
    if (morphIDValue && morphIDValue.values.size > 0) {
      const morphID = Array.from(morphIDValue.values)[0];
      const indices = this._disjunctiveAllomorphIndices.get(morphID);
      return indices ? Array.from(indices) : null;
    }
    return null;
  }

  /**
   * Resets dirty flags on shape nodes.
   */
  private resetDirty(): void {
    // Mark all nodes as clean
    for (const node of this._shape) {
      node.annotation.featureStruct.addValue(HCFeatureSystem.Modified, HCFeatureSystem.Clean);
    }
  }

  /**
   * Clones this word.
   */
  clone(): Word {
    return Word.clone(this);
  }

  /**
   * Converts to string.
   */
  toString(): string {
    // Convert shape to string representation
    const segments: string[] = [];
    for (const node of this._shape) {
      // Get string representation from character definition table
      const strRepValue = node.annotation.featureStruct.getValue(HCFeatureSystem.StrRep) as StringFeatureValue;
      if (strRepValue && strRepValue.values.size > 0) {
        segments.push(Array.from(strRepValue.values)[0]);
      }
    }
    return segments.join('');
  }
}
