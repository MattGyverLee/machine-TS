import { ShapeNode } from '../annotations/ShapeNode';
import { FeatureStruct } from '../features/FeatureStruct';
import { Quantifier } from './Quantifier';

/**
 * Base class for pattern matching constraints.
 * Constraints check whether a ShapeNode matches certain criteria.
 */
export abstract class Constraint {
  protected _quantifier: Quantifier;

  /**
   * Creates a new constraint.
   * @param quantifier - The quantifier for this constraint
   */
  constructor(quantifier: Quantifier = Quantifier.One) {
    this._quantifier = quantifier;
  }

  /**
   * Gets the quantifier for this constraint.
   */
  get quantifier(): Quantifier {
    return this._quantifier;
  }

  /**
   * Checks if this constraint matches the given node.
   * @param node - The node to check
   * @param dir - The direction of matching
   * @returns True if the node matches
   */
  abstract isMatch(node: ShapeNode, dir: string): boolean;

  /**
   * Gets feature structure to unify with matched nodes (optional).
   * Returns null if no unification is needed.
   */
  getFeatureStruct(): FeatureStruct | null {
    return null;
  }

  /**
   * Checks if this is a boundary constraint.
   */
  get isBoundary(): boolean {
    return false;
  }

  abstract toString(): string;
}

/**
 * Constraint that matches any node.
 */
export class AnyConstraint extends Constraint {
  isMatch(node: ShapeNode, dir: string): boolean {
    return true;
  }

  toString(): string {
    return '.' + this._quantifier.toString();
  }
}

/**
 * Constraint that matches based on feature structure.
 */
export class FeatureConstraint extends Constraint {
  private _featureStruct: FeatureStruct;

  constructor(featureStruct: FeatureStruct, quantifier: Quantifier = Quantifier.One) {
    super(quantifier);
    this._featureStruct = featureStruct;
  }

  /**
   * Gets the feature structure for this constraint.
   */
  get featureStruct(): FeatureStruct {
    return this._featureStruct;
  }

  isMatch(node: ShapeNode, dir: string): boolean {
    if (!node.annotation) return false;
    // Check if node's feature structure subsumes or unifies with constraint FS
    return this._featureStruct.isUnifiable(node.annotation.featureStruct);
  }

  getFeatureStruct(): FeatureStruct | null {
    return this._featureStruct;
  }

  toString(): string {
    return `[${this._featureStruct.toString()}]${this._quantifier.toString()}`;
  }
}

/**
 * Constraint that matches boundary markers.
 */
export class BoundaryConstraint extends Constraint {
  private _boundaryType: string;

  constructor(boundaryType: string = '#', quantifier: Quantifier = Quantifier.One) {
    super(quantifier);
    this._boundaryType = boundaryType;
  }

  get boundaryType(): string {
    return this._boundaryType;
  }

  get isBoundary(): boolean {
    return true;
  }

  isMatch(node: ShapeNode, dir: string): boolean {
    // Check if node is a boundary of the specified type
    if (!node.annotation) return false;
    const fs = node.annotation.featureStruct;
    // Check for boundary type feature
    // Implementation depends on how boundaries are represented
    return false; // Placeholder
  }

  toString(): string {
    return this._boundaryType + this._quantifier.toString();
  }
}

/**
 * Constraint group that matches a sequence of constraints.
 */
export class GroupConstraint extends Constraint {
  private _constraints: Constraint[];

  constructor(constraints: Constraint[], quantifier: Quantifier = Quantifier.One) {
    super(quantifier);
    this._constraints = constraints;
  }

  get constraints(): Constraint[] {
    return this._constraints;
  }

  isMatch(node: ShapeNode, dir: string): boolean {
    // Groups don't match individual nodes directly
    // They are expanded during pattern matching
    throw new Error('GroupConstraint.isMatch should not be called directly');
  }

  toString(): string {
    return `(${this._constraints.map(c => c.toString()).join('')})${this._quantifier.toString()}`;
  }
}
