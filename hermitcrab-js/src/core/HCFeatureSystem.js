import { FeatureSystem } from '../features/FeatureSystem.js';
import { SymbolicFeature, StringFeature, FeatureSymbol } from '../features/Feature.js';
import { SymbolicFeatureValue } from '../features/FeatureValue.js';
import { FeatureStruct } from '../features/FeatureStruct.js';

/**
 * HermitCrab feature system with predefined features and symbols.
 */
export class HCFeatureSystem extends FeatureSystem {
  // Feature symbols
  static Anchor = new FeatureSymbol('anchor');
  static Segment = new FeatureSymbol('segment');
  static Boundary = new FeatureSymbol('boundary');
  static Morph = new FeatureSymbol('morph');

  static Dirty = new FeatureSymbol('dirty');
  static Clean = new FeatureSymbol('clean');

  static Deleted = new FeatureSymbol('deleted');
  static NotDeleted = new FeatureSymbol('notDeleted');

  static LeftSide = new FeatureSymbol('leftSide');
  static RightSide = new FeatureSymbol('rightSide');

  // Features
  static Type = new SymbolicFeature(
    'type',
    HCFeatureSystem.Anchor,
    HCFeatureSystem.Segment,
    HCFeatureSystem.Boundary,
    HCFeatureSystem.Morph
  );

  static Modified = (() => {
    const feature = new SymbolicFeature('modified', HCFeatureSystem.Dirty, HCFeatureSystem.Clean);
    feature.defaultValue = new SymbolicFeatureValue(HCFeatureSystem.Clean);
    return feature;
  })();

  static Deletion = (() => {
    const feature = new SymbolicFeature(
      'deletion',
      HCFeatureSystem.Deleted,
      HCFeatureSystem.NotDeleted
    );
    feature.defaultValue = new SymbolicFeatureValue(HCFeatureSystem.NotDeleted);
    return feature;
  })();

  static AnchorType = new SymbolicFeature(
    'anchorType',
    HCFeatureSystem.LeftSide,
    HCFeatureSystem.RightSide
  );

  static StrRep = new StringFeature('strRep');
  static Allomorph = new StringFeature('allomorph');
  static MorphID = new StringFeature('morphID');

  // Predefined feature structures
  static LeftSideAnchor = (() => {
    const fs = new FeatureStruct();
    fs.addSymbols(HCFeatureSystem.Type, HCFeatureSystem.Anchor);
    fs.addSymbols(HCFeatureSystem.AnchorType, HCFeatureSystem.LeftSide);
    fs.freeze();
    return fs;
  })();

  static RightSideAnchor = (() => {
    const fs = new FeatureStruct();
    fs.addSymbols(HCFeatureSystem.Type, HCFeatureSystem.Anchor);
    fs.addSymbols(HCFeatureSystem.AnchorType, HCFeatureSystem.RightSide);
    fs.freeze();
    return fs;
  })();

  // Singleton instance
  static Instance = (() => {
    const instance = new HCFeatureSystem();
    instance.addFeature(HCFeatureSystem.Type);
    instance.addFeature(HCFeatureSystem.Modified);
    instance.addFeature(HCFeatureSystem.Deletion);
    instance.addFeature(HCFeatureSystem.AnchorType);
    instance.addFeature(HCFeatureSystem.StrRep);
    instance.addFeature(HCFeatureSystem.Allomorph);
    instance.addFeature(HCFeatureSystem.MorphID);

    // Add all symbols
    instance.addSymbol(HCFeatureSystem.Anchor);
    instance.addSymbol(HCFeatureSystem.Segment);
    instance.addSymbol(HCFeatureSystem.Boundary);
    instance.addSymbol(HCFeatureSystem.Morph);
    instance.addSymbol(HCFeatureSystem.Dirty);
    instance.addSymbol(HCFeatureSystem.Clean);
    instance.addSymbol(HCFeatureSystem.Deleted);
    instance.addSymbol(HCFeatureSystem.NotDeleted);
    instance.addSymbol(HCFeatureSystem.LeftSide);
    instance.addSymbol(HCFeatureSystem.RightSide);

    instance.freeze();
    return instance;
  })();

  constructor() {
    super();
  }
}
