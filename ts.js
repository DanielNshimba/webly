/* ============================================================
   TaskFlow — ts.js
   Task Manager with Money Calculation & LocalStorage Database
   ============================================================ */

"use strict";

// ─── State ──────────────────────────────────────────────────
const DB_KEY = "taskflow_db";
let tasks = [];
let calcExpression = "";
let filterStatus = "all";
let filterCategory = "all";
let sortMode = "newest";
let searchQuery = "";
let editingId = null;

// ─── DOM Refs ────────────────────────────────────────────────
const html = document.documentElement;
const darkToggle = document.getElementById("darkToggle");
const darkIcon = document.getElementById("darkIcon");

// Stats
const elTotal = document.getElementById("totalTasks");
const elCompleted = document.getElementById("completedTasks");
const elTotalBudget = document.getElementById("totalBudget");
const elSpent = document.getElementById("spentBudget");
const elRemain = document.getElementById("remainBudget");

// Form
const nameInput = document.getElementById("taskName");
const catInput = document.getElementById("taskCategory");
const priInput = document.getElementById("taskPriority");
const dueInput = document.getElementById("taskDue");
const budgetInput = document.getElementById("taskBudget");
const notesInput = document.getElementById("taskNotes");
const addBtn = document.getElementById("addTaskBtn");

// List
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSt = document.getElementById("filterStatus");
const filterCat = document.getElementById("filterCategory");
const sortSel = document.getElementById("sortTasks");
const progressBar = document.getElementById("progressBar");
const progressPct = document.getElementById("progressPct");
const budgetBreak = document.getElementById("budgetBreakdown");

// Calculator
const calcDisplay = document.getElementById("calcDisplay");
const calcBtns = document.querySelectorAll(".calc-btn");
const useCalcBtn = document.getElementById("useCalcBtn");

// Modal
const modalOverlay = document.getElementById("modalOverlay");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const saveEditBtn = document.getElementById("saveEditBtn");
const editId = document.getElementById("editId");
const editName = document.getElementById("editName");
const editCategory = document.getElementById("editCategory");
const editPriority = document.getElementById("editPriority");
const editDue = document.getElementById("editDue");
const editBudget = document.getElementById("editBudget");
const editNotes = document.getElementById("editNotes");

// Actions
const exportBtn = document.getElementById("exportBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const toast = document.getElementById("toast");

// ─── Persistence ─────────────────────────────────────────────
function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(tasks));
}

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  tasks = raw ? JSON.parse(raw) : [];
}

// Theme is permanently dark — no toggle needed
html.setAttribute('data-theme', 'dark');

// ─── Utilities ───────────────────────────────────────────────
function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatMoney(n) {
  return (
    "$" +
    Number(n || 0)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

function isOverdue(due) {
  if (!due) return false;
  return new Date(due) < new Date(new Date().toDateString());
}

function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// ─── Stats ────────────────────────────────────────────────────
function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const allBudget = tasks.reduce((s, t) => s + (parseFloat(t.budget) || 0), 0);
  const spentAmt = tasks
    .filter((t) => t.done)
    .reduce((s, t) => s + (parseFloat(t.budget) || 0), 0);
  const remain = allBudget - spentAmt;

  elTotal.textContent = total;
  elCompleted.textContent = done;
  elTotalBudget.textContent = formatMoney(allBudget);
  elSpent.textContent = formatMoney(spentAmt);
  elRemain.textContent = formatMoney(remain);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = pct + "%";
  progressPct.textContent = pct + "%";
}

// ─── Budget Breakdown ─────────────────────────────────────────
function updateBudgetBreakdown() {
  const cats = {};
  tasks.forEach((t) => {
    const amt = parseFloat(t.budget) || 0;
    if (amt > 0) cats[t.category] = (cats[t.category] || 0) + amt;
  });

  const total = Object.values(cats).reduce((s, v) => s + v, 0);

  if (total === 0) {
    budgetBreak.innerHTML =
      '<p class="budget-hint">Add tasks with budgets to see breakdown.</p>';
    return;
  }

  const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);

  budgetBreak.innerHTML = sortedCats
    .map(([cat, amt]) => {
      const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
      return `
      <div class="budget-cat-row">
        <span class="budget-cat-label">${cat}</span>
        <div class="budget-cat-bar-bg">
          <div class="budget-cat-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="budget-cat-amount">${formatMoney(amt)}</span>
      </div>
    `;
    })
    .join("");
}

// ─── Render Tasks ─────────────────────────────────────────────
function getFilteredTasks() {
  let list = [...tasks];

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q),
    );
  }

  // Filter status
  if (filterStatus === "pending") list = list.filter((t) => !t.done);
  if (filterStatus === "done") list = list.filter((t) => t.done);

  // Filter category
  if (filterCategory !== "all")
    list = list.filter((t) => t.category === filterCategory);

  // Sort
  if (sortMode === "newest") list.sort((a, b) => b.createdAt - a.createdAt);
  if (sortMode === "oldest") list.sort((a, b) => a.createdAt - b.createdAt);
  if (sortMode === "priority") {
    const p = { High: 0, Medium: 1, Low: 2 };
    list.sort((a, b) => p[a.priority] - p[b.priority]);
  }
  if (sortMode === "budget")
    list.sort(
      (a, b) => (parseFloat(b.budget) || 0) - (parseFloat(a.budget) || 0),
    );

  return list;
}

function renderTasks() {
  const list = getFilteredTasks();

  if (list.length === 0) {
    taskList.innerHTML = "";
    taskList.appendChild(emptyState);
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";

  taskList.innerHTML = list
    .map((task) => {
      const overdue = isOverdue(task.due) && !task.done;
      const dueLabel = task.due
        ? `<span class="tag due${overdue ? " overdue" : ""}"><i class="fa-regular fa-calendar"></i> ${task.due}${overdue ? " ⚠️" : ""}</span>`
        : "";
      const budgeLabel =
        parseFloat(task.budget) > 0
          ? `<div class="task-budget-badge"><i class="fa-solid fa-dollar-sign"></i> ${formatMoney(task.budget)}</div>`
          : "";
      const notesEl = task.notes
        ? `<div class="task-notes">${escapeHtml(task.notes)}</div>`
        : "";

      return `
      <div class="task-card ${task.done ? "done" : ""}" data-id="${task.id}">
        <div class="task-priority-bar ${task.priority}"></div>
        <div class="task-check-wrap">
          <button class="task-check" data-action="toggle" data-id="${task.id}" title="${task.done ? "Mark pending" : "Mark done"}">
            ${task.done ? '<i class="fa-solid fa-check"></i>' : ""}
          </button>
        </div>
        <div class="task-body">
          <div class="task-name">${escapeHtml(task.name)}</div>
          <div class="task-meta">
            <span class="tag cat">${task.category}</span>
            <span class="tag pri ${task.priority}">${task.priority}</span>
            ${dueLabel}
          </div>
          ${budgeLabel}
          ${notesEl}
        </div>
        <div class="task-actions">
          <button class="task-btn edit" data-action="edit" data-id="${task.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="task-btn delete" data-action="delete" data-id="${task.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    })
    .join("");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Full Render ──────────────────────────────────────────────
function render() {
  renderTasks();
  updateStats();
  updateBudgetBreakdown();
}

// ─── Add Task ─────────────────────────────────────────────────
function addTask() {
  const name = nameInput.value.trim();
  if (!name) {
    showToast("⚠️ Please enter a task name.");
    nameInput.focus();
    return;
  }

  const task = {
    id: genId(),
    name,
    category: catInput.value,
    priority: priInput.value,
    due: dueInput.value,
    budget: parseFloat(budgetInput.value) || 0,
    notes: notesInput.value.trim(),
    done: false,
    createdAt: Date.now(),
  };

  tasks.unshift(task);
  saveDB();
  render();

  // Reset form
  nameInput.value = "";
  budgetInput.value = "";
  notesInput.value = "";
  dueInput.value = "";
  nameInput.focus();

  showToast("✅ Task added successfully!");
}

addBtn.addEventListener("click", addTask);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// ─── Task Actions ─────────────────────────────────────────────
taskList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "toggle") {
    const t = tasks.find((x) => x.id === id);
    if (t) {
      t.done = !t.done;
      saveDB();
      render();
      showToast(
        t.done ? "✅ Task marked complete!" : "🔄 Task marked pending.",
      );
    }
  }

  if (action === "edit") {
    const t = tasks.find((x) => x.id === id);
    if (t) openEditModal(t);
  }

  if (action === "delete") {
    if (confirm("Delete this task?")) {
      tasks = tasks.filter((x) => x.id !== id);
      saveDB();
      render();
      showToast("🗑️ Task deleted.");
    }
  }
});

// ─── Edit Modal ───────────────────────────────────────────────
function openEditModal(task) {
  editId.value = task.id;
  editName.value = task.name;
  editCategory.value = task.category;
  editPriority.value = task.priority;
  editDue.value = task.due || "";
  editBudget.value = task.budget || "";
  editNotes.value = task.notes || "";
  modalOverlay.classList.add("open");
  editName.focus();
}

function closeEditModal() {
  modalOverlay.classList.remove("open");
}

closeModal.addEventListener("click", closeEditModal);
cancelModal.addEventListener("click", closeEditModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeEditModal();
});

saveEditBtn.addEventListener("click", () => {
  const name = editName.value.trim();
  if (!name) {
    showToast("⚠️ Task name is required.");
    return;
  }

  const t = tasks.find((x) => x.id === editId.value);
  if (t) {
    t.name = name;
    t.category = editCategory.value;
    t.priority = editPriority.value;
    t.due = editDue.value;
    t.budget = parseFloat(editBudget.value) || 0;
    t.notes = editNotes.value.trim();
    saveDB();
    render();
    closeEditModal();
    showToast("💾 Task updated!");
  }
});

// ─── Filters & Search ─────────────────────────────────────────
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderTasks();
});

filterSt.addEventListener("change", (e) => {
  filterStatus = e.target.value;
  renderTasks();
});
filterCat.addEventListener("change", (e) => {
  filterCategory = e.target.value;
  renderTasks();
});
sortSel.addEventListener("change", (e) => {
  sortMode = e.target.value;
  renderTasks();
});

// ─── Calculator ───────────────────────────────────────────────
calcBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = btn.dataset.val;

    if (val === "C") {
      calcExpression = "";
    } else if (val === "⌫") {
      calcExpression = calcExpression.slice(0, -1);
    } else if (val === "=") {
      try {
        // Safe eval: only allow numbers and operators
        if (/^[\d\s\+\-\*\/\.\(\)\%]+$/.test(calcExpression)) {
          // Handle percentage
          const expr = calcExpression.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
          const result = Function('"use strict"; return (' + expr + ")")();
          calcExpression = isFinite(result)
            ? String(parseFloat(result.toFixed(10)))
            : "Error";
        } else {
          calcExpression = "Error";
        }
      } catch {
        calcExpression = "Error";
      }
    } else {
      if (calcExpression === "Error") calcExpression = "";
      calcExpression += val;
    }

    calcDisplay.value = calcExpression;
  });
});

useCalcBtn.addEventListener("click", () => {
  const val = parseFloat(calcDisplay.value);
  if (!isNaN(val) && calcDisplay.value !== "Error") {
    budgetInput.value = val.toFixed(2);
    showToast(`💰 $${val.toFixed(2)} applied to budget field!`);
  } else {
    showToast("⚠️ Calculate a valid number first.");
  }
});

// ─── Export CSV ───────────────────────────────────────────────
exportBtn.addEventListener("click", () => {
  if (tasks.length === 0) {
    showToast("⚠️ No tasks to export.");
    return;
  }

  const headers = [
    "Name",
    "Category",
    "Priority",
    "Due Date",
    "Budget ($)",
    "Status",
    "Notes",
    "Created",
  ];
  const rows = tasks.map((t) => [
    `"${t.name.replace(/"/g, '""')}"`,
    t.category,
    t.priority,
    t.due || "",
    (t.budget || 0).toFixed(2),
    t.done ? "Completed" : "Pending",
    `"${(t.notes || "").replace(/"/g, '""')}"`,
    new Date(t.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskflow_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📄 CSV exported successfully!");
});

// ─── Clear All ────────────────────────────────────────────────
clearAllBtn.addEventListener("click", () => {
  if (tasks.length === 0) {
    showToast("⚠️ No tasks to clear.");
    return;
  }
  if (confirm(`Delete all ${tasks.length} tasks? This cannot be undone.`)) {
    tasks = [];
    saveDB();
    render();
    showToast("🗑️ All tasks cleared.");
  }
});

// ─── Boot ─────────────────────────────────────────────────────
(function init() {
  // Always dark mode
  html.setAttribute('data-theme', 'dark');

  // Load tasks
  loadDB();

  // Set default due date to today
  const today = new Date().toISOString().split("T")[0];
  dueInput.value = today;

  render();
})();
