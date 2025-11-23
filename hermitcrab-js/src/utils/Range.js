import { Direction } from './Direction.js';

/**
 * Represents a range between two positions/nodes.
 * @template T
 */
export class Range {
  /**
   * Creates a new Range.
   * @param {T} start - The start position
   * @param {T} end - The end position
   */
  constructor(start, end) {
    this._start = start;
    this._end = end;
  }

  /**
   * Gets the start of the range.
   * @returns {T}
   */
  get start() {
    return this._start;
  }

  /**
   * Gets the end of the range.
   * @returns {T}
   */
  get end() {
    return this._end;
  }

  /**
   * Gets the start in the specified direction.
   * @param {string} direction - The direction
   * @returns {T}
   */
  getStart(direction) {
    return direction === Direction.LeftToRight ? this._start : this._end;
  }

  /**
   * Gets the end in the specified direction.
   * @param {string} direction - The direction
   * @returns {T}
   */
  getEnd(direction) {
    return direction === Direction.LeftToRight ? this._end : this._start;
  }

  /**
   * Checks if the range contains a node/position.
   * @param {T} item - The item to check
   * @returns {boolean}
   */
  contains(item) {
    // Assumes items have a compareTo method or are comparable
    if (this._start?.compareTo && this._end?.compareTo && item?.compareTo) {
      return this._start.compareTo(item) <= 0 && this._end.compareTo(item) >= 0;
    }
    // Fallback to reference equality
    return item === this._start || item === this._end;
  }

  /**
   * Checks if this range overlaps with another range.
   * @param {Range<T>} other - The other range
   * @returns {boolean}
   */
  overlaps(other) {
    if (this._start?.compareTo && other._start?.compareTo) {
      return (
        this._start.compareTo(other._end) <= 0 && this._end.compareTo(other._start) >= 0
      );
    }
    return false;
  }

  /**
   * Gets the length of the range (if applicable).
   * @returns {number}
   */
  get length() {
    if (typeof this._start === 'number' && typeof this._end === 'number') {
      return this._end - this._start + 1;
    }
    return 0;
  }

  /**
   * Checks if this range equals another range.
   * @param {Range<T>} other - The other range
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Range)) return false;
    return this._start === other._start && this._end === other._end;
  }

  /**
   * Checks if this range value-equals another range.
   * @param {Range<T>} other - The other range
   * @returns {boolean}
   */
  valueEquals(other) {
    if (!(other instanceof Range)) return false;

    const startEquals = this._start?.valueEquals
      ? this._start.valueEquals(other._start)
      : this._start === other._start;

    const endEquals = this._end?.valueEquals
      ? this._end.valueEquals(other._end)
      : this._end === other._end;

    return startEquals && endEquals;
  }

  /**
   * Converts the range to a string.
   * @returns {string}
   */
  toString() {
    return `[${this._start}, ${this._end}]`;
  }

  /**
   * Creates a new Range.
   * @template T
   * @param {T} start - The start position
   * @param {T} end - The end position
   * @returns {Range<T>}
   */
  static create(start, end = null) {
    return new Range(start, end ?? start);
  }

  /**
   * Gets a null range.
   * @type {Range<any>}
   */
  static get Null() {
    return new Range(null, null);
  }

  /**
   * Checks if a range is null.
   * @param {Range<T>} range - The range to check
   * @returns {boolean}
   */
  static isNull(range) {
    return range === null || range === undefined || (range._start === null && range._end === null);
  }
}
