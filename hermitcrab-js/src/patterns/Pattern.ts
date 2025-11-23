import { Shape } from '../annotations/Shape';
import { ShapeNode } from '../annotations/ShapeNode';
import { Constraint, GroupConstraint } from './Constraint';
import { Matcher } from './Matcher';
import { Match } from './Match';
import { Direction } from '../utils/Direction';

/**
 * Represents a pattern for matching against phonological shapes.
 * Patterns consist of a sequence of constraints that are matched
 * against nodes in a shape.
 */
export class Pattern<T> {
  private _constraints: Constraint[];
  private _name: string;
  private _isGreedy: boolean;

  /**
   * Creates a new pattern.
   * @param constraints - The constraints that make up this pattern
   * @param name - Optional name for this pattern
   * @param isGreedy - Whether to use greedy matching (default true)
   */
  constructor(constraints: Constraint[], name: string = '', isGreedy: boolean = true) {
    this._constraints = constraints;
    this._name = name;
    this._isGreedy = isGreedy;
  }

  /**
   * Gets the constraints in this pattern.
   */
  get constraints(): Constraint[] {
    return this._constraints;
  }

  /**
   * Gets the name of this pattern.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets whether this pattern uses greedy matching.
   */
  get isGreedy(): boolean {
    return this._isGreedy;
  }

  /**
   * Matches this pattern against a shape starting at a specific node.
   * @param input - The input to match
   * @param startNode - The node to start matching from
   * @param dir - The direction to match in
   * @returns An iterator of all possible matches
   */
  *match(input: T, startNode: ShapeNode, dir: string = Direction.LeftToRight): IterableIterator<Match<T>> {
    const matcher = new Matcher<T>(this, dir);
    yield* matcher.match(input, startNode);
  }

  /**
   * Finds all matches of this pattern in a shape.
   * @param shape - The shape to search
   * @param dir - The direction to search in
   * @returns An array of all matches
   */
  *matches(shape: Shape, dir: string = Direction.LeftToRight): IterableIterator<Match<Shape>> {
    const startNode = dir === Direction.LeftToRight ? shape.first : shape.last;
    if (!startNode) return;

    let current: ShapeNode | null = startNode;
    while (current !== null) {
      for (const match of this.match(shape, current, dir)) {
        yield match;
      }
      current = dir === Direction.LeftToRight ? current.next : current.prev;
    }
  }

  /**
   * Checks if this pattern matches at the start of a shape.
   * @param shape - The shape to check
   * @param dir - The direction to match in
   * @returns The first match, or null if no match
   */
  isMatch(shape: Shape, dir: string = Direction.LeftToRight): Match<Shape> | null {
    const startNode = dir === Direction.LeftToRight ? shape.first : shape.last;
    if (!startNode) return null;

    for (const match of this.match(shape, startNode, dir)) {
      return match;
    }
    return null;
  }

  /**
   * Flattens grouped constraints for easier processing.
   */
  private _flattenConstraints(constraints: Constraint[]): Constraint[] {
    const result: Constraint[] = [];
    for (const constraint of constraints) {
      if (constraint instanceof GroupConstraint) {
        // Groups are expanded during matching
        result.push(constraint);
      } else {
        result.push(constraint);
      }
    }
    return result;
  }

  toString(): string {
    const constraintStr = this._constraints.map(c => c.toString()).join('');
    return this._name ? `${this._name}:${constraintStr}` : constraintStr;
  }
}
