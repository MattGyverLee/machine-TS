import { Shape } from '../annotations/Shape.js';

/**
 * Represents phonological segments with a string representation and shape.
 */
export class Segments {
  /**
   * Creates new Segments.
   * @param {CharacterDefinitionTable} table - The character definition table
   * @param {string} representation - String representation
   * @param {Shape|boolean} [shapeOrAllowPattern] - Shape or allow pattern flag
   */
  constructor(table, representation, shapeOrAllowPattern = null) {
    this._representation = representation;
    this._table = table;

    // Handle different constructor overloads
    if (shapeOrAllowPattern instanceof Shape) {
      this._shape = shapeOrAllowPattern;
    } else {
      const allowPattern = shapeOrAllowPattern === true;
      const result = table.getShapeNodes(representation, allowPattern);

      if (!result.success) {
        throw new Error(
          `Failed to parse representation '${representation}' at position ${result.errorPos}`
        );
      }

      // Create shape from nodes
      this._shape = new Shape();
      for (const node of result.nodes) {
        this._shape.add(node);
      }
    }

    this._shape.freeze();
  }

  /**
   * Gets the string representation.
   * @returns {string}
   */
  get representation() {
    return this._representation;
  }

  /**
   * Gets the character definition table.
   * @returns {CharacterDefinitionTable}
   */
  get characterDefinitionTable() {
    return this._table;
  }

  /**
   * Gets the phonological shape.
   * @returns {Shape}
   */
  get shape() {
    return this._shape;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this._representation;
  }
}
