import { ShapeNode } from '../annotations/ShapeNode';
import { Pattern } from './Pattern';
import { Constraint, GroupConstraint } from './Constraint';
import { Match, GroupCapture } from './Match';
import { Range } from '../utils/Range';
import { Direction } from '../utils/Direction';
import { FeatureStruct } from '../features/FeatureStruct';

/**
 * State in the pattern matching state machine.
 */
class MatchState<T> {
  input: T;
  constraintIndex: number;
  currentNode: ShapeNode | null;
  matchedNodes: ShapeNode[];
  quantifierCount: number;
  groups: Map<string, GroupCapture>;
  variableBindings: Map<string, any>;

  constructor(
    input: T,
    constraintIndex: number = 0,
    currentNode: ShapeNode | null = null,
    matchedNodes: ShapeNode[] = [],
    quantifierCount: number = 0,
    groups: Map<string, GroupCapture> = new Map(),
    variableBindings: Map<string, any> = new Map()
  ) {
    this.input = input;
    this.constraintIndex = constraintIndex;
    this.currentNode = currentNode;
    this.matchedNodes = matchedNodes;
    this.quantifierCount = quantifierCount;
    this.groups = groups;
    this.variableBindings = variableBindings;
  }

  clone(): MatchState<T> {
    return new MatchState(
      this.input,
      this.constraintIndex,
      this.currentNode,
      [...this.matchedNodes],
      this.quantifierCount,
      new Map(this.groups),
      new Map(this.variableBindings)
    );
  }
}

/**
 * Matcher implements a backtracking pattern matching algorithm.
 * Uses a state machine approach to find all possible matches.
 */
export class Matcher<T> {
  private _pattern: Pattern<T>;
  private _direction: string;

  constructor(pattern: Pattern<T>, direction: string = Direction.LeftToRight) {
    this._pattern = pattern;
    this._direction = direction;
  }

  /**
   * Matches the pattern against the input starting at the given node.
   * @param input - The input to match
   * @param startNode - The node to start matching from
   * @returns An iterator of all possible matches
   */
  *match(input: T, startNode: ShapeNode): IterableIterator<Match<T>> {
    const initialState = new MatchState<T>(input, 0, startNode);
    yield* this._matchRecursive(initialState);
  }

  /**
   * Recursive backtracking matcher.
   */
  private *_matchRecursive(state: MatchState<T>): IterableIterator<Match<T>> {
    const constraints = this._pattern.constraints;

    // Base case: all constraints matched
    if (state.constraintIndex >= constraints.length) {
      if (state.matchedNodes.length > 0) {
        const match = new Match(
          state.input,
          new Range(state.matchedNodes[0], state.matchedNodes[state.matchedNodes.length - 1])
        );
        // Add captured groups
        for (const [name, capture] of state.groups) {
          match.addGroup(name, capture);
        }
        // Add variable bindings
        for (const [name, value] of state.variableBindings) {
          match.setVariable(name, value);
        }
        yield match;
      }
      return;
    }

    const constraint = constraints[state.constraintIndex];

    // Handle group constraints
    if (constraint instanceof GroupConstraint) {
      yield* this._matchGroup(state, constraint);
      return;
    }

    // Handle quantified constraints
    const quantifier = constraint.quantifier;

    // Try to match the constraint at the current node
    if (state.currentNode !== null && constraint.isMatch(state.currentNode, this._direction)) {
      // Match succeeded - try to consume this node
      const newState = state.clone();
      newState.matchedNodes.push(state.currentNode);
      newState.quantifierCount++;
      newState.currentNode = this._nextNode(state.currentNode);

      // Check if we can match more with this constraint
      if (quantifier.allowsMore(newState.quantifierCount)) {
        // Try to match more occurrences
        if (this._pattern.isGreedy) {
          // Greedy: try to match more first
          yield* this._matchRecursive(newState);
        }
      }

      // Check if we satisfied the quantifier and can move to next constraint
      if (quantifier.isSatisfied(newState.quantifierCount)) {
        const nextState = newState.clone();
        nextState.constraintIndex++;
        nextState.quantifierCount = 0;
        yield* this._matchRecursive(nextState);
      }

      // Non-greedy: try to match more after trying to advance
      if (!this._pattern.isGreedy && quantifier.allowsMore(newState.quantifierCount)) {
        yield* this._matchRecursive(newState);
      }
    }

    // Try to skip this constraint if quantifier allows zero matches
    if (quantifier.allowsZero && state.quantifierCount === 0) {
      const skipState = state.clone();
      skipState.constraintIndex++;
      skipState.quantifierCount = 0;
      yield* this._matchRecursive(skipState);
    }

    // If we have some matches and quantifier is satisfied, we can also try to advance
    if (state.quantifierCount > 0 && quantifier.isSatisfied(state.quantifierCount)) {
      const advanceState = state.clone();
      advanceState.constraintIndex++;
      advanceState.quantifierCount = 0;
      yield* this._matchRecursive(advanceState);
    }
  }

  /**
   * Handles matching a group constraint.
   */
  private *_matchGroup(state: MatchState<T>, group: GroupConstraint): IterableIterator<Match<T>> {
    // Create a sub-pattern for the group
    const subPattern = new Pattern(group.constraints, '', this._pattern.isGreedy);
    const subMatcher = new Matcher(subPattern, this._direction);

    const quantifier = group.quantifier;
    let count = 0;

    // Try to match the group with its quantifier
    yield* this._matchGroupRecursive(state, group, subMatcher, count);
  }

  /**
   * Recursively matches a group with quantification.
   */
  private *_matchGroupRecursive(
    state: MatchState<T>,
    group: GroupConstraint,
    subMatcher: Matcher<T>,
    count: number
  ): IterableIterator<Match<T>> {
    const quantifier = group.quantifier;

    // Base case: satisfied and no more matches allowed
    if (quantifier.isSatisfied(count) && !quantifier.allowsMore(count)) {
      const nextState = state.clone();
      nextState.constraintIndex++;
      nextState.quantifierCount = 0;
      yield* this._matchRecursive(nextState);
      return;
    }

    // Try to match the group at current position
    if (state.currentNode !== null) {
      for (const subMatch of subMatcher.match(state.input, state.currentNode)) {
        const newState = state.clone();
        newState.matchedNodes.push(...subMatch.getMatchedNodes());
        newState.currentNode = this._nextNode(subMatch.end);

        const newCount = count + 1;

        // If satisfied, try to advance to next constraint
        if (quantifier.isSatisfied(newCount)) {
          const advanceState = newState.clone();
          advanceState.constraintIndex++;
          advanceState.quantifierCount = 0;
          yield* this._matchRecursive(advanceState);
        }

        // If more matches allowed, try to match again
        if (quantifier.allowsMore(newCount)) {
          yield* this._matchGroupRecursive(newState, group, subMatcher, newCount);
        }
      }
    }

    // If quantifier allows zero and we haven't matched anything yet
    if (quantifier.allowsZero && count === 0) {
      const skipState = state.clone();
      skipState.constraintIndex++;
      skipState.quantifierCount = 0;
      yield* this._matchRecursive(skipState);
    }
  }

  /**
   * Gets the next node in the matching direction.
   */
  private _nextNode(node: ShapeNode): ShapeNode | null {
    return this._direction === Direction.LeftToRight ? node.next : node.prev;
  }
}
