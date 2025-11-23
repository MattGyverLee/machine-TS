/**
 * Base class for feature values.
 */
export class FeatureValue {
  constructor() {
    this._forward = null;
  }

  /**
   * Gets the forward pointer (for unification).
   * @returns {FeatureValue|null}
   */
  get forward() {
    return this._forward;
  }

  /**
   * Sets the forward pointer (for unification).
   * @param {FeatureValue|null} value
   */
  set forward(value) {
    this._forward = value;
  }

  /**
   * Dereferences the feature value following forward pointers.
   * @param {FeatureValue} value - The value to dereference
   * @returns {FeatureValue}
   */
  static dereference(value) {
    while (value._forward !== null) {
      value = value._forward;
    }
    return value;
  }

  /**
   * Clones this feature value.
   * @param {Map} [copies] - Map of already copied values
   * @returns {FeatureValue}
   */
  clone(copies = null) {
    return this.cloneImpl(copies || new Map());
  }

  /**
   * Implementation of clone.
   * @param {Map<FeatureValue, FeatureValue>} copies - Map of already copied values
   * @returns {FeatureValue}
   * @protected
   */
  cloneImpl(copies) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Checks if this value equals another value.
   * @param {FeatureValue} other - The other value
   * @returns {boolean}
   */
  valueEquals(other) {
    return this.valueEqualsImpl(
      other,
      new Set(),
      new Set(),
      new Map()
    );
  }

  /**
   * Implementation of valueEquals.
   * @param {FeatureValue} other
   * @param {Set<FeatureValue>} visitedSelf
   * @param {Set<FeatureValue>} visitedOther
   * @param {Map<FeatureValue, FeatureValue>} visitedPairs
   * @returns {boolean}
   * @protected
   */
  valueEqualsImpl(other, visitedSelf, visitedOther, visitedPairs) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Unifies this value with another value.
   * @param {FeatureValue} other - The other value
   * @param {VariableBindings} [varBindings] - Variable bindings
   * @returns {{success: boolean, result: FeatureValue|null}}
   */
  unify(other, varBindings = null) {
    let output;
    const success = this.unifyImpl(other, false, varBindings, output);
    return { success, result: output };
  }

  /**
   * Implementation of unify.
   * @param {FeatureValue} other
   * @param {boolean} useDefaults
   * @param {VariableBindings} varBindings
   * @param {FeatureValue} output
   * @returns {boolean}
   * @protected
   */
  unifyImpl(other, useDefaults, varBindings, output) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Converts to string.
   * @returns {string}
   */
  toString() {
    return this.toStringImpl(new Set(), new Map());
  }

  /**
   * Implementation of toString.
   * @param {Set<FeatureValue>} visited
   * @param {Map<FeatureValue, number>} reentranceIds
   * @returns {string}
   * @protected
   */
  toStringImpl(visited, reentranceIds) {
    throw new Error('Must be implemented by subclass');
  }
}

/**
 * Simple feature value (atomic value).
 */
export class SimpleFeatureValue extends FeatureValue {
  /**
   * Creates a new SimpleFeatureValue.
   * @param {any} value - The value
   * @param {boolean} [isVariable=false] - Whether this is a variable
   */
  constructor(value, isVariable = false) {
    super();
    this._value = value;
    this._isVariable = isVariable;
  }

  /**
   * Gets the value.
   * @returns {any}
   */
  get value() {
    return this._value;
  }

  /**
   * Gets whether this is a variable.
   * @returns {boolean}
   */
  get isVariable() {
    return this._isVariable;
  }

  /**
   * Clones this value.
   * @param {Map<FeatureValue, FeatureValue>} copies
   * @returns {SimpleFeatureValue}
   */
  cloneImpl(copies) {
    if (copies.has(this)) {
      return copies.get(this);
    }

    const copy = new SimpleFeatureValue(this._value, this._isVariable);
    copies.set(this, copy);
    return copy;
  }

  /**
   * Checks if this value equals another.
   * @param {FeatureValue} other
   * @param {Set<FeatureValue>} visitedSelf
   * @param {Set<FeatureValue>} visitedOther
   * @param {Map<FeatureValue, FeatureValue>} visitedPairs
   * @returns {boolean}
   */
  valueEqualsImpl(other, visitedSelf, visitedOther, visitedPairs) {
    if (!(other instanceof SimpleFeatureValue)) {
      return false;
    }

    return this._value === other._value && this._isVariable === other._isVariable;
  }

  /**
   * Converts to string.
   * @param {Set<FeatureValue>} visited
   * @param {Map<FeatureValue, number>} reentranceIds
   * @returns {string}
   */
  toStringImpl(visited, reentranceIds) {
    return this._isVariable ? `?${this._value}` : String(this._value);
  }
}

/**
 * Symbolic feature value (set of symbols).
 */
export class SymbolicFeatureValue extends FeatureValue {
  /**
   * Creates a new SymbolicFeatureValue.
   * @param {...FeatureSymbol|Array<FeatureSymbol>} symbols - Symbols or array of symbols
   */
  constructor(...symbols) {
    super();

    // Handle both ...symbols and single array argument
    if (symbols.length === 1 && Array.isArray(symbols[0])) {
      this._symbols = new Set(symbols[0]);
    } else {
      this._symbols = new Set(symbols);
    }
  }

  /**
   * Gets the symbols.
   * @returns {Set<FeatureSymbol>}
   */
  get symbols() {
    return this._symbols;
  }

  /**
   * Checks if this value contains a symbol.
   * @param {FeatureSymbol} symbol
   * @returns {boolean}
   */
  hasSymbol(symbol) {
    return this._symbols.has(symbol);
  }

  /**
   * Clones this value.
   * @param {Map<FeatureValue, FeatureValue>} copies
   * @returns {SymbolicFeatureValue}
   */
  cloneImpl(copies) {
    if (copies.has(this)) {
      return copies.get(this);
    }

    const copy = new SymbolicFeatureValue(Array.from(this._symbols));
    copies.set(this, copy);
    return copy;
  }

  /**
   * Checks if this value equals another.
   * @param {FeatureValue} other
   * @param {Set<FeatureValue>} visitedSelf
   * @param {Set<FeatureValue>} visitedOther
   * @param {Map<FeatureValue, FeatureValue>} visitedPairs
   * @returns {boolean}
   */
  valueEqualsImpl(other, visitedSelf, visitedOther, visitedPairs) {
    if (!(other instanceof SymbolicFeatureValue)) {
      return false;
    }

    if (this._symbols.size !== other._symbols.size) {
      return false;
    }

    for (const symbol of this._symbols) {
      if (!other._symbols.has(symbol)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Converts to string.
   * @param {Set<FeatureValue>} visited
   * @param {Map<FeatureValue, number>} reentranceIds
   * @returns {string}
   */
  toStringImpl(visited, reentranceIds) {
    const symbols = Array.from(this._symbols).map((s) => s.toString());
    return symbols.length === 1 ? symbols[0] : `{${symbols.join(' ')}}`;
  }
}

/**
 * String feature value (set of strings).
 */
export class StringFeatureValue extends FeatureValue {
  /**
   * Creates a new StringFeatureValue.
   * @param {Array<string>|Set<string>} values - String values
   * @param {boolean} [not=false] - Whether this is a negative constraint
   */
  constructor(values, not = false) {
    super();
    this._values = new Set(values);
    this._not = not;
  }

  /**
   * Gets the string values.
   * @returns {Set<string>}
   */
  get values() {
    return this._values;
  }

  /**
   * Gets whether this is a negative constraint.
   * @returns {boolean}
   */
  get not() {
    return this._not;
  }

  /**
   * Clones this value.
   * @param {Map<FeatureValue, FeatureValue>} copies
   * @returns {StringFeatureValue}
   */
  cloneImpl(copies) {
    if (copies.has(this)) {
      return copies.get(this);
    }

    const copy = new StringFeatureValue(Array.from(this._values), this._not);
    copies.set(this, copy);
    return copy;
  }

  /**
   * Checks if this value equals another.
   * @param {FeatureValue} other
   * @param {Set<FeatureValue>} visitedSelf
   * @param {Set<FeatureValue>} visitedOther
   * @param {Map<FeatureValue, FeatureValue>} visitedPairs
   * @returns {boolean}
   */
  valueEqualsImpl(other, visitedSelf, visitedOther, visitedPairs) {
    if (!(other instanceof StringFeatureValue)) {
      return false;
    }

    if (this._not !== other._not || this._values.size !== other._values.size) {
      return false;
    }

    for (const value of this._values) {
      if (!other._values.has(value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Converts to string.
   * @param {Set<FeatureValue>} visited
   * @param {Map<FeatureValue, number>} reentranceIds
   * @returns {string}
   */
  toStringImpl(visited, reentranceIds) {
    const values = Array.from(this._values);
    const valuesStr = values.length === 1 ? values[0] : `{${values.join(' ')}}`;
    return this._not ? `!${valuesStr}` : valuesStr;
  }
}
