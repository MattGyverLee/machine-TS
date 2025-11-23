# C# to JavaScript Dependency Mapping

This document maps C# dependencies from Machine.NET to their JavaScript equivalents.

## Core Data Structures

### C# → JavaScript

| C# Class/Interface | JavaScript Implementation | Notes |
|-------------------|---------------------------|-------|
| `OrderedBidirList<T>` | `DoublyLinkedList` class | Custom implementation with Tag-based ordering |
| `OrderedBidirListNode<T>` | `DoublyLinkedListNode` class | Node with Prev/Next pointers |
| `AnnotationList<T>` | `AnnotationList` class | List of hierarchical annotations |
| `Annotation<T>` | `Annotation` class | Span annotation with feature structures |
| `Range<T>` | `Range` class | Represents a range between two nodes/positions |

## Feature Model

| C# Class/Interface | JavaScript Implementation | Notes |
|-------------------|---------------------------|-------|
| `FeatureSystem` | `FeatureSystem` class | Container for feature definitions |
| `FeatureStruct` | `FeatureStruct` class | Feature structure with unification |
| `FeatureValue` | `FeatureValue` class | Base class for feature values |
| `SimpleFeatureValue` | `SimpleFeatureValue` class | Atomic feature values |
| `ComplexFeatureValue` | `ComplexFeatureValue` class | Nested feature structures |
| `SymbolicFeatureValue` | `SymbolicFeatureValue` class | Set of symbols (phonetic features) |
| `Feature` | `Feature` class | Feature definition |
| `SymbolicFeature` | `SymbolicFeature` class | Feature with symbolic values |
| `StringFeature` | `StringFeature` class | Feature with string values |
| `ComplexFeature` | `ComplexFeature` class | Feature with nested structure |
| `VariableBindings` | `VariableBindings` class | Variable bindings for unification |

## Pattern Matching

| C# Class/Interface | JavaScript Implementation | Notes |
|-------------------|---------------------------|-------|
| `Pattern<T, TData>` | `Pattern` class | Pattern for matching sequences |
| `PatternNode<T, TData>` | `PatternNode` class | Node in pattern graph |
| `Matcher<T, TData>` | `Matcher` class | Pattern matching engine |
| `Match<T, TData>` | `Match` class | Match result |
| `Group<T>` | `Group` class | Captured group |
| `Constraint<T, TData>` | `Constraint` class | Matching constraint |
| `Quantifier` | `Quantifier` class | Quantifier (*, +, ?, {n,m}) |
| `Alternation<T, TData>` | `Alternation` class | Alternative patterns (|) |

## Object Model

| C# Interface | JavaScript Implementation | Notes |
|-------------|---------------------------|-------|
| `IFreezable` | `Freezable` mixin/base class | Immutability pattern using `Object.freeze()` |
| `ICloneable<T>` | `clone()` method | Deep cloning |
| `IValueEquatable<T>` | `equals(other)` method | Value-based equality |
| `IComparable<T>` | `compareTo(other)` method | Comparison |

## Extensions

| C# Extension | JavaScript Implementation | Notes |
|-------------|---------------------------|-------|
| LINQ methods | Array methods + custom utilities | `map`, `filter`, `reduce`, `find`, `some`, `every` |
| `ToDictionary` | `Map` or plain object | ES6 Map preferred |
| `Zip` | Custom `zip()` utility | Combine two arrays |
| `ToArray` | `Array.from()` | Convert iterables |

## Collections

| C# Class | JavaScript Implementation | Notes |
|---------|---------------------------|-------|
| `Dictionary<K, V>` | `Map` | ES6 Map |
| `HashSet<T>` | `Set` | ES6 Set |
| `List<T>` | `Array` | Native arrays |
| `Queue<T>` | `Array` with push/shift | Or custom Queue class |
| `Stack<T>` | `Array` with push/pop | Or custom Stack class |

## .NET Framework

| C# Feature | JavaScript Implementation | Notes |
|-----------|---------------------------|-------|
| Properties (get/set) | Getters/setters or fields | ES6 class properties |
| `out` parameters | Return object/array | Return `{success, value}` |
| Nullable types | `null` or `undefined` | Use `??` operator |
| Events | EventEmitter pattern | Node.js events or custom |
| Enums | Object with frozen properties | `Object.freeze({...})` |
| Delegates | Functions/callbacks | First-class functions |
| Generic methods | Duck typing | TypeScript for type safety |

## XML Processing

| C# Class | JavaScript Implementation | Notes |
|---------|---------------------------|-------|
| `XmlReader` | `fast-xml-parser` | npm package for XML parsing |
| `XmlWriter` | `xml-builder` or manual | JSON to XML conversion |
| `XDocument` | `fast-xml-parser` | Parse to object structure |

## Immutability Pattern

JavaScript implementation using `Object.freeze()`:

```javascript
class Freezable {
  constructor() {
    this._frozen = false;
  }

  get isFrozen() {
    return this._frozen;
  }

  freeze() {
    if (this._frozen) return;
    this._frozen = true;
    Object.freeze(this);
  }

  checkFrozen() {
    if (this._frozen) {
      throw new Error('Object is frozen and cannot be modified');
    }
  }
}
```

## Error Handling

| C# Exception | JavaScript Error | Notes |
|-------------|------------------|-------|
| `ArgumentException` | `TypeError` or `Error` | Use appropriate error type |
| `InvalidOperationException` | `Error` | Custom error classes |
| `NotImplementedException` | `Error` | Throw with message |
| `NullReferenceException` | Check for null/undefined | Use `??` and `?.` operators |

## Type System

For better type safety, consider using TypeScript. The JavaScript implementation can be gradually typed.

```javascript
// JavaScript with JSDoc
/**
 * @template T
 * @param {T[]} array
 * @returns {T|undefined}
 */
function first(array) {
  return array[0];
}
```

## Testing

| C# Framework | JavaScript Framework | Notes |
|-------------|---------------------|-------|
| NUnit/xUnit | Node.js test runner | Built-in, no dependencies |
| MSTest | Mocha/Jest | Alternative test frameworks |

## Package Management

| C# Tool | JavaScript Tool | Notes |
|---------|----------------|-------|
| NuGet | npm | Package manager |
| `.csproj` | `package.json` | Project configuration |
| `.sln` | Monorepo tools | Optional for multi-package |
