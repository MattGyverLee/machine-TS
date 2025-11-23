# HermitCrab TypeScript

A TypeScript/JavaScript implementation of HermitCrab - a rule-based morphological and phonological parser for natural language processing.

## Overview

HermitCrab is a library for processing resource-poor languages using an item-and-process morphological model. It provides:

- **Morphological analysis and synthesis** - Breaking down words into morphemes and reconstructing words from morphemes
- **Phonological rule application** - Applying rewrite rules, metathesis, and feature-based phonological transformations
- **Feature-based unification** - Using phonological and syntactic feature systems for constraint matching
- **Multi-stratal processing** - Processing words through multiple linguistic strata (abstract morphophonemic → surface)

## Installation

```bash
npm install hermitcrab
```

## Usage

```javascript
import { Morpher, XmlLanguageLoader } from 'hermitcrab';

// Load language configuration from XML
const language = await XmlLanguageLoader.load('language-config.xml');
const morpher = new Morpher(language);

// Parse a word (morphological analysis)
const analyses = morpher.parseWord('walked');
for (const analysis of analyses) {
  console.log(analysis.toString());
}

// Generate a word (morphological synthesis)
const words = morpher.generateWord(rootEntry, {
  tense: 'past',
  person: '3sg'
});
```

## Project Structure

```
hermitcrab-js/
├── src/
│   ├── annotations/    - Shape and annotation system (Annotation, AnnotationList, Shape, ShapeNode)
│   ├── features/       - Feature structures and unification (Feature, FeatureStruct, FeatureValue, FeatureSystem)
│   ├── morphology/     - Morphemes, allomorphs, lexicon (Morpheme, Allomorph, LexEntry, Word, AffixTemplate)
│   ├── rules/          - Phonological and morphological rules (RewriteRule, MetathesisRule, AffixProcessRule)
│   ├── core/           - Main classes (Language, Morpher, Stratum, CharacterDefinitionTable, HCFeatureSystem)
│   ├── patterns/       - Pattern matching engine (Pattern, Matcher, Constraint, Quantifier)
│   ├── utils/          - Utilities (Direction, Freezable, DoublyLinkedList, Range)
│   └── index.ts        - Main entry point
├── dist/               - Compiled JavaScript output
├── test/               - Test suite (TODO)
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

HermitCrab processes words through a multi-layered pipeline:

```
Surface Form → Analysis → Underlying Form
Underlying Form → Synthesis → Surface Form
```

## Implementation Status

### ✅ Completed Components

- **Core Infrastructure**
  - Feature system with unification
  - Annotation hierarchies over phonological shapes
  - Sparse ordering algorithm for O(1) shape insertion
  - Freezable objects with hash codes

- **Phonological System**
  - Shape and ShapeNode for phonological representations
  - Character definition tables with Unicode NFD normalization
  - Natural class definitions
  - Pattern matching engine with backtracking
  - RewriteRule (A → B / C _ D)
  - MetathesisRule (A B → B A)

- **Morphological System**
  - Morpheme and Allomorph classes
  - Lexical entries and families
  - Root allomorphs with pattern detection
  - Stem names with feature-based matching
  - MPR (Morpheme Property Realization) features
  - Word class for analysis tracking
  - AffixProcessRule (prefix, suffix, infix, circumfix)
  - CompoundingRule
  - AffixTemplate system for ordered affixation

- **Multi-Stratal Architecture**
  - Stratum class for linguistic layers
  - Language class for complete language definition
  - Morpher class for analysis and synthesis

- **Pattern Matching**
  - Constraint-based pattern matching
  - Quantifiers (?, *, +, {n,m})
  - Group captures and variable bindings

### 🚧 In Progress

- TypeScript type annotations (strict mode compliance)
- Complete rule implementations

### 📋 Planned

- XML language loader
- Trace manager for debugging
- Comprehensive test suite
- CLI tool
- Additional rule types
- Performance optimizations

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Build in watch mode
npm run build:watch

# Run tests (TODO)
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Key Algorithms

### Sparse Ordering

The Shape class implements a sophisticated sparse ordering algorithm for O(1) insertion:

```typescript
private _average(x: number, y: number): number {
  return ((x & y) + ((x ^ y) >> 1)) | 0;
}
```

### Feature Unification

Feature structures support unification with circular reference handling:

```typescript
unify(other: FeatureStruct): FeatureStruct | null {
  return this._unify(other, new Map(), new Map());
}
```

## License

MIT

## Original Implementation

This is a JavaScript port of the C# HermitCrab library from [Machine.NET](https://github.com/sillsdev/machine).
