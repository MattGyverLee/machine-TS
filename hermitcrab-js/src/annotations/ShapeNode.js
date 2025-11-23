import { DoublyLinkedListNode } from '../utils/DoublyLinkedList.js';
import { Direction } from '../utils/Direction.js';
import { Annotation } from './Annotation.js';
import { Range } from '../utils/Range.js';
import { FeatureStruct } from '../features/FeatureStruct.js';

/**
 * Node in a phonological shape.
 */
export class ShapeNode extends DoublyLinkedListNode {
  /**
   * Creates a new ShapeNode.
   * @param {FeatureStruct} fs - The feature structure
   */
  constructor(fs) {
    super();
    this._annotation = new Annotation(Range.create(this), fs);
    this._tag = Number.MIN_SAFE_INTEGER;
  }

  /**
   * Gets the annotation for this node.
   * @returns {Annotation<ShapeNode>}
   */
  get annotation() {
    return this._annotation;
  }

  /**
   * Gets the tag (position index) for ordering.
   * @returns {number}
   */
  get tag() {
    return this._tag;
  }

  /**
   * Sets the tag (internal use).
   * @param {number} value
   */
  set tag(value) {
    this.checkFrozen();
    this._tag = value;
  }

  /**
   * Compares this node to another.
   * @param {ShapeNode} other - The other node
   * @param {string} [direction=Direction.LeftToRight] - The direction
   * @returns {number} -1, 0, or 1
   */
  compareTo(other, direction = Direction.LeftToRight) {
    if (other.list !== this.list) {
      throw new Error('Only nodes from the same list can be compared');
    }

    const res = this._tag < other._tag ? -1 : this._tag > other._tag ? 1 : 0;
    return direction === Direction.LeftToRight ? res : -res;
  }

  /**
   * Clones this node.
   * @returns {ShapeNode}
   */
  clone() {
    const node = new ShapeNode(this._annotation.featureStruct.clone());
    node._annotation.optional = this._annotation.optional;
    return node;
  }

  /**
   * Checks if this node value-equals another.
   * @param {ShapeNode} other - The other node
   * @returns {boolean}
   */
  valueEquals(other) {
    if (!(other instanceof ShapeNode)) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (this._frozen) {
      return this._tag === other._tag;
    }

    // If not frozen, compare by position in list
    return this.list?.indexOf(this) === other.list?.indexOf(other);
  }

  /**
   * Freezes this node.
   */
  freeze() {
    if (this._frozen) return;
    super.freeze();
    this._hashCode = this._tag;
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    if (this._list !== null) {
      if (this._list.begin === this) return 'B';
      if (this._list.end === this) return 'E';

      let i = 0;
      for (const node of this._list) {
        if (node === this) return i.toString();
        i++;
      }
    }

    return super.toString();
  }
}
