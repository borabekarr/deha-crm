// Pure state-shape helper factored out of TaskBoard (react-doctor
// no-giant-component). No JSX, no refs, no timers — just the "move one task
// into another column at a given index" array reshuffle that onDrop,
// undoMove and syncMove each performed inline (byte-identical behavior,
// only the call sites changed).
import type { Task } from './TaskBoard';

export function reorderTask(tasks: Task[], id: string, toCol: string, insertIdx = 0): Task[] {
  const moved = { ...tasks.find((t) => t.id === id)!, col: toCol };
  const others = tasks.filter((t) => t.id !== id);
  const result: Task[] = [];
  let destSeen = 0;
  let placed = false;
  for (const t of others) {
    if (t.col === toCol) {
      if (!placed && destSeen === insertIdx) {
        result.push(moved);
        placed = true;
      }
      result.push(t);
      destSeen++;
    } else {
      result.push(t);
    }
  }
  if (!placed) result.push(moved);
  return result;
}
