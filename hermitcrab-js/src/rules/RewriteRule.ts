import { PhonologicalRule, ApplicationMode, RuleDirection } from './PhonologicalRule';
import { Pattern } from '../patterns/Pattern';
import { Shape } from '../annotations/Shape';
import { ShapeNode } from '../annotations/ShapeNode';
import { Word } from '../morphology/Word';
import { Direction } from '../utils/Direction';
import { Constraint } from '../patterns/Constraint';

/**
 * Rewrite rule transforms matched patterns in phonological shapes.
 * Format: A → B / C _ D
 * Where A is the target pattern, B is the replacement,
 * C is the left environment, and D is the right environment.
 */
export class RewriteRule extends PhonologicalRule {
  private _targetPattern: Pattern<Shape>;
  private _replacement: Constraint[];
  private _leftEnvironment: Pattern<Shape> | null;
  private _rightEnvironment: Pattern<Shape> | null;

  /**
   * Creates a new rewrite rule.
   * @param name - The name of this rule
   * @param targetPattern - The pattern to match and replace
   * @param replacement - The replacement constraints
   * @param leftEnvironment - Optional left context pattern
   * @param rightEnvironment - Optional right context pattern
   * @param applicationMode - How to apply this rule
   * @param direction - Direction to apply rule
   */
  constructor(
    name: string,
    targetPattern: Pattern<Shape>,
    replacement: Constraint[],
    leftEnvironment: Pattern<Shape> | null = null,
    rightEnvironment: Pattern<Shape> | null = null,
    applicationMode: ApplicationMode = ApplicationMode.Iterative,
    direction: RuleDirection = RuleDirection.LeftToRight
  ) {
    super(name, applicationMode, direction);
    this._targetPattern = targetPattern;
    this._replacement = replacement;
    this._leftEnvironment = leftEnvironment;
    this._rightEnvironment = rightEnvironment;
  }

  /**
   * Gets the target pattern.
   */
  get targetPattern(): Pattern<Shape> {
    return this._targetPattern;
  }

  /**
   * Gets the replacement constraints.
   */
  get replacement(): Constraint[] {
    return this._replacement;
  }

  /**
   * Gets the left environment pattern.
   */
  get leftEnvironment(): Pattern<Shape> | null {
    return this._leftEnvironment;
  }

  /**
   * Gets the right environment pattern.
   */
  get rightEnvironment(): Pattern<Shape> | null {
    return this._rightEnvironment;
  }

  /**
   * Applies this rule to a word.
   */
  *apply(word: Word): IterableIterator<Word> {
    for (const newShape of this.applyToShape(word.shape)) {
      const newWord = word.clone();
      // Replace the shape
      newWord.shape.clear();
      for (const node of this._getNodes(newShape)) {
        newWord.shape.add(node.clone());
      }
      yield newWord;
    }
  }

  /**
   * Applies this rule to a shape.
   */
  *applyToShape(shape: Shape): IterableIterator<Shape> {
    if (this.applicationMode === ApplicationMode.Iterative) {
      yield* this._applyIteratively(shape);
    } else {
      yield* this._applySimultaneously(shape);
    }
  }

  /**
   * Applies rule iteratively until no more matches.
   */
  private *_applyIteratively(shape: Shape): IterableIterator<Shape> {
    let currentShape = shape.clone();
    let applied = false;

    do {
      applied = false;
      const dir = this.direction === RuleDirection.LeftToRight
        ? Direction.LeftToRight
        : Direction.RightToLeft;

      // Find first match
      for (const match of this._targetPattern.matches(currentShape, dir)) {
        // Check environments
        if (!this._checkEnvironments(currentShape, match.start, match.end, dir)) {
          continue;
        }

        // Apply the replacement
        const newShape = this._applyReplacement(currentShape, match.start, match.end);
        currentShape = newShape;
        applied = true;
        break; // Only apply once per iteration
      }
    } while (applied);

    yield currentShape;
  }

  /**
   * Applies rule simultaneously to all matches.
   */
  private *_applySimultaneously(shape: Shape): IterableIterator<Shape> {
    const dir = this.direction === RuleDirection.LeftToRight
      ? Direction.LeftToRight
      : Direction.RightToLeft;

    const matches: Array<{ start: ShapeNode; end: ShapeNode }> = [];

    // Collect all matches
    for (const match of this._targetPattern.matches(shape, dir)) {
      if (this._checkEnvironments(shape, match.start, match.end, dir)) {
        matches.push({ start: match.start, end: match.end });
      }
    }

    if (matches.length === 0) {
      yield shape.clone();
      return;
    }

    // Apply all replacements simultaneously
    let newShape = shape.clone();
    for (const match of matches) {
      newShape = this._applyReplacement(newShape, match.start, match.end);
    }

    yield newShape;
  }

  /**
   * Checks if left and right environments match.
   */
  private _checkEnvironments(
    shape: Shape,
    targetStart: ShapeNode,
    targetEnd: ShapeNode,
    dir: string
  ): boolean {
    // Check left environment
    if (this._leftEnvironment) {
      const leftNode = targetStart.prev;
      if (!leftNode) return false;

      const leftMatch = this._leftEnvironment.isMatch(shape, dir);
      if (!leftMatch || leftMatch.end !== targetStart.prev) {
        return false;
      }
    }

    // Check right environment
    if (this._rightEnvironment) {
      const rightNode = targetEnd.next;
      if (!rightNode) return false;

      const rightMatch = this._rightEnvironment.isMatch(shape, dir);
      if (!rightMatch || rightMatch.start !== targetEnd.next) {
        return false;
      }
    }

    return true;
  }

  /**
   * Applies the replacement to the matched segment.
   */
  private _applyReplacement(shape: Shape, start: ShapeNode, end: ShapeNode): Shape {
    const newShape = shape.clone();

    // Find corresponding nodes in cloned shape
    let clonedStart: ShapeNode | null = null;
    let clonedEnd: ShapeNode | null = null;
    let originalCurrent = shape.first;
    let clonedCurrent = newShape.first;

    while (originalCurrent && clonedCurrent) {
      if (originalCurrent === start) clonedStart = clonedCurrent;
      if (originalCurrent === end) clonedEnd = clonedCurrent;
      originalCurrent = originalCurrent.next;
      clonedCurrent = clonedCurrent.next;
    }

    if (!clonedStart || !clonedEnd) return newShape;

    // Remove matched nodes
    let current: ShapeNode | null = clonedStart;
    const nodesToRemove: ShapeNode[] = [];
    while (current) {
      nodesToRemove.push(current);
      if (current === clonedEnd) break;
      current = current.next;
    }

    const insertBefore = clonedEnd.next;
    for (const node of nodesToRemove) {
      newShape.remove(node);
    }

    // Insert replacement nodes
    // For now, this is a placeholder - actual replacement would create new nodes
    // based on the replacement constraints
    // TODO: Implement actual node creation from constraints

    return newShape;
  }

  /**
   * Gets all nodes from a shape.
   */
  private _getNodes(shape: Shape): ShapeNode[] {
    const nodes: ShapeNode[] = [];
    let current = shape.first;
    while (current) {
      nodes.push(current);
      current = current.next;
    }
    return nodes;
  }

  canApply(word: Word): boolean {
    const dir = this.direction === RuleDirection.LeftToRight
      ? Direction.LeftToRight
      : Direction.RightToLeft;

    for (const match of this._targetPattern.matches(word.shape, dir)) {
      if (this._checkEnvironments(word.shape, match.start, match.end, dir)) {
        return true;
      }
    }
    return false;
  }

  getDescription(): string {
    let desc = `${this._targetPattern} → [${this._replacement.map(c => c.toString()).join(', ')}]`;

    if (this._leftEnvironment || this._rightEnvironment) {
      const left = this._leftEnvironment ? this._leftEnvironment.toString() : '';
      const right = this._rightEnvironment ? this._rightEnvironment.toString() : '';
      desc += ` / ${left} _ ${right}`;
    }

    return desc;
  }
}
