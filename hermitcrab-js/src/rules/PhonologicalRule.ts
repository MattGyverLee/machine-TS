import { Shape } from '../annotations/Shape';
import { ShapeNode } from '../annotations/ShapeNode';
import { Word } from '../morphology/Word';

/**
 * Application mode for phonological rules.
 */
export enum ApplicationMode {
  /**
   * Apply rule iteratively until no more matches.
   */
  Iterative = 'iterative',

  /**
   * Apply rule simultaneously to all matches.
   */
  Simultaneous = 'simultaneous'
}

/**
 * Direction for rule application.
 */
export enum RuleDirection {
  /**
   * Apply rule from left to right.
   */
  LeftToRight = 'left-to-right',

  /**
   * Apply rule from right to left.
   */
  RightToLeft = 'right-to-left'
}

/**
 * Base class for all phonological rules.
 * Phonological rules transform phonological shapes based on patterns.
 */
export abstract class PhonologicalRule {
  private _name: string;
  private _applicationMode: ApplicationMode;
  private _direction: RuleDirection;
  private _blockable: boolean;

  /**
   * Creates a new phonological rule.
   * @param name - The name of this rule
   * @param applicationMode - How to apply this rule (default iterative)
   * @param direction - Direction to apply rule (default left-to-right)
   * @param blockable - Whether this rule can be blocked (default true)
   */
  constructor(
    name: string,
    applicationMode: ApplicationMode = ApplicationMode.Iterative,
    direction: RuleDirection = RuleDirection.LeftToRight,
    blockable: boolean = true
  ) {
    this._name = name;
    this._applicationMode = applicationMode;
    this._direction = direction;
    this._blockable = blockable;
  }

  /**
   * Gets the name of this rule.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the application mode.
   */
  get applicationMode(): ApplicationMode {
    return this._applicationMode;
  }

  /**
   * Gets the direction for rule application.
   */
  get direction(): RuleDirection {
    return this._direction;
  }

  /**
   * Gets whether this rule can be blocked.
   */
  get blockable(): boolean {
    return this._blockable;
  }

  /**
   * Applies this rule to a word.
   * @param word - The word to transform
   * @returns An iterator of transformed words (may produce multiple results)
   */
  abstract apply(word: Word): IterableIterator<Word>;

  /**
   * Applies this rule to a shape.
   * @param shape - The shape to transform
   * @returns An iterator of transformed shapes
   */
  abstract applyToShape(shape: Shape): IterableIterator<Shape>;

  /**
   * Checks if this rule can apply to a word.
   * @param word - The word to check
   * @returns True if the rule can apply
   */
  abstract canApply(word: Word): boolean;

  /**
   * Gets a description of what this rule does.
   */
  abstract getDescription(): string;

  toString(): string {
    return this._name || this.getDescription();
  }
}
