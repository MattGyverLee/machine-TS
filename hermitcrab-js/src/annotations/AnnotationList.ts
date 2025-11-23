import { DoublyLinkedList } from '../utils/DoublyLinkedList.js';
import { Direction } from '../utils/Direction.js';
import { Range } from '../utils/Range.js';
import { Annotation } from './Annotation.js';
import { FeatureStruct } from '../features/FeatureStruct.js';

/**
 * List of annotations with hierarchical support.
 * @template TOffset
 */
export class AnnotationList extends DoublyLinkedList {
  /**
   * Creates a new AnnotationList.
   * @param {Annotation<TOffset>} [parent=null] - The parent annotation
   */
  constructor(parent = null) {
    // Create margin selector that returns annotations with null range
    super((isEnd) => new Annotation(Range.Null));
    this._parent = parent;
    this._currentID = 0;
  }

  /**
   * Gets the parent annotation.
   * @returns {Annotation<TOffset>|null}
   */
  get parent() {
    return this._parent;
  }

  /**
   * Adds an annotation with a range and feature structure.
   * @param {Range<TOffset>} range - The range
   * @param {FeatureStruct} fs - The feature structure
   * @param {boolean} [optional=false] - Whether the annotation is optional
   * @returns {Annotation<TOffset>}
   */
  addRange(range, fs, optional = false) {
    const ann = new Annotation(range, fs);
    ann.optional = optional;
    this.add(ann);
    return ann;
  }

  /**
   * Adds an annotation at a single offset.
   * @param {TOffset} offset - The offset
   * @param {FeatureStruct} fs - The feature structure
   * @param {boolean} [optional=false] - Whether the annotation is optional
   * @returns {Annotation<TOffset>}
   */
  addOffset(offset, fs, optional = false) {
    return this.addRange(Range.create(offset), fs, optional);
  }

  /**
   * Adds an annotation with start and end offsets.
   * @param {TOffset} start - The start offset
   * @param {TOffset} end - The end offset
   * @param {FeatureStruct} fs - The feature structure
   * @param {boolean} [optional=false] - Whether the annotation is optional
   * @returns {Annotation<TOffset>}
   */
  addStartEnd(start, end, fs, optional = false) {
    return this.addRange(Range.create(start, end), fs, optional);
  }

  /**
   * Adds an annotation node.
   * @param {Annotation<TOffset>} node - The annotation to add
   * @param {boolean} [subsume=true] - Whether to subsume child annotations
   */
  add(node, subsume = true) {
    this.checkFrozen();

    // Check if within parent range
    if (this._parent !== null && !this._parent.range.contains(node.range)) {
      throw new Error('The new annotation must be within the range of the parent annotation');
    }

    // Remove from previous list if any
    node.remove(false);

    if (subsume) {
      // Find annotations within this range and make them children
      const childAnnotations = Array.from(this.getNodes(node.range));
      for (const ann of childAnnotations) {
        node.children.add(ann, false);
      }

      // Add to the list
      super.add(node);
      node.listID = this._currentID++;
      node.init(this);

      // Find parent annotation (annotation that contains this range)
      let ann = node.prev;
      while (ann !== this.begin && ann !== null) {
        if (ann.range.contains(node.range)) {
          ann.children.add(node, false);
          break;
        }
        ann = ann.prev;
      }
    } else {
      super.add(node);
      node.listID = this._currentID++;
      node.init(this);
    }
  }

  /**
   * Removes an annotation.
   * @param {Annotation<TOffset>} node - The annotation to remove
   * @param {boolean} [preserveChildren=true] - Whether to preserve children
   * @returns {boolean} True if removed
   */
  remove(node, preserveChildren = true) {
    this.checkFrozen();

    if (super.remove(node)) {
      if (preserveChildren && node._children !== null) {
        const children = Array.from(node.children);
        for (const ann of children) {
          this.add(ann, false);
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Finds an annotation at an offset.
   * @param {TOffset} offset - The offset to find
   * @param {string} [direction=Direction.LeftToRight] - The direction
   * @returns {{found: boolean, result: Annotation<TOffset>|null}}
   */
  find(offset, direction = Direction.LeftToRight) {
    if (this.count === 0) {
      return { found: false, result: null };
    }

    const last = direction === Direction.LeftToRight ? this.last : this.first;
    const lastOffset = last.range.getEnd(direction);

    // Simple implementation - linear search for now
    // TODO: Implement binary search for better performance
    for (const ann of this) {
      if (ann.range.contains(offset)) {
        return { found: true, result: ann };
      }
      const start = ann.range.getStart(direction);
      if (direction === Direction.LeftToRight) {
        if (start > offset) {
          return { found: false, result: ann };
        }
      } else {
        if (start < offset) {
          return { found: false, result: ann };
        }
      }
    }

    return { found: false, result: last };
  }

  /**
   * Finds an annotation depth-first at an offset.
   * @param {TOffset} offset - The offset to find
   * @param {string} [direction=Direction.LeftToRight] - The direction
   * @returns {{found: boolean, result: Annotation<TOffset>|null}}
   */
  findDepthFirst(offset, direction = Direction.LeftToRight) {
    const result = this.find(offset, direction);
    if (result.found) {
      return result;
    }

    if (
      result.result &&
      !result.result.isLeaf &&
      result.result.range.contains(offset)
    ) {
      return result.result.children.findDepthFirst(offset, direction);
    }

    return result;
  }

  /**
   * Gets annotations within a range.
   * @param {Range<TOffset>|TOffset} rangeOrStart - The range or start offset
   * @param {TOffset} [end] - The end offset (if first param is start)
   * @param {string} [direction=Direction.LeftToRight] - The direction
   * @returns {Generator<Annotation<TOffset>>}
   */
  *getNodes(rangeOrStart, end = null, direction = Direction.LeftToRight) {
    let range;
    if (rangeOrStart instanceof Range) {
      range = rangeOrStart;
      direction = end ?? Direction.LeftToRight;
    } else {
      range = Range.create(rangeOrStart, end ?? rangeOrStart);
    }

    if (this.count === 0) {
      return;
    }

    for (const ann of this) {
      if (range.contains(ann.range)) {
        yield ann;
      }
    }
  }

  /**
   * Clears all annotations.
   */
  clear() {
    this.checkFrozen();
    super.clear();
    this._currentID = 0;
  }

  /**
   * Clones this annotation list.
   * @returns {AnnotationList<TOffset>}
   */
  clone() {
    const list = new AnnotationList(this._parent);
    for (const ann of this) {
      list.add(ann.clone(), false);
    }
    return list;
  }

  /**
   * Checks if this list value-equals another.
   * @param {AnnotationList<TOffset>} other - The other list
   * @returns {boolean}
   */
  valueEquals(other) {
    if (!(other instanceof AnnotationList)) {
      return false;
    }

    if (this.count !== other.count) {
      return false;
    }

    const thisArray = Array.from(this);
    const otherArray = Array.from(other);

    for (let i = 0; i < thisArray.length; i++) {
      if (!thisArray[i].valueEquals(otherArray[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Freezes this list.
   */
  freeze() {
    if (this._frozen) return;

    super.freeze();
    this._hashCode = 23;
    for (const ann of this) {
      ann.freeze();
      this._hashCode = (this._hashCode * 31 + ann.getFrozenHashCode()) | 0;
    }
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    const anns = Array.from(this).map((a) => a.toString());
    return `{${anns.join(', ')}}`;
  }
}
