import { init, renderBoard } from "./ui/render.js";
import { renderArchive } from "./ui/archive.js";
import * as cols from "./features/columns.js";
import * as cards from "./features/cards.js";
import { state } from "./core/state.js";

// Ensure Font Awesome and replace delete buttons in templates with icons
(function setupIcons(){
  // Inject FA stylesheet once
  const FA_HREF = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  if (!document.querySelector(`link[href*="font-awesome"][href*="all.min.css"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FA_HREF;
    document.head.appendChild(link);
  }
  // Update templates' delete buttons to icon-only
  const colTpl = document.getElementById('column-template');
  const cardTpl = document.getElementById('card-template');
  try {
    const colBtn = colTpl?.content?.querySelector('[data-del]');
    if (colBtn) {
      colBtn.classList.add('icon-btn');
      colBtn.setAttribute('title', 'Spalte löschen');
      colBtn.setAttribute('aria-label', 'Spalte löschen');
      colBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    }
  } catch {}
  try {
    const cardBtn = cardTpl?.content?.querySelector('[data-delete]');
    if (cardBtn) {
      cardBtn.classList.add('icon-btn');
      cardBtn.setAttribute('title', 'Karte löschen');
      cardBtn.setAttribute('aria-label', 'Karte löschen');
      cardBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    }
  } catch {}
})();

init();

// Header: Archiv-Button einfuegen und View toggeln
const controlsEl = document.querySelector('.controls.toolbar');
let archiveBtn = document.getElementById('archiveBtn');
if (!archiveBtn) {
  archiveBtn = document.createElement('button');
  archiveBtn.id = 'archiveBtn';
  archiveBtn.className = 'ghost';
  archiveBtn.textContent = 'Archiv';
  const resetBtn = document.getElementById('resetBtn');
  if (controlsEl) {
    if (resetBtn && resetBtn.parentElement === controlsEl) {
      controlsEl.insertBefore(archiveBtn, resetBtn);
    } else {
      controlsEl.appendChild(archiveBtn);
    }
  }
}

let showingArchive = false;
function updateHeaderButtons() {
  if (archiveBtn) archiveBtn.textContent = showingArchive ? 'Board' : 'Archiv';
  const addTask = document.getElementById('addTaskBtn');
  const addCol = document.getElementById('addColBtn');
  if (addTask) addTask.style.display = showingArchive ? 'none' : '';
  if (addCol) addCol.style.display = showingArchive ? 'none' : '';
}

archiveBtn?.addEventListener('click', () => {
  showingArchive = !showingArchive;
  if (showingArchive) {
    renderArchive();
  } else {
    renderBoard();
  }
  updateHeaderButtons();
});

updateHeaderButtons();

// Enter speichert die Karte, wenn der Dialog offen ist (Fokus im Titel)
const titleInputEl = document.getElementById("titleInput");
const saveTaskBtnEl = document.getElementById("saveTaskBtn");
if (saveTaskBtnEl && !saveTaskBtnEl.value) saveTaskBtnEl.value = "save";
titleInputEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    saveTaskBtnEl?.click();
  }
});

// Enter speichert die Spalte (Fokus im Namen)
const colNameInputEl = document.getElementById("colNameInput");
const saveColBtnEl = document.getElementById("saveColBtn");
if (saveColBtnEl && !saveColBtnEl.value) saveColBtnEl.value = "save";
colNameInputEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    saveColBtnEl?.click();
  }
});

document.getElementById("addColBtn").addEventListener("click", ()=>{
  const dlg = document.getElementById("colDialog");
  const input = document.getElementById("colNameInput");
  const saveBtn = document.getElementById("saveColBtn");

  if (input) input.value = "";
  if (saveBtn) saveBtn.value = "save";

  const onClose = () => {
    if (dlg && dlg.returnValue === "save" && input && input.value.trim()) {
      cols.addColumn(input.value);
      renderBoard();
    }
    dlg.removeEventListener("close", onClose);
  };

  if (dlg && typeof dlg.showModal === "function") {
    dlg.addEventListener("close", onClose);
    dlg.showModal();
    setTimeout(() => input?.focus(), 0);
  } else {
    const name = prompt("Name der neuen Spalte:", "Neue Spalte");
    cols.addColumn(name);
    renderBoard();
  }
});

document.getElementById("addTaskBtn").addEventListener("click", ()=>{
const dlg = document.getElementById("taskDialog");
const form = document.getElementById("taskForm");
const saveBtn = document.getElementById("saveTaskBtn");
const titleInput = document.getElementById("titleInput");
const descInput = document.getElementById("descInput");

if (titleInput) titleInput.value = "";
if (descInput) descInput.value = "";

// Stelle sicher, dass der Save-Button eine Return-Value setzt
if (saveBtn) saveBtn.value = "save";

const onClose = () => {
    if (dlg && dlg.returnValue === "save" && titleInput &&
titleInput.value.trim()) {
      cards.addCard({ title: titleInput.value, desc: descInput.value });
      renderBoard();
    }
    dlg.removeEventListener("close", onClose);
};

if (dlg) {
    dlg.addEventListener("close", onClose);
    if (typeof dlg.showModal === "function") {
      dlg.showModal();
    } else {
      // Fallback ohne <dialog>-Support
      const title = prompt("Titel der neuen Karte:", "Neue Aufgabe");
      if (title) { cards.addCard({ title, desc: "" }); renderBoard(); }
      dlg.removeEventListener("close", onClose);
    }
}
});

// Export: Spalten + Karten als JSON herunterladen
document.getElementById("exportBtn")?.addEventListener("click", () => {
  const data = JSON.stringify({
    columns: state.columns,
    cards: state.cards,
    version: 2,
  }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kanban-backup.json";
  a.click();
  URL.revokeObjectURL(url);
});
