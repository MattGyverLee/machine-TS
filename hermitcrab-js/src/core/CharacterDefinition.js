import { FeatureStruct } from '../features/FeatureStruct.js';
import { HCFeatureSystem } from './HCFeatureSystem.js';

/**
 * Represents a character/segment definition with string representations and features.
 */
export class CharacterDefinition {
  /**
   * Creates a new CharacterDefinition.
   * @param {Array<string>} representations - String representations
   * @param {FeatureStruct} fs - Feature structure
   */
  constructor(representations, fs) {
    this._representations = Object.freeze([...representations]);
    this._featureStruct = fs;
    this._characterDefinitionTable = null;
  }

  /**
   * Gets the character definition table this belongs to.
   * @returns {CharacterDefinitionTable|null}
   */
  get characterDefinitionTable() {
    return this._characterDefinitionTable;
  }

  /**
   * Sets the character definition table (internal use).
   * @param {CharacterDefinitionTable} value
   */
  set characterDefinitionTable(value) {
    this._characterDefinitionTable = value;
  }

  /**
   * Gets the type of this character (Segment, Boundary, etc.).
   * @returns {FeatureSymbol}
   */
  get type() {
    return this._featureStruct.getValue(HCFeatureSystem.Type);
  }

  /**
   * Gets the string representations.
   * @returns {ReadonlyArray<string>}
   */
  get representations() {
    return this._representations;
  }

  /**
   * Gets the feature structure.
   * @returns {FeatureStruct}
   */
  get featureStruct() {
    return this._featureStruct;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._representations[0] || super.toString();
  }
}
