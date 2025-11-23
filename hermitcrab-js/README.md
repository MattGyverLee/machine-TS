# HermitCrab.js

A JavaScript/Node.js implementation of HermitCrab - a rule-based morphological and phonological parser for natural language processing.

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
│   ├── annotations/    - Shape and annotation system
│   ├── features/       - Feature structures and unification
│   ├── morphology/     - Morphemes, allomorphs, lexicon
│   ├── rules/          - Phonological and morphological rules
│   ├── core/           - Main classes (Language, Morpher, Stratum, Word)
│   ├── matching/       - Pattern matching engine
│   ├── xml/            - XML configuration loader
│   └── index.js        - Main entry point
├── test/               - Test suite
└── examples/           - Usage examples

```

## Architecture

HermitCrab processes words through a multi-layered pipeline:

```
Surface Form → Analysis → Underlying Form
Underlying Form → Synthesis → Surface Form
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT

## Original Implementation

This is a JavaScript port of the C# HermitCrab library from [Machine.NET](https://github.com/sillsdev/machine).
