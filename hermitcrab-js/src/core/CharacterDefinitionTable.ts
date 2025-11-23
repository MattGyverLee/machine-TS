import { CharacterDefinition } from './CharacterDefinition.js';
import { NaturalClass } from './NaturalClass.js';
import { FeatureStruct } from '../features/FeatureStruct.js';
import { StringFeatureValue } from '../features/FeatureValue.js';
import { HCFeatureSystem } from './HCFeatureSystem.js';
import { ShapeNode } from '../annotations/ShapeNode.js';

/**
 * Table of character definitions mapping strings to phonological segments.
 */
export class CharacterDefinitionTable {
  constructor() {
    this._charDefLookup = new Map(); // Map<string, CharacterDefinition>
    this._charDefs = new Set(); // Set<CharacterDefinition>
    this._naturalClassLookup = new Map(); // Map<string, NaturalClass>
    this._name = '';
  }

  /**
   * Gets the name of this table.
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Sets the name of this table.
   * @param {string} value
   */
  set name(value) {
    this._name = value;
  }

  /**
   * Gets the number of character definitions.
   * @returns {number}
   */
  get count() {
    return this._charDefs.size;
  }

  /**
   * Adds a segment character definition.
   * @param {string|Array<string>} strRep - String representation(s)
   * @param {FeatureStruct} [fs=null] - Feature structure
   * @returns {CharacterDefinition}
   */
  addSegment(strRep, fs = null) {
    const strReps = Array.isArray(strRep) ? strRep : [strRep];
    return this._add(strReps, HCFeatureSystem.Segment, fs);
  }

  /**
   * Adds a boundary character definition.
   * @param {string|Array<string>} strRep - String representation(s)
   * @returns {CharacterDefinition}
   */
  addBoundary(strRep) {
    const strReps = Array.isArray(strRep) ? strRep : [strRep];
    return this._add(strReps, HCFeatureSystem.Boundary, null);
  }

  /**
   * Adds a natural class.
   * @param {NaturalClass} naturalClass - The natural class to add
   */
  addNaturalClass(naturalClass) {
    this._naturalClassLookup.set(naturalClass.name, naturalClass);
  }

  /**
   * Gets a natural class by name.
   * @param {string} name - The natural class name
   * @returns {NaturalClass|null}
   */
  getNaturalClass(name) {
    return this._naturalClassLookup.get(name) ?? null;
  }

  /**
   * Internal method to add a character definition.
   * @param {Array<string>} strReps - String representations
   * @param {FeatureSymbol} type - The type (Segment or Boundary)
   * @param {FeatureStruct|null} fs - Feature structure
   * @returns {CharacterDefinition}
   * @private
   */
  _add(strReps, type, fs) {
    // Normalize to NFD (Unicode Normalization Form D)
    const normalizedStrReps = strReps.map((s) => s.normalize('NFD'));

    // Check for duplicates
    for (const s of normalizedStrReps) {
      if (this._charDefLookup.has(s)) {
        throw new Error(
          `The table already contains a character definition with representation '${s}'`
        );
      }
    }

    // Create feature structure if not provided
    if (fs === null) {
      fs = new FeatureStruct();
      fs.addValue(HCFeatureSystem.Type, type);
      fs.addValue(HCFeatureSystem.StrRep, new StringFeatureValue(normalizedStrReps));
      fs.freeze();
    } else {
      fs.addValue(HCFeatureSystem.Type, type);
      fs.freeze();
    }

    // Create character definition
    const cd = new CharacterDefinition(strReps, fs);
    this._charDefs.add(cd);

    // Add to lookup table
    for (const rep of normalizedStrReps) {
      this._charDefLookup.set(rep, cd);
    }

    cd.characterDefinitionTable = this;
    return cd;
  }

  /**
   * Gets all string representations that match a shape node.
   * @param {ShapeNode} node - The shape node
   * @returns {Array<string>}
   */
  getMatchingStrReps(node) {
    const matches = [];

    for (const cd of this._charDefs) {
      // TODO: Implement proper unification check
      // For now, do a simple feature structure comparison
      if (this._isUnifiable(cd.featureStruct, node.annotation.featureStruct)) {
        matches.push(...cd.representations);
      }
    }

    return matches;
  }

  /**
   * Simple unifiability check (simplified).
   * @param {FeatureStruct} fs1
   * @param {FeatureStruct} fs2
   * @returns {boolean}
   * @private
   */
  _isUnifiable(fs1, fs2) {
    // Simplified unification check
    // TODO: Implement full unification algorithm
    return true;
  }

  /**
   * Parses a string into shape nodes.
   * @param {string} str - The string to parse
   * @param {boolean} [allowPattern=false] - Whether to allow pattern syntax
   * @returns {{success: boolean, nodes: Array<ShapeNode>|null, errorPos: number}}
   */
  getShapeNodes(str, allowPattern = false) {
    const nodes = [];
    let i = 0;
    const normalized = str.normalize('NFD');
    let optional = false;
    let optionalPos = 0;
    let optionalCount = 0;

    while (i < normalized.length) {
      let match = false;

      // Try to match the longest possible string
      for (let j = normalized.length - i; j > 0; j--) {
        const s = normalized.substring(i, i + j);
        const cd = this._charDefLookup.get(s);

        if (cd) {
          const node = new ShapeNode(cd.featureStruct.clone());
          node.annotation.optional = node.annotation.featureStruct.getValue(HCFeatureSystem.Type) === HCFeatureSystem.Boundary;
          nodes.push(node);
          i += j;
          match = true;
          break;
        }
      }

      if (match) {
        continue;
      }

      // Handle pattern syntax if allowed
      if (allowPattern) {
        const char = normalized[i];

        // Natural class: [ClassName]
        if (char === '[') {
          const closePos = normalized.indexOf(']', i);
          if (closePos > 0) {
            const className = normalized.substring(i + 1, closePos);
            const naturalClass = this._naturalClassLookup.get(className);

            if (naturalClass) {
              const node = new ShapeNode(naturalClass.featureStruct);
              nodes.push(node);
              i = closePos + 1;
              continue;
            }
          }
        }
        // Optional: ([ClassName])
        else if (char === '(') {
          if (i + 1 < normalized.length && normalized[i + 1] === '[') {
            optional = true;
            optionalPos = i;
            optionalCount = nodes.length;
            i++;
            continue;
          }
        }
        // Close optional
        else if (char === ')') {
          if (optional && nodes.length === optionalCount + 1) {
            nodes[nodes.length - 1].annotation.optional = true;
            optional = false;
            i++;
            continue;
          }
        }
        // Kleene star: [ClassName]*
        else if (char === '*') {
          if (i > 0 && normalized[i - 1] === ']') {
            nodes[nodes.length - 1].annotation.optional = true;
            // TODO: Set iterative flag
            i++;
            continue;
          }
        }
      }

      // Error - couldn't parse at this position
      return { success: false, nodes: null, errorPos: i };
    }

    return { success: true, nodes, errorPos: -1 };
  }

  /**
   * Gets a character definition by string representation.
   * @param {string} strRep - The string representation
   * @returns {CharacterDefinition|null}
   */
  get(strRep) {
    const normalized = strRep.normalize('NFD');
    return this._charDefLookup.get(normalized) ?? null;
  }

  /**
   * Iterates over all character definitions.
   * @returns {IterableIterator<CharacterDefinition>}
   */
  *[Symbol.iterator]() {
    yield* this._charDefs;
  }

  /**
   * Converts to array.
   * @returns {Array<CharacterDefinition>}
   */
  toArray() {
    return Array.from(this._charDefs);
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return `CharacterDefinitionTable[${this._name || 'unnamed'}] (${this.count} definitions)`;
  }
}
