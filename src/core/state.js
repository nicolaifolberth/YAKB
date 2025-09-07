import { loadColumns, loadCards, saveCards, saveColumns } from "./storage.js";

export const state = {
  columns: loadColumns(),
  cards: loadCards(),
  draggedCardId: null,
  draggedColId: null,
  editingId: null,
};

export function migrate() {
  if (state.columns.length === 0) {
    state.columns = [
      { id: "todo",  name: "To Do" },
      { id: "doing", name: "Doing" },
      { id: "done",  name: "Done" },
    ];
    saveColumns(state.columns);
  }
  const valid = new Set(state.columns.map(c => c.id));
  let changed = false;
  for (const card of state.cards) {
    if (!valid.has(card.col)) { card.col = state.columns[0].id; changed = true; }
  }
  if (changed) saveCards(state.cards);
}
