/**
 * Direction enumeration for traversing data structures.
 */
export const Direction = Object.freeze({
  LeftToRight: 'LeftToRight',
  RightToLeft: 'RightToLeft',
});

/**
 * Gets the opposite direction.
 * @param {string} direction - The direction
 * @returns {string} The opposite direction
 */
export function oppositeDirection(direction) {
  return direction === Direction.LeftToRight ? Direction.RightToLeft : Direction.LeftToRight;
}
