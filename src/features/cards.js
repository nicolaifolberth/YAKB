import { state } from "../core/state.js";
import { saveCards } from "../core/storage.js";

export function addCard({ title, desc, col }) {
  const card = {
    id: crypto.randomUUID(),
    title: (title ?? "").trim(),
    desc:  (desc ?? "").trim(),
    col: col ?? state.columns[0]?.id ?? "todo",
    archived: false,
    completedAt: null,
    created: Date.now(),
    updated: Date.now()
  };
  state.cards.unshift(card); saveCards(state.cards);
}
export function updateCard(id, patch) {
  const i = state.cards.findIndex(c=>c.id===id); if (i<0) return;
  state.cards[i] = { ...state.cards[i], ...patch, updated: Date.now() };
  saveCards(state.cards);
}
export function deleteCard(id) {
  state.cards = state.cards.filter(c=>c.id!==id);
  saveCards(state.cards);
}
export function moveCard(id, colId) {
  const c = state.cards.find(x=>x.id===id); if (!c) return;
  if (c.col !== colId) { c.col = colId; c.updated = Date.now(); saveCards(state.cards); }
}

// Markiert eine Karte als abgeschlossen und archiviert sie
export function archiveCard(id) {
  const c = state.cards.find(x=>x.id===id); if (!c) return;
  if (!c.archived) {
    c.archived = true;
    c.completedAt = Date.now();
    c.updated = Date.now();
    saveCards(state.cards);
  }
}

// Macht die Archivierung rückgängig
export function unarchiveCard(id) {
  const c = state.cards.find(x=>x.id===id); if (!c) return;
  if (c.archived) {
    c.archived = false;
    c.completedAt = null;
    c.updated = Date.now();
    saveCards(state.cards);
  }
}
