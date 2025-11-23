import { PhonologicalRule, ApplicationMode, RuleDirection } from './PhonologicalRule';
import { Pattern } from '../patterns/Pattern';
import { Shape } from '../annotations/Shape';
import { ShapeNode } from '../annotations/ShapeNode';
import { Word } from '../morphology/Word';
import { Direction } from '../utils/Direction';

/**
 * Metathesis rule swaps the positions of two matched patterns.
 * Format: A B → B A / C _ D
 * Useful for modeling sound transpositions like /ask/ → /aks/
 */
export class MetathesisRule extends PhonologicalRule {
  private _pattern1: Pattern<Shape>;
  private _pattern2: Pattern<Shape>;
  private _leftEnvironment: Pattern<Shape> | null;
  private _rightEnvironment: Pattern<Shape> | null;

  /**
   * Creates a new metathesis rule.
   * @param name - The name of this rule
   * @param pattern1 - The first pattern to swap
   * @param pattern2 - The second pattern to swap
   * @param leftEnvironment - Optional left context pattern
   * @param rightEnvironment - Optional right context pattern
   * @param applicationMode - How to apply this rule
   * @param direction - Direction to apply rule
   */
  constructor(
    name: string,
    pattern1: Pattern<Shape>,
    pattern2: Pattern<Shape>,
    leftEnvironment: Pattern<Shape> | null = null,
    rightEnvironment: Pattern<Shape> | null = null,
    applicationMode: ApplicationMode = ApplicationMode.Iterative,
    direction: RuleDirection = RuleDirection.LeftToRight
  ) {
    super(name, applicationMode, direction);
    this._pattern1 = pattern1;
    this._pattern2 = pattern2;
    this._leftEnvironment = leftEnvironment;
    this._rightEnvironment = rightEnvironment;
  }

  /**
   * Gets the first pattern.
   */
  get pattern1(): Pattern<Shape> {
    return this._pattern1;
  }

  /**
   * Gets the second pattern.
   */
  get pattern2(): Pattern<Shape> {
    return this._pattern2;
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

      // Try to find consecutive matches of pattern1 followed by pattern2
      let current = dir === Direction.LeftToRight ? currentShape.first : currentShape.last;

      while (current) {
        // Try to match pattern1 at current position
        for (const match1 of this._pattern1.match(currentShape, current, dir)) {
          // Try to match pattern2 right after pattern1
          const nextNode = match1.end.next;
          if (!nextNode) continue;

          for (const match2 of this._pattern2.match(currentShape, nextNode, dir)) {
            // Check if pattern2 immediately follows pattern1
            if (match2.start !== nextNode) continue;

            // Check environments
            if (!this._checkEnvironments(currentShape, match1.start, match2.end, dir)) {
              continue;
            }

            // Perform the metathesis
            currentShape = this._performMetathesis(
              currentShape,
              match1.start,
              match1.end,
              match2.start,
              match2.end
            );
            applied = true;
            break;
          }

          if (applied) break;
        }

        if (applied) break;
        current = dir === Direction.LeftToRight ? current.next : current.prev;
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

    const matches: Array<{
      start1: ShapeNode;
      end1: ShapeNode;
      start2: ShapeNode;
      end2: ShapeNode;
    }> = [];

    // Collect all matches
    let current = dir === Direction.LeftToRight ? shape.first : shape.last;

    while (current) {
      for (const match1 of this._pattern1.match(shape, current, dir)) {
        const nextNode = match1.end.next;
        if (!nextNode) continue;

        for (const match2 of this._pattern2.match(shape, nextNode, dir)) {
          if (match2.start !== nextNode) continue;

          if (this._checkEnvironments(shape, match1.start, match2.end, dir)) {
            matches.push({
              start1: match1.start,
              end1: match1.end,
              start2: match2.start,
              end2: match2.end
            });
          }
        }
      }

      current = dir === Direction.LeftToRight ? current.next : current.prev;
    }

    if (matches.length === 0) {
      yield shape.clone();
      return;
    }

    // Apply all metatheses simultaneously
    let newShape = shape.clone();
    for (const match of matches) {
      newShape = this._performMetathesis(
        newShape,
        match.start1,
        match.end1,
        match.start2,
        match.end2
      );
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
   * Performs the metathesis by swapping two sequences of nodes.
   */
  private _performMetathesis(
    shape: Shape,
    start1: ShapeNode,
    end1: ShapeNode,
    start2: ShapeNode,
    end2: ShapeNode
  ): Shape {
    const newShape = shape.clone();

    // Find corresponding nodes in cloned shape
    const nodeMap = new Map<ShapeNode, ShapeNode>();
    let originalCurrent = shape.first;
    let clonedCurrent = newShape.first;

    while (originalCurrent && clonedCurrent) {
      nodeMap.set(originalCurrent, clonedCurrent);
      originalCurrent = originalCurrent.next;
      clonedCurrent = clonedCurrent.next;
    }

    const clonedStart1 = nodeMap.get(start1);
    const clonedEnd1 = nodeMap.get(end1);
    const clonedStart2 = nodeMap.get(start2);
    const clonedEnd2 = nodeMap.get(end2);

    if (!clonedStart1 || !clonedEnd1 || !clonedStart2 || !clonedEnd2) {
      return newShape;
    }

    // Collect nodes from both sequences
    const seq1Nodes: ShapeNode[] = [];
    let current: ShapeNode | null = clonedStart1;
    while (current) {
      seq1Nodes.push(current);
      if (current === clonedEnd1) break;
      current = current.next;
    }

    const seq2Nodes: ShapeNode[] = [];
    current = clonedStart2;
    while (current) {
      seq2Nodes.push(current);
      if (current === clonedEnd2) break;
      current = current.next;
    }

    // Remove both sequences
    for (const node of [...seq1Nodes, ...seq2Nodes]) {
      newShape.remove(node);
    }

    // Re-insert in swapped order
    const insertPoint = clonedStart1.prev;

    // Insert sequence 2 first (at position of sequence 1)
    for (const node of seq2Nodes) {
      if (insertPoint) {
        newShape.addAfter(insertPoint, node);
      } else {
        newShape.addFirst(node);
      }
    }

    // Then insert sequence 1 (at position of sequence 2)
    const newInsertPoint = seq2Nodes[seq2Nodes.length - 1];
    for (const node of seq1Nodes) {
      newShape.addAfter(newInsertPoint, node);
    }

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

    let current = dir === Direction.LeftToRight ? word.shape.first : word.shape.last;

    while (current) {
      for (const match1 of this._pattern1.match(word.shape, current, dir)) {
        const nextNode = match1.end.next;
        if (!nextNode) continue;

        for (const match2 of this._pattern2.match(word.shape, nextNode, dir)) {
          if (match2.start === nextNode &&
            this._checkEnvironments(word.shape, match1.start, match2.end, dir)) {
            return true;
          }
        }
      }

      current = dir === Direction.LeftToRight ? current.next : current.prev;
    }

    return false;
  }

  getDescription(): string {
    let desc = `${this._pattern1} ${this._pattern2} → ${this._pattern2} ${this._pattern1}`;

    if (this._leftEnvironment || this._rightEnvironment) {
      const left = this._leftEnvironment ? this._leftEnvironment.toString() : '';
      const right = this._rightEnvironment ? this._rightEnvironment.toString() : '';
      desc += ` / ${left} _ ${right}`;
    }

    return desc;
  }
}
