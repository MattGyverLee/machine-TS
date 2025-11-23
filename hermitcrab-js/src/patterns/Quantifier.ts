/**
 * Quantifier specifies how many times a constraint can match.
 * Similar to regex quantifiers: ?, *, +, {n,m}
 */
export class Quantifier {
  private _minOccur: number;
  private _maxOccur: number;

  /**
   * Creates a new quantifier.
   * @param minOccur - Minimum number of occurrences (default 1)
   * @param maxOccur - Maximum number of occurrences (default 1, -1 for unlimited)
   */
  constructor(minOccur: number = 1, maxOccur: number = 1) {
    if (minOccur < 0) {
      throw new Error('minOccur must be non-negative');
    }
    if (maxOccur !== -1 && maxOccur < minOccur) {
      throw new Error('maxOccur must be >= minOccur or -1 for unlimited');
    }
    this._minOccur = minOccur;
    this._maxOccur = maxOccur;
  }

  /**
   * Gets the minimum number of occurrences.
   */
  get minOccur(): number {
    return this._minOccur;
  }

  /**
   * Gets the maximum number of occurrences (-1 for unlimited).
   */
  get maxOccur(): number {
    return this._maxOccur;
  }

  /**
   * Checks if this is an optional quantifier (minOccur = 0).
   */
  get isOptional(): boolean {
    return this._minOccur === 0;
  }

  /**
   * Checks if this quantifier allows zero matches.
   */
  get allowsZero(): boolean {
    return this._minOccur === 0;
  }

  /**
   * Checks if this quantifier allows multiple matches.
   */
  get allowsMultiple(): boolean {
    return this._maxOccur === -1 || this._maxOccur > 1;
  }

  /**
   * Checks if a count satisfies this quantifier.
   */
  isSatisfied(count: number): boolean {
    if (count < this._minOccur) return false;
    if (this._maxOccur === -1) return true;
    return count <= this._maxOccur;
  }

  /**
   * Checks if more matches are allowed given the current count.
   */
  allowsMore(count: number): boolean {
    if (this._maxOccur === -1) return true;
    return count < this._maxOccur;
  }

  toString(): string {
    if (this._minOccur === 0 && this._maxOccur === 1) return '?';
    if (this._minOccur === 0 && this._maxOccur === -1) return '*';
    if (this._minOccur === 1 && this._maxOccur === -1) return '+';
    if (this._minOccur === this._maxOccur) return `{${this._minOccur}}`;
    if (this._maxOccur === -1) return `{${this._minOccur},}`;
    return `{${this._minOccur},${this._maxOccur}}`;
  }

  // Common quantifiers
  static readonly One = new Quantifier(1, 1);
  static readonly ZeroOrOne = new Quantifier(0, 1);
  static readonly ZeroOrMore = new Quantifier(0, -1);
  static readonly OneOrMore = new Quantifier(1, -1);
}
