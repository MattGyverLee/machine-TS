import { Direction } from './Direction.js';
import { Freezable } from './Freezable.js';

/**
 * Node in a doubly-linked list.
 */
export class DoublyLinkedListNode extends Freezable {
  constructor() {
    super();
    this._prev = null;
    this._next = null;
    this._list = null;
  }

  /**
   * Gets the previous node.
   * @returns {DoublyLinkedListNode|null}
   */
  get prev() {
    return this._prev;
  }

  /**
   * Gets the next node.
   * @returns {DoublyLinkedListNode|null}
   */
  get next() {
    return this._next;
  }

  /**
   * Gets the list this node belongs to.
   * @returns {DoublyLinkedList|null}
   */
  get list() {
    return this._list;
  }

  /**
   * Gets the node in the specified direction.
   * @param {string} direction - The direction
   * @returns {DoublyLinkedListNode|null}
   */
  getNext(direction) {
    return direction === Direction.LeftToRight ? this._next : this._prev;
  }

  /**
   * Gets the node in the opposite direction.
   * @param {string} direction - The direction
   * @returns {DoublyLinkedListNode|null}
   */
  getPrev(direction) {
    return direction === Direction.LeftToRight ? this._prev : this._next;
  }
}

/**
 * Ordered bidirectional doubly-linked list.
 * Equivalent to C#'s OrderedBidirList<T>.
 */
export class DoublyLinkedList extends Freezable {
  constructor(marginSelector = null) {
    super();
    this._marginSelector = marginSelector || ((isEnd) => (isEnd ? this._end : this._begin));
    this._begin = this._marginSelector(false);
    this._end = this._marginSelector(true);
    this._begin._list = this;
    this._end._list = this;
    this._count = 0;
  }

  /**
   * Gets the begin margin node.
   * @returns {DoublyLinkedListNode}
   */
  get begin() {
    return this._begin;
  }

  /**
   * Gets the end margin node.
   * @returns {DoublyLinkedListNode}
   */
  get end() {
    return this._end;
  }

  /**
   * Gets the first actual node (after begin).
   * @returns {DoublyLinkedListNode|null}
   */
  get first() {
    return this._begin._next;
  }

  /**
   * Gets the last actual node (before end).
   * @returns {DoublyLinkedListNode|null}
   */
  get last() {
    return this._end._prev;
  }

  /**
   * Gets the number of nodes in the list (excluding margins).
   * @returns {number}
   */
  get count() {
    return this._count;
  }

  /**
   * Adds a node to the end of the list.
   * @param {DoublyLinkedListNode} node - The node to add
   */
  add(node) {
    this.addAfter(this.last, node, Direction.LeftToRight);
  }

  /**
   * Adds a node after another node.
   * @param {DoublyLinkedListNode|null} node - The node to add after (null = beginning)
   * @param {DoublyLinkedListNode} newNode - The new node to add
   * @param {string} direction - The direction
   */
  addAfter(node, newNode, direction = Direction.LeftToRight) {
    this.checkFrozen();

    if (newNode._list === this) {
      throw new TypeError('newNode is already a member of this collection');
    }
    if (node !== null && node._list !== this) {
      throw new TypeError('node is not a member of this collection');
    }

    // Find the insertion point
    let prev = node;
    if (direction === Direction.RightToLeft) {
      prev = node === null ? this._end._prev : node._prev;
    }

    // Insert the node
    const next = prev === null ? this._begin._next : prev._next;
    newNode._prev = prev === null ? this._begin : prev;
    newNode._next = next === null ? this._end : next;
    newNode._list = this;

    if (prev === null) {
      this._begin._next = newNode;
    } else {
      prev._next = newNode;
    }

    if (next === null) {
      this._end._prev = newNode;
    } else {
      next._prev = newNode;
    }

    this._count++;
  }

  /**
   * Adds a node before another node.
   * @param {DoublyLinkedListNode|null} node - The node to add before (null = end)
   * @param {DoublyLinkedListNode} newNode - The new node to add
   * @param {string} direction - The direction
   */
  addBefore(node, newNode, direction = Direction.LeftToRight) {
    const prev = node === null ? null : node.getPrev(direction);
    this.addAfter(prev, newNode, direction);
  }

  /**
   * Removes a node from the list.
   * @param {DoublyLinkedListNode} node - The node to remove
   * @returns {boolean} True if removed, false otherwise
   */
  remove(node) {
    this.checkFrozen();

    if (node._list !== this) {
      return false;
    }

    node._prev._next = node._next;
    node._next._prev = node._prev;
    node._list = null;
    node._prev = null;
    node._next = null;
    this._count--;

    return true;
  }

  /**
   * Clears all nodes from the list.
   */
  clear() {
    this.checkFrozen();

    let current = this._begin._next;
    while (current !== this._end) {
      const next = current._next;
      current._list = null;
      current._prev = null;
      current._next = null;
      current = next;
    }

    this._begin._next = this._end;
    this._end._prev = this._begin;
    this._count = 0;
  }

  /**
   * Gets the index of a node.
   * @param {DoublyLinkedListNode} node - The node
   * @returns {number} The index, or -1 if not found
   */
  indexOf(node) {
    if (node._list !== this) {
      return -1;
    }

    let index = 0;
    let current = this._begin._next;
    while (current !== this._end) {
      if (current === node) {
        return index;
      }
      current = current._next;
      index++;
    }
    return -1;
  }

  /**
   * Iterates over nodes in the list.
   * @param {DoublyLinkedListNode|null} start - Start node (null = first)
   * @param {DoublyLinkedListNode|null} end - End node (null = last)
   * @param {string} direction - The direction
   * @returns {Generator<DoublyLinkedListNode>}
   */
  *getNodes(start = null, end = null, direction = Direction.LeftToRight) {
    const startNode = start ?? (direction === Direction.LeftToRight ? this.first : this.last);
    const endNode = end ?? (direction === Direction.LeftToRight ? this.last : this.first);

    if (startNode === null || endNode === null) {
      return;
    }

    let current = startNode;
    while (current !== null && current !== this._end && current !== this._begin) {
      yield current;
      if (current === endNode) {
        break;
      }
      current = current.getNext(direction);
    }
  }

  /**
   * Iterates over all nodes in the list.
   * @returns {Generator<DoublyLinkedListNode>}
   */
  *[Symbol.iterator]() {
    let current = this._begin._next;
    while (current !== this._end) {
      yield current;
      current = current._next;
    }
  }

  /**
   * Converts the list to an array.
   * @returns {DoublyLinkedListNode[]}
   */
  toArray() {
    return Array.from(this);
  }
}
