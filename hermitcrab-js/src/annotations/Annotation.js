import { DoublyLinkedListNode } from '../utils/DoublyLinkedList.js';
import { Range } from '../utils/Range.js';
import { FeatureStruct } from '../features/FeatureStruct.js';

/**
 * Annotation over a range with feature structures and hierarchical children.
 * @template TOffset
 */
export class Annotation extends DoublyLinkedListNode {
  /**
   * Creates a new Annotation.
   * @param {Range<TOffset>} range - The range this annotation spans
   * @param {FeatureStruct} [fs] - The feature structure (optional)
   */
  constructor(range, fs = null) {
    super();
    this._range = range;
    this._fs = fs || new FeatureStruct();
    this._optional = false;
    this._data = null;
    this._children = null;
    this._parent = null;
    this._depth = 0;
    this._root = this;
    this._listID = -1;
  }

  /**
   * Gets the range this annotation spans.
   * @returns {Range<TOffset>}
   */
  get range() {
    return this._range;
  }

  /**
   * Sets the range (internal use).
   * @param {Range<TOffset>} value
   */
  set range(value) {
    this._range = value;
  }

  /**
   * Gets the feature structure.
   * @returns {FeatureStruct}
   */
  get featureStruct() {
    return this._fs;
  }

  /**
   * Sets the feature structure.
   * @param {FeatureStruct} value
   */
  set featureStruct(value) {
    this.checkFrozen();
    this._fs = value;
  }

  /**
   * Gets whether this annotation is optional.
   * @returns {boolean}
   */
  get optional() {
    return this._optional;
  }

  /**
   * Sets whether this annotation is optional.
   * @param {boolean} value
   */
  set optional(value) {
    this.checkFrozen();
    this._optional = value;
  }

  /**
   * Gets arbitrary data attached to this annotation.
   * @returns {any}
   */
  get data() {
    return this._data;
  }

  /**
   * Sets arbitrary data attached to this annotation.
   * @param {any} value
   */
  set data(value) {
    this.checkFrozen();
    this._data = value;
  }

  /**
   * Gets the parent annotation.
   * @returns {Annotation<TOffset>|null}
   */
  get parent() {
    return this._parent;
  }

  /**
   * Gets the depth in the annotation tree.
   * @returns {number}
   */
  get depth() {
    return this._depth;
  }

  /**
   * Gets the root of the annotation tree.
   * @returns {Annotation<TOffset>}
   */
  get root() {
    return this._root;
  }

  /**
   * Gets whether this is a leaf annotation (no children).
   * @returns {boolean}
   */
  get isLeaf() {
    return this._children === null || this._children.count === 0;
  }

  /**
   * Gets the children annotations.
   * @returns {AnnotationList<TOffset>}
   */
  get children() {
    if (this._children === null) {
      // Import AnnotationList lazily to avoid circular dependency
      const { AnnotationList } = require('./AnnotationList.js');
      this._children = new AnnotationList(this);
    }
    return this._children;
  }

  /**
   * Gets the list ID.
   * @returns {number}
   */
  get listID() {
    return this._listID;
  }

  /**
   * Sets the list ID (internal use).
   * @param {number} value
   */
  set listID(value) {
    this._listID = value;
  }

  /**
   * Clones this annotation.
   * @returns {Annotation<TOffset>}
   */
  clone() {
    const ann = new Annotation(this._range, this._fs.clone());
    ann._optional = this._optional;
    ann._data = this._data;

    if (this._children !== null && this._children.count > 0) {
      for (const child of this._children) {
        ann.children.add(child.clone(), false);
      }
    }

    return ann;
  }

  /**
   * Removes this annotation from its parent list.
   * @param {boolean} [preserveChildren=false] - Whether to preserve children
   * @returns {boolean} True if removed, false otherwise
   */
  remove(preserveChildren = false) {
    if (this._list === null) {
      return false;
    }
    return this._list.remove(this, preserveChildren);
  }

  /**
   * Compares this annotation to another.
   * @param {Annotation<TOffset>} other - The other annotation
   * @returns {number} -1, 0, or 1
   */
  compareTo(other) {
    if (this === other) {
      return 0;
    }

    if (this._list !== null) {
      if (this._list.begin === this) return -1;
      if (this._list.begin === other) return 1;
      if (this._list.end === this) return 1;
      if (this._list.end === other) return -1;
    }

    // Compare ranges (assumes Range has a compare method)
    const rangeComp = compareRanges(this._range, other._range);
    if (rangeComp !== 0) {
      return rangeComp;
    }

    if (this._listID === -1 || other._listID === -1) {
      return 0;
    }

    return this._listID < other._listID ? -1 : this._listID > other._listID ? 1 : 0;
  }

  /**
   * Checks if this annotation value-equals another.
   * @param {Annotation<TOffset>} other - The other annotation
   * @returns {boolean}
   */
  valueEquals(other) {
    if (!(other instanceof Annotation)) {
      return false;
    }

    if (this.isLeaf !== other.isLeaf) {
      return false;
    }

    if (!this.isLeaf && !this._children.valueEquals(other._children)) {
      return false;
    }

    return (
      this._fs.valueEquals(other._fs) &&
      this._optional === other._optional &&
      this._range.equals(other._range)
    );
  }

  /**
   * Freezes this annotation.
   */
  freeze() {
    if (this._frozen) return;

    super.freeze();
    this._fs.freeze();
    this._children?.freeze();

    this._hashCode = 23;
    this._hashCode = (this._hashCode * 31 + this._fs.getFrozenHashCode()) | 0;
    this._hashCode =
      (this._hashCode * 31 +
        (this._children === null ? 0 : this._children.getFrozenHashCode())) |
      0;
    this._hashCode = (this._hashCode * 31 + (this._optional ? 1 : 0)) | 0;
    // Range hash (simplified)
    this._hashCode = (this._hashCode * 31) | 0;
  }

  /**
   * Clears this annotation.
   * @protected
   */
  clear() {
    this._parent = null;
    this._depth = 0;
    this._root = this;
  }

  /**
   * Initializes this annotation when added to a list.
   * @param {AnnotationList<TOffset>} list - The list
   * @protected
   */
  init(list) {
    this._parent = list.parent;
    if (this._parent !== null) {
      this._depth = this._parent._depth + 1;
      this._root = this._parent._root;
    }
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return `(${this._range} ${this._fs})`;
  }
}

/**
 * Compares two ranges.
 * @param {Range} range1 - First range
 * @param {Range} range2 - Second range
 * @returns {number}
 */
function compareRanges(range1, range2) {
  if (range1.start?.compareTo && range2.start?.compareTo) {
    const startComp = range1.start.compareTo(range2.start);
    if (startComp !== 0) return startComp;
    return range1.end.compareTo(range2.end);
  }
  return 0;
}
