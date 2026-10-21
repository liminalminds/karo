/** Short id for rows and items. Collisions are irrelevant at this scale. */
export function newId() {
  return Math.random().toString(36).slice(2);
}