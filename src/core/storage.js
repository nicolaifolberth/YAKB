// Verantwortlich für Persistenz (heute localStorage, morgen REST/SQLite)
const KEYS = { columns: "kanban.columns.v2", cards: "kanban.cards.v2" };

export function loadColumns() {
  try { return JSON.parse(localStorage.getItem(KEYS.columns)) ?? []; }
  catch { return []; }
}
export function saveColumns(cols) {
  localStorage.setItem(KEYS.columns, JSON.stringify(cols));
}

export function loadCards() {
  try {
    const v2 = localStorage.getItem(KEYS.cards);
    if (v2) return JSON.parse(v2) ?? [];
    const v1 = localStorage.getItem("kanban.board.v1");
    if (v1) { localStorage.setItem(KEYS.cards, v1); return JSON.parse(v1) ?? []; }
    return [];
  } catch { return []; }
}
export function saveCards(cards) {
  localStorage.setItem(KEYS.cards, JSON.stringify(cards));
}
