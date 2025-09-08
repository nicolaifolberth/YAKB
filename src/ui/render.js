import { state, migrate } from "../core/state.js";
import * as cols from "../features/columns.js";
import * as cards from "../features/cards.js";

const board = document.getElementById("board");
const colTpl = document.getElementById("column-template");
const cardTpl = document.getElementById("card-template");

export function init() {
  migrate();
  // Event Delegation: Spalten loeschen Button
  board.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-del]') : null;
    if (btn) {
      const section = btn.closest('.column');
      const colId = section?.dataset?.col;
      if (colId) handleColumnDelete(colId);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  });
  // Event Delegation: Spalten umbenennen Button
  board.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-rename]') : null;
    if (btn) {
      const section = btn.closest('.column');
      const colId = section?.dataset?.col;
      if (colId) handleColumnRename(colId);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  });
  renderBoard();
}

export function renderBoard() {
  board.innerHTML = "";
  for (const col of state.columns) {
    const node = colTpl.content.firstElementChild.cloneNode(true);
    node.dataset.col = col.id;
    node.querySelector("h2").textContent = col.name;

    // Column Drag & Drop (Reihenfolge aendern)
    const section = node; // <section class="column">
    const header = node.querySelector('[data-col-header]');
    if (header) {
      header.setAttribute('draggable', 'true');
      header.addEventListener('dragstart', (e) => {
        state.draggedColId = col.id;
        section.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', col.id); } catch {}
        }
      });
      header.addEventListener('dragend', () => {
        section.classList.remove('dragging');
        clearColDropHints();
        state.draggedColId = null;
      });
      section.addEventListener('dragover', (e) => {
        if (!state.draggedColId || state.draggedColId === col.id) return;
        e.preventDefault();
        const rect = section.getBoundingClientRect();
        const before = e.clientX < rect.left + rect.width / 2;
        section.classList.toggle('col-drop-left', before);
        section.classList.toggle('col-drop-right', !before);
      });
      section.addEventListener('dragleave', () => {
        section.classList.remove('col-drop-left', 'col-drop-right');
      });
      section.addEventListener('drop', (e) => {
        if (!state.draggedColId || state.draggedColId === col.id) return;
        e.preventDefault();
        const rect = section.getBoundingClientRect();
        const placeBefore = e.clientX < rect.left + rect.width / 2;
        cols.reorderColumns(state.draggedColId, col.id, placeBefore);
        clearColDropHints();
        state.draggedColId = null;
        renderBoard();
      });
    }

    // Dropzone-Events fuer Karten (Drag & Drop)
    const dropzone = node.querySelector('[data-dropzone]');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const id = state.draggedCardId;
        if (!id) return;
        cards.moveCard(id, col.id);
        renderCards();
      });
    }

    // Append section
    board.appendChild(node);
  }
  renderCards();
}

export function renderCards() {
  for (const dz of board.querySelectorAll('[data-dropzone]')) dz.innerHTML = '';
  for (const c of state.cards) {
    if (c.archived) continue; // hide archived on board view
    const el = cardTpl.content.firstElementChild.cloneNode(true);
    el.dataset.id = c.id;
    el.querySelector('.card-title').textContent = c.title || '(ohne Titel)';
    el.querySelector('.card-desc').textContent = c.desc || '';
    // Delete
    el.querySelector('[data-delete]')?.addEventListener('click', () => {
      if (!confirm('Diese Karte wirklich loeschen?')) return;
      cards.deleteCard(c.id);
      renderCards();
    });
    // Edit
    el.querySelector('[data-edit]')?.addEventListener('click', () => {
      const dlg = document.getElementById('taskDialog');
      const titleInput = document.getElementById('titleInput');
      const descInput = document.getElementById('descInput');
      const saveBtn = document.getElementById('saveTaskBtn');
      const dialogTitle = document.getElementById('dialogTitle');

      if (dialogTitle) dialogTitle.textContent = 'Karte bearbeiten';
      if (titleInput) titleInput.value = c.title || '';
      if (descInput) descInput.value = c.desc || '';
      if (saveBtn) saveBtn.value = 'save';

      const onClose = () => {
        if (dlg && dlg.returnValue === 'save' && titleInput && titleInput.value.trim()) {
          cards.updateCard(c.id, { title: titleInput.value, desc: descInput.value });
          renderCards();
        }
        dlg.removeEventListener('close', onClose);
      };

      if (dlg && typeof dlg.showModal === 'function') {
        dlg.addEventListener('close', onClose);
        dlg.showModal();
      } else {
        const nextTitle = prompt('Neuer Titel:', c.title || '');
        if (nextTitle == null || !nextTitle.trim()) return;
        const nextDesc = prompt('Neue Beschreibung:', c.desc || '');
        cards.updateCard(c.id, { title: nextTitle, desc: nextDesc ?? '' });
        renderCards();
      }
    });
    // Additional action: mark as done -> archive
    const actions = el.querySelector('.card-actions');
    if (actions) {
      const doneBtn = document.createElement('button');
      doneBtn.className = 'secondary small';
      doneBtn.textContent = 'Abschliessen';
      doneBtn.addEventListener('click', () => {
        cards.archiveCard(c.id);
        renderCards();
      });
      actions.prepend(doneBtn);
    }
    // Drag events
    el.addEventListener('dragstart', (e) => {
      state.draggedCardId = c.id;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', c.id); } catch {}
      }
    });
    el.addEventListener('dragend', () => {
      state.draggedCardId = null;
      for (const dz of board.querySelectorAll('[data-dropzone]')) dz.classList.remove('dragover');
    });
    board.querySelector(`.column[data-col="${c.col}"] [data-dropzone]`)?.appendChild(el);
  }
}

function clearColDropHints() {
  for (const sec of board.querySelectorAll('.column')) {
    sec.classList.remove('col-drop-left', 'col-drop-right');
  }
}

function handleColumnDelete(colId) {
  const col = state.columns.find(c => c.id === colId);
  if (!col) return;
  if (state.columns.length <= 1) { alert('Die letzte Spalte kann nicht geloescht werden.'); return; }
  const count = state.cards.filter(c => c.col === colId).length;
  if (count === 0) {
    if (!confirm(`Spalte "${col.name}" wirklich loeschen?`)) return;
    cols.deleteColumn(colId, { type: 'delete' });
    renderBoard();
    return;
  }
  const action = prompt(
    `Spalte "${col.name}" enthaelt ${count} Karte(n).\n` +
    `Tippe:\n- "verschieben" um Karten in eine andere Spalte zu verschieben\n- "loeschen" um alle Karten dieser Spalte zu loeschen`,
    'verschieben'
  );
  if (action == null) return;
  const a = action.toLowerCase();
  if (a.startsWith('versch')) {
    const targets = state.columns.filter(c => c.id !== colId);
    if (targets.length === 0) { alert('Keine Zielspalte vorhanden.'); return; }
    const list = targets.map((c,i)=>`${i+1}) ${c.name}`).join('\n');
    const pick = prompt(`Wohin verschieben? Waehl Nummer:\n${list}`, '1');
    const idx = Number(pick) - 1;
    const target = targets[idx];
    if (!target) return;
    cols.deleteColumn(colId, { type: 'move', to: target.id });
    renderBoard();
  } else if (a.startsWith('loesch') || a.startsWith('loes')) {
    if (!confirm(`Wirklich Spalte "${col.name}" und alle ${count} Karten loeschen?`)) return;
    cols.deleteColumn(colId, { type: 'delete' });
    renderBoard();
  }
}

function handleColumnRename(colId) {
  const col = state.columns.find(c => c.id === colId);
  if (!col) return;
  const next = prompt('Neuer Spaltenname:', col.name);
  if (next == null) return;
  const name = next.trim();
  if (!name || name === col.name) return;
  cols.renameColumn(colId, name);
  renderBoard();
}

