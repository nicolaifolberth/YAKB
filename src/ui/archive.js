import { state } from "../core/state.js";
import * as cards from "../features/cards.js";

const board = document.getElementById("board");
const cardTpl = document.getElementById("card-template");

// Renders a simple archive view: one list, newest completed first
export function renderArchive() {
  if (!board || !cardTpl) return;
  board.innerHTML = "";

  const section = document.createElement("section");
  section.className = "column";

  const header = document.createElement("div");
  header.className = "column-header";
  const title = document.createElement("h2");
  title.textContent = "Archiv";
  const tools = document.createElement("div");
  tools.className = "column-tools";
  header.appendChild(title);
  header.appendChild(tools);

  const countEl = document.createElement("span");
  countEl.className = "count small";

  const dropzone = document.createElement("div");
  dropzone.className = "dropzone";

  section.appendChild(header);
  section.appendChild(countEl);
  section.appendChild(dropzone);

  // collect archived cards and sort by completedAt desc
  const archived = state.cards
    .filter(c => c.archived === true)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  countEl.textContent = `${archived.length} archivierte Karte(n)`;

  for (const c of archived) {
    const el = cardTpl.content.firstElementChild.cloneNode(true);
    el.dataset.id = c.id;
    // disable drag in archive view
    el.setAttribute("draggable", "false");
    el.draggable = false;

    el.querySelector(".card-title").textContent = c.title || "(ohne Titel)";
    el.querySelector(".card-desc").textContent = c.desc || "";
    // Show completion timestamp under description
    const ts = c.completedAt ?? c.updated ?? c.created;
    if (ts) {
      const meta = document.createElement('div');
      meta.className = 'small';
      try {
        meta.textContent = `Abgeschlossen: ${new Date(ts).toLocaleString('de-DE')}`;
      } catch {
        meta.textContent = `Abgeschlossen: ${new Date(ts).toString()}`;
      }
      // Insert before actions
      const actions = el.querySelector('.card-actions');
      if (actions && actions.parentElement) {
        actions.parentElement.insertBefore(meta, actions);
      } else {
        el.appendChild(meta);
      }
    }

    // Actions: Keep delete/edit behavior identical for now
    el.querySelector('[data-delete]')?.addEventListener('click', () => {
      if (!confirm('Diese Karte wirklich löschen?')) return;
      cards.deleteCard(c.id);
      renderArchive();
    });
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
          renderArchive();
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
        renderArchive();
      }
    });

    // Add reactivation button
    const actions = el.querySelector('.card-actions');
    if (actions) {
      const reactivateBtn = document.createElement('button');
      reactivateBtn.className = 'secondary small';
      reactivateBtn.textContent = 'Reaktivieren';
      reactivateBtn.addEventListener('click', () => {
        cards.unarchiveCard(c.id);
        renderArchive();
      });
      actions.prepend(reactivateBtn);
    }

    dropzone.appendChild(el);
  }

  board.appendChild(section);
}
