import { DoublyLinkedList } from '../utils/DoublyLinkedList.js';
import { Direction } from '../utils/Direction.js';
import { ShapeNode } from './ShapeNode.js';
import { AnnotationList } from './AnnotationList.js';
import { Range } from '../utils/Range.js';
import { FeatureStruct } from '../features/FeatureStruct.js';

const NUM_BITS = 30; // Number of bits for sparse ordering (32 - 2 for sign and overflow)

/**
 * Phonological shape - a list of ShapeNodes with annotations.
 */
export class Shape extends DoublyLinkedList {
  /**
   * Creates a new Shape.
   * @param {Function} [marginSelector] - Function to create margin nodes
   * @param {AnnotationList<ShapeNode>} [annotations] - Annotation list
   */
  constructor(marginSelector = null, annotations = null) {
    const selector = marginSelector || ((isEnd) => new ShapeNode(new FeatureStruct()));
    super(selector);
    this._marginSelector = selector;
    this._annotations = annotations || new AnnotationList();

    // Set up margins
    this.begin.tag = Number.MIN_SAFE_INTEGER;
    this.end.tag = Number.MAX_SAFE_INTEGER;
    this._annotations.add(this.begin.annotation, false);
    this._annotations.add(this.end.annotation, false);
  }

  /**
   * Gets the range of this shape.
   * @returns {Range<ShapeNode>}
   */
  get range() {
    return Range.create(this.begin, this.end);
  }

  /**
   * Gets the annotations.
   * @returns {AnnotationList<ShapeNode>}
   */
  get annotations() {
    return this._annotations;
  }

  /**
   * Adds a new node with a feature structure.
   * @param {FeatureStruct} fs - The feature structure
   * @param {boolean} [optional=false] - Whether the node is optional
   * @returns {ShapeNode}
   */
  addNode(fs, optional = false) {
    const newNode = new ShapeNode(fs);
    newNode.annotation.optional = optional;
    this.add(newNode);
    return newNode;
  }

  /**
   * Adds a node after another node.
   * @param {ShapeNode|null} node - The node to add after
   * @param {FeatureStruct|ShapeNode} fsOrNode - Feature structure or ShapeNode
   * @param {boolean|string} [optionalOrDir=false] - Optional flag or direction
   * @param {string} [dir=Direction.LeftToRight] - Direction
   * @returns {ShapeNode}
   */
  addNodeAfter(node, fsOrNode, optionalOrDir = false, dir = Direction.LeftToRight) {
    let newNode;
    let optional = false;
    let direction = dir;

    if (fsOrNode instanceof ShapeNode) {
      newNode = fsOrNode;
    } else {
      newNode = new ShapeNode(fsOrNode);
    }

    if (typeof optionalOrDir === 'boolean') {
      optional = optionalOrDir;
    } else {
      direction = optionalOrDir;
    }

    newNode.annotation.optional = optional;
    this.addAfter(node, newNode, direction);
    return newNode;
  }

  /**
   * Adds a node after another, handling tag assignment.
   * @param {ShapeNode|null} node - The node to add after
   * @param {ShapeNode} newNode - The new node
   * @param {string} [direction=Direction.LeftToRight] - The direction
   */
  addAfter(node, newNode, direction = Direction.LeftToRight) {
    this.checkFrozen();

    if (newNode.list === this) {
      throw new TypeError('newNode is already a member of this collection');
    }
    if (node !== null && node.list !== this) {
      throw new TypeError('node is not a member of this collection');
    }

    // Assign tag for sparse ordering
    if (this.count === 0) {
      newNode.tag = 0;
    } else {
      let curNode = node;
      if (direction === Direction.RightToLeft) {
        curNode = curNode === null ? this.last : curNode.prev;
      }

      // Check if we need to relabel
      if (curNode === null) {
        if (this.first.tag === Number.MIN_SAFE_INTEGER + 1) {
          this._relabelMinimumSparseEnclosingRange(null);
        }
      } else if (curNode.next === null) {
        if (curNode.tag === Number.MAX_SAFE_INTEGER - 1) {
          this._relabelMinimumSparseEnclosingRange(curNode);
        }
      } else if (curNode.tag + 1 === curNode.next.tag) {
        this._relabelMinimumSparseEnclosingRange(curNode);
      }

      // Compute tag as average between neighbors
      if (curNode !== null && curNode.next === null) {
        newNode.tag = this._average(curNode.tag, Number.MAX_SAFE_INTEGER);
      } else {
        newNode.tag = this._average(
          curNode === null ? Number.MIN_SAFE_INTEGER : curNode.tag,
          curNode === null ? this.first.tag : curNode.next.tag
        );
      }
    }

    super.addAfter(node, newNode, direction);
    this._annotations.add(newNode.annotation, false);
  }

  /**
   * Removes a node from the shape.
   * @param {ShapeNode} node - The node to remove
   * @returns {boolean}
   */
  remove(node) {
    this.checkFrozen();

    if (node.list !== this) {
      return false;
    }

    node.annotation.remove();
    this._updateAnnotations(this._annotations, node);
    return super.remove(node);
  }

  /**
   * Clears all nodes.
   */
  clear() {
    this.checkFrozen();
    super.clear();
    this._annotations.clear();
    this._annotations.add(this.begin.annotation, false);
    this._annotations.add(this.end.annotation, false);
  }

  /**
   * Copies this shape to another shape.
   * @param {ShapeNode} [srcStart] - Start node
   * @param {ShapeNode} [srcEnd] - End node
   * @param {Shape} [dest] - Destination shape
   * @returns {Range<ShapeNode>}
   */
  copyTo(srcStart = null, srcEnd = null, dest = null) {
    // Handle different overloads
    if (dest instanceof Shape) {
      return this._copyRange(Range.create(srcStart, srcEnd), dest);
    } else if (srcStart instanceof Shape) {
      // copyTo(dest)
      dest = srcStart;
      if (this.count === 0) {
        return Range.Null;
      }
      return this._copyRange(Range.create(this.first, this.last), dest);
    } else {
      // Handle range or start/end
      const range = srcStart instanceof Range ? srcStart : Range.create(srcStart, srcEnd);
      return this._copyRange(range, dest);
    }
  }

  /**
   * Copies a range to a destination shape.
   * @param {Range<ShapeNode>} srcRange - Source range
   * @param {Shape} dest - Destination shape
   * @returns {Range<ShapeNode>}
   * @private
   */
  _copyRange(srcRange, dest) {
    let startNode = null;
    let endNode = null;
    const mapping = new Map();

    for (const node of this.getNodes(srcRange.start, srcRange.end)) {
      const newNode = node.clone();
      if (startNode === null) {
        startNode = newNode;
      }
      endNode = newNode;
      dest.add(newNode);
      mapping.set(node, newNode);
    }

    const destRange = Range.create(startNode, endNode);

    // Copy annotations
    for (const ann of this._annotations.getNodes(srcRange)) {
      this._copyAnnotations(dest._annotations, ann, mapping);
    }

    return destRange;
  }

  /**
   * Copies annotations with node mapping.
   * @param {AnnotationList<ShapeNode>} destList - Destination annotation list
   * @param {Annotation<ShapeNode>} ann - Annotation to copy
   * @param {Map<ShapeNode, ShapeNode>} mapping - Node mapping
   * @private
   */
  _copyAnnotations(destList, ann, mapping) {
    if (ann.range.start.annotation === ann) {
      destList.add(mapping.get(ann.range.start).annotation, false);
    } else {
      const newAnn = new Annotation(
        Range.create(mapping.get(ann.range.start), mapping.get(ann.range.end)),
        ann.featureStruct.clone()
      );
      destList.add(newAnn, false);

      if (!ann.isLeaf) {
        for (const child of ann.children) {
          this._copyAnnotations(newAnn.children, child, mapping);
        }
      }
    }
  }

  /**
   * Updates annotations when a node is removed.
   * @param {AnnotationList<ShapeNode>} annList - Annotation list
   * @param {ShapeNode} node - Node being removed
   * @private
   */
  _updateAnnotations(annList, node) {
    if (annList.count === 0) return;

    const startResult = annList.find(node, Direction.LeftToRight);
    let startAnn = startResult.result;
    if (startAnn === annList.begin) {
      startAnn = annList.first;
    }

    const endResult = annList.find(node, Direction.RightToLeft);
    let endAnn = endResult.result;
    if (endAnn === annList.end) {
      endAnn = annList.last;
    }

    if (!startAnn || !endAnn || startAnn.compareTo(endAnn) > 0) {
      return;
    }

    const toProcess = [];
    for (const ann of annList.getNodes(Range.create(startAnn, endAnn))) {
      if (ann.range.contains(node)) {
        toProcess.push(ann);
      }
    }

    for (const ann of toProcess) {
      if (!ann.isLeaf) {
        this._updateAnnotations(ann.children, node);
      }

      if (ann.range.start === node && ann.range.end === node) {
        annList.remove(ann, false);
      } else if (ann.range.start === node || ann.range.end === node) {
        const range =
          ann.range.start === node
            ? Range.create(node.next, ann.range.end)
            : Range.create(ann.range.start, node.prev);

        const newAnn = new Annotation(range, ann.featureStruct.clone());
        newAnn.optional = ann.optional;

        if (!ann.isLeaf) {
          const children = Array.from(ann.children);
          for (const child of children) {
            newAnn.children.add(child, false);
          }
        }

        annList.remove(ann, false);
        annList.add(newAnn, false);
      }
    }
  }

  /**
   * Computes average of two integers (avoiding overflow).
   * @param {number} x - First number
   * @param {number} y - Second number
   * @returns {number}
   * @private
   */
  _average(x, y) {
    return ((x & y) + ((x ^ y) >> 1)) | 0;
  }

  /**
   * Relabels nodes in a minimum sparse enclosing range.
   * This algorithm maintains sparse ordering even when tags get too close.
   * @param {ShapeNode|null} node - The node to relabel around
   * @private
   */
  _relabelMinimumSparseEnclosingRange(node) {
    const t = Math.pow(Math.pow(2, NUM_BITS) / this.count, 1.0 / NUM_BITS);

    let elementCount = 1.0;
    let left = node;
    let right = node;
    const tag = node === null ? Number.MIN_SAFE_INTEGER : node.tag;
    let low = tag;
    let high = tag;

    let level = 0;
    let overflowThreshold = 1.0;
    let range = 1;

    do {
      const toggleBit = 1 << level++;
      overflowThreshold /= t;
      range <<= 1;

      const expandToLeft = (tag & toggleBit) !== 0;
      if (expandToLeft) {
        low ^= toggleBit;
        while (left !== null && left.tag > low) {
          left = left.prev;
          elementCount++;
        }
      } else {
        high ^= toggleBit;
        while (right === null || (right.tag < high && right.next !== null && right.next.tag > right.tag)) {
          right = right === null ? this.first : right.next;
          elementCount++;
        }
      }
    } while (elementCount >= range * overflowThreshold && level < NUM_BITS);

    const count = Math.floor(elementCount);
    let pos = low;
    const step = Math.floor(range / count);
    let cursor = left;

    if (step > 1) {
      for (let i = 0; i < count; i++) {
        if (cursor !== null) {
          cursor.tag = pos;
        }
        pos += step;
        cursor = cursor === null ? this.first : cursor.next;
      }
    } else {
      // Handle degenerate case (step === 1)
      const slack = range - count;
      for (let i = 0; i < elementCount; i++) {
        if (cursor !== null) {
          cursor.tag = pos;
        }
        pos++;
        if (node === cursor) {
          pos += slack;
        }
        cursor = cursor === null ? this.first : cursor.next;
      }
    }
  }

  /**
   * Checks if this shape value-equals another.
   * @param {Shape} other - The other shape
   * @returns {boolean}
   */
  valueEquals(other) {
    if (!(other instanceof Shape)) {
      return false;
    }

    if (this.count !== other.count) {
      return false;
    }

    return this._annotations.valueEquals(other._annotations);
  }

  /**
   * Freezes this shape.
   */
  freeze() {
    if (this._frozen) return;

    super.freeze();
    this.begin.freeze();

    let i = 0;
    for (const node of this) {
      node.tag = i++;
      node.freeze();
    }

    this.end.freeze();
    this._annotations.freeze();

    this._hashCode = 23;
    this._hashCode = (this._hashCode * 31 + this.count) | 0;
    this._hashCode = (this._hashCode * 31 + this._annotations.getFrozenHashCode()) | 0;
  }

  /**
   * Clones this shape.
   * @returns {Shape}
   */
  clone() {
    const shape = new Shape(this._marginSelector);
    this.copyTo(shape);
    return shape;
  }
}
