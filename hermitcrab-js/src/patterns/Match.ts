import { ShapeNode } from '../annotations/ShapeNode';
import { Range } from '../utils/Range';

/**
 * Represents a successful pattern match.
 * Contains information about the matched nodes and their positions.
 */
export class Match<T> {
  private _input: T;
  private _range: Range<ShapeNode>;
  private _groups: Map<string, GroupCapture>;
  private _variableValues: Map<string, any>;

  /**
   * Creates a new match.
   * @param input - The input that was matched
   * @param range - The range of nodes that matched
   */
  constructor(input: T, range: Range<ShapeNode>) {
    this._input = input;
    this._range = range;
    this._groups = new Map();
    this._variableValues = new Map();
  }

  /**
   * Gets the input that was matched.
   */
  get input(): T {
    return this._input;
  }

  /**
   * Gets the range of matched nodes.
   */
  get range(): Range<ShapeNode> {
    return this._range;
  }

  /**
   * Gets the start node of the match.
   */
  get start(): ShapeNode {
    return this._range.start;
  }

  /**
   * Gets the end node of the match.
   */
  get end(): ShapeNode {
    return this._range.end;
  }

  /**
   * Gets all matched nodes.
   */
  getMatchedNodes(): ShapeNode[] {
    const nodes: ShapeNode[] = [];
    let current: ShapeNode | null = this._range.start;
    while (current !== null) {
      nodes.push(current);
      if (current === this._range.end) break;
      current = current.next;
    }
    return nodes;
  }

  /**
   * Gets captured groups.
   */
  get groups(): Map<string, GroupCapture> {
    return this._groups;
  }

  /**
   * Adds a captured group.
   */
  addGroup(name: string, capture: GroupCapture): void {
    this._groups.set(name, capture);
  }

  /**
   * Gets a captured group by name.
   */
  getGroup(name: string): GroupCapture | undefined {
    return this._groups.get(name);
  }

  /**
   * Gets variable values from the match.
   */
  get variableValues(): Map<string, any> {
    return this._variableValues;
  }

  /**
   * Sets a variable value.
   */
  setVariable(name: string, value: any): void {
    this._variableValues.set(name, value);
  }

  /**
   * Gets a variable value.
   */
  getVariable(name: string): any {
    return this._variableValues.get(name);
  }

  /**
   * Checks if the match is successful.
   */
  get success(): boolean {
    return this._range.start !== null && this._range.end !== null;
  }

  toString(): string {
    return `Match[${this.getMatchedNodes().map(n => n.toString()).join('')}]`;
  }
}

/**
 * Represents a captured group in a pattern match.
 */
export class GroupCapture {
  private _range: Range<ShapeNode>;
  private _name: string;

  constructor(name: string, range: Range<ShapeNode>) {
    this._name = name;
    this._range = range;
  }

  get name(): string {
    return this._name;
  }

  get range(): Range<ShapeNode> {
    return this._range;
  }

  get start(): ShapeNode {
    return this._range.start;
  }

  get end(): ShapeNode {
    return this._range.end;
  }

  /**
   * Gets all nodes in this capture.
   */
  getNodes(): ShapeNode[] {
    const nodes: ShapeNode[] = [];
    let current: ShapeNode | null = this._range.start;
    while (current !== null) {
      nodes.push(current);
      if (current === this._range.end) break;
      current = current.next;
    }
    return nodes;
  }

  toString(): string {
    return `${this._name}[${this.getNodes().map(n => n.toString()).join('')}]`;
  }
}
