import { state } from "../core/state.js";
import { saveColumns, saveCards } from "../core/storage.js";

export function addColumn(name) {
  const title = (name ?? "").trim();
  if (!title) return;
  const idBase = title.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-]/g,"").slice(0,24);
  let id = idBase || ("col-" + crypto.randomUUID().slice(0,8));
  for (let i=2; state.columns.some(c=>c.id===id); i++) id = `${idBase}-${i}`;
  state.columns.push({ id, name: title });
  saveColumns(state.columns);
}

export function renameColumn(id, nextName) {
  const col = state.columns.find(c=>c.id===id); if (!col) return;
  const name = (nextName ?? "").trim(); if (!name || name===col.name) return;
  col.name = name; saveColumns(state.columns);
}

export function deleteColumn(id, strategy) {
  if (state.columns.length <= 1) throw new Error("Letzte Spalte kann nicht gelöscht werden.");
  const count = state.cards.filter(c=>c.col===id).length;

  if (count > 0) {
    if (strategy.type === "move") {
      for (const card of state.cards) if (card.col===id) card.col = strategy.to;
      saveCards(state.cards);
    } else if (strategy.type === "delete") {
      state.cards = state.cards.filter(c=>c.col!==id);
      saveCards(state.cards);
    } else {
      throw new Error("Strategie erforderlich (move/delete).");
    }
  }
  state.columns = state.columns.filter(c=>c.id!==id);
  saveColumns(state.columns);
}

export function reorderColumns(dragId, targetId, before) {
  const from = state.columns.findIndex(c=>c.id===dragId);
  let to = state.columns.findIndex(c=>c.id===targetId);
  if (from<0 || to<0) return;
  const [item] = state.columns.splice(from,1);
  if (before) { if (from<to) to--; state.columns.splice(to,0,item); }
  else { if (from>=to) to++; state.columns.splice(to,0,item); }
  saveColumns(state.columns);
}
