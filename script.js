
// ======================================
// SMARTTASK - PROJECT MANAGEMENT SYSTEM
// ======================================

// 1. SELECT ELEMENTS

const $ = (id) => document.getElementById(id);

const taskList = $("taskList");
const taskModal = $("taskModal");
const taskForm = $("taskForm");

const searchInput = $("searchInput");
const filterSelect = $("filterSelect");
const priorityFilter = $("priorityFilter");

let tasks = [];
let editingId = null;

// 2. LOAD DATA SAFELY

try {
  const saved = JSON.parse(localStorage.getItem("smartTasks") || "[]");
  tasks = Array.isArray(saved) ? saved.filter(task =>
    task &&
    Number.isFinite(task.id) &&
    typeof task.title === "string" &&
    ["Pending", "In Progress", "Completed"].includes(task.status) &&
    ["Low", "Medium", "High"].includes(task.priority)
  ) : [];
} catch {
  tasks = [];
}

function saveTasks() {
  try {
    localStorage.setItem("smartTasks", JSON.stringify(tasks));
  } catch {
    alert("Unable to save data. Check your browser storage.");
  }
}

// 3. OPEN AND CLOSE MODAL

function openModal(task = null) {
  taskForm.reset();

  editingId = task ? task.id : null;

  $("modalTitle").textContent = task
    ? "Edit Task"
    : "Create New Task";

  $("saveBtn").textContent = task
    ? "Update Task"
    : "Save Task";

  if (task) {
    $("taskTitle").value = task.title;
    $("taskDescription").value = task.description || "";
    $("taskPriority").value = task.priority;
    $("taskStatus").value = task.status;
    $("taskDate").value = task.date || "";
  }

  taskModal.classList.add("show");
  $("taskTitle").focus();
}

function closeModal() {
  taskModal.classList.remove("show");
  editingId = null;
  taskForm.reset();
}

$("addBtn").addEventListener("click", () => openModal());
$("headerAddBtn").addEventListener("click", () => openModal());

$("closeModal").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);

taskModal.addEventListener("click", (e) => {
  if (e.target === taskModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// 4. CREATE AND UPDATE TASK

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = $("taskTitle").value.trim();

  if (!title) {
    alert("Please enter a task title.");
    return;
  }

  const taskData = {
    title,
    description: $("taskDescription").value.trim(),
    priority: $("taskPriority").value,
    status: $("taskStatus").value,
    date: $("taskDate").value
  };

  if (editingId !== null) {
    tasks = tasks.map(task =>
      task.id === editingId
        ? { ...task, ...taskData }
        : task
    );
  } else {
    tasks.unshift({
      id: Date.now() + Math.random(),
      ...taskData,
      createdAt: new Date().toISOString()
    });
  }

  saveTasks();
  closeModal();
  renderApp();
});

// 5. CREATE SAFE HTML ELEMENTS

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function createBadge(text, className) {
  return createElement("span", className, text);
}

// 6. RENDER TASK LIST

function renderTasks() {
  const search = searchInput.value.toLowerCase().trim();
  const status = filterSelect.value;
  const priority = priorityFilter.value;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search) ||
      (task.description || "").toLowerCase().includes(search);

    const matchesStatus =
      status === "all" || task.status === status;

    const matchesPriority =
      priority === "all" || task.priority === priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  taskList.replaceChildren();

  if (filteredTasks.length === 0) {
    taskList.appendChild(
      createElement("div", "empty", "No tasks found. Add a new task!")
    );
    return;
  }

  filteredTasks.forEach(task => {
    const item = createElement("div", "task-item");
    const info = createElement("div", "task-info");

    const title = createElement("strong", "", task.title);
    const description = createElement(
      "p",
      "",
      task.description || "No description provided"
    );

    const meta = createElement("div", "task-meta");

    meta.append(
      createBadge(task.priority, `badge ${task.priority}`),
      createBadge(task.status, "badge status-badge")
    );

    if (task.date) {
      meta.appendChild(
        createBadge(`Due: ${task.date}`, "badge status-badge")
      );
    }

    info.append(title, description, meta);

    const actions = createElement("div", "task-actions");

    const editBtn = createElement("button", "edit-btn", "Edit");
    editBtn.addEventListener("click", () => openModal(task));

    const deleteBtn = createElement(
      "button", "delete-btn", "Delete"
    );

    deleteBtn.addEventListener("click", () => {
      if (!confirm(`Delete "${task.title}"?`)) return;

      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderApp();
    });

    actions.append(editBtn, deleteBtn);
    item.append(info, actions);

    taskList.appendChild(item);
  });
}

// 7. DASHBOARD STATISTICS

function renderStats() {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === "Pending").length;
  const progress = tasks.filter(t => t.status === "In Progress").length;
  const completed = tasks.filter(t => t.status === "Completed").length;

  $("totalTasks").textContent = total;
  $("pendingTasks").textContent = pending;
  $("progressTasks").textContent = progress;
  $("completedTasks").textContent = completed;

  $("pendingCount").textContent = pending;
  $("progressCount").textContent = progress;
  $("doneCount").textContent = completed;
}

// 8. KANBAN BOARD

function renderKanban() {
  const columns = {
    "Pending": $("pendingColumn"),
    "In Progress": $("progressColumn"),
    "Completed": $("completedColumn")
  };

  Object.values(columns).forEach(column => {
    column.replaceChildren();
  });

  tasks.forEach(task => {
    const card = createElement("div", "kanban-card");
    card.draggable = true;
    card.dataset.id = String(task.id);

    const title = createElement("strong", "", task.title);
    const priority = createBadge(
      task.priority,
      `badge ${task.priority}`
    );

    const description = createElement(
      "p", "",
      task.description || "No description"
    );

    card.append(title, priority, description);

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(task.id));
      e.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    columns[task.status].appendChild(card);
  });

  document.querySelectorAll(".drop-zone").forEach(zone => {
    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("drag-over");

      const id = Number(e.dataTransfer.getData("text/plain"));
      const column = zone.closest(".kanban-column");
      const newStatus = column.dataset.status;

      const task = tasks.find(t => t.id === id);

      if (!task || !newStatus) return;

      task.status = newStatus;

      saveTasks();
      renderApp();
    });
  });
}

// 9. ANALYTICS

function renderAnalytics() {
  const total = tasks.length;
  const completed = tasks.filter(
    task => task.status === "Completed"
  ).length;

  const percentage = total
    ? Math.round((completed / total) * 100)
    : 0;

  $("progressBar").style.width = `${percentage}%`;
  $("progressPercent").textContent = `${percentage}%`;

  const priorityCounts = {
    High: tasks.filter(t => t.priority === "High").length,
    Medium: tasks.filter(t => t.priority === "Medium").length,
    Low: tasks.filter(t => t.priority === "Low").length
  };

  const analytics = $("priorityAnalytics");
  analytics.replaceChildren();

  Object.entries(priorityCounts).forEach(([priority, count]) => {
    const row = createElement("div", "priority-row");

    row.append(
      createElement("span", "", priority),
      createElement("strong", "", String(count))
    );

    analytics.appendChild(row);
  });
}

// 10. SEARCH AND FILTERS

searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

// 11. DARK MODE WITH SAVED PREFERENCE

const savedTheme = localStorage.getItem("smartTheme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

function updateThemeButton() {
  $("themeBtn").textContent =
    document.body.classList.contains("dark")
      ? "☀ Light Mode"
      : "☾ Dark Mode";
}

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const theme = document.body.classList.contains("dark")
    ? "dark"
    : "light";

  localStorage.setItem("smartTheme", theme);
  updateThemeButton();
});

// 12. RENDER EVERYTHING

function renderApp() {
  renderTasks();
  renderStats();
  renderKanban();
  renderAnalytics();
  updateThemeButton();
}

// START APPLICATION

renderApp();

console.log("SmartTask application started successfully!");
