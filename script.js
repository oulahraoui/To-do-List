// ELEMENTS
const taskInput = document.getElementById("task-bar");
const addTaskButton = document.getElementById("addTask");
const taskList = document.getElementById("task-list");
const errorSpan = document.querySelector(".error");

const liveSection = document.querySelector(".to-do-list");
const historySection = document.querySelector(".history-page");

const liveBtn = document.getElementById("live");
const historyBtn = document.getElementById("history");

let taskBeingEdited = null;

function showCleanupMessage(message) {
  const msg = document.createElement("div");
  msg.className = "cleanup-message";
  msg.textContent = message;

  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 3000);
}

function autoCleanup() {
  const now = Date.now();

  const lastTasksClear = Number(localStorage.getItem("lastTasksClear")) || 0;
  const lastHistoryClear = Number(localStorage.getItem("lastHistoryClear")) || 0;

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_WEEK = 7 * ONE_DAY;

  // 🧹 Clear live tasks every 24h
  if (now - lastTasksClear >= ONE_DAY) {
    localStorage.removeItem("tasks");
    localStorage.setItem("lastTasksClear", now);
    showCleanupMessage("🧹 Live tasks reset (24h)");
  }

  // 🧹 Clear history every 7 days
  if (now - lastHistoryClear >= ONE_WEEK) {
    localStorage.removeItem("historyTasks");
    localStorage.setItem("lastHistoryClear", now);
    showCleanupMessage("📅 History cleared (weekly)");
  }
}


// =====================
// LOCAL STORAGE HELPERS
// =====================

function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// =====================
// HISTORY
// =====================

function saveToHistory(taskText) {
  const history = JSON.parse(localStorage.getItem("historyTasks")) || [];

  history.push({
    text: taskText,
    date: new Date().toISOString(),
  });

  localStorage.setItem("historyTasks", JSON.stringify(history));
}

function addTaskToHistory(taskText, date = new Date()) {
  const historyList = historySection.querySelector(".task-list");

  const li = document.createElement("li");
  li.className = "task-item";

  li.innerHTML = `
    <label class="task-left">
      <span class="task-name">${taskText}</span>
    </label>

    <span class="date">
      ${date.toLocaleDateString()}
      ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>

    <button class="delete">Delete</button>
  `;

  historyList.appendChild(li);
}


historySection.addEventListener("click", (e) => {
  if (!e.target.classList.contains("delete")) return;

  const item = e.target.closest(".task-item");
  const text = item.querySelector(".task-name").textContent;

  item.remove();

  let history = JSON.parse(localStorage.getItem("historyTasks")) || [];

  history = history.filter(
    (task) => (typeof task === "string" ? task !== text : task.text !== text)
  );

  localStorage.setItem("historyTasks", JSON.stringify(history));
});

// =====================
// CREATE TASK ELEMENT
// =====================

function createTaskElement(text, completed = false) {
  const li = document.createElement("li");
  li.className = "task-item";

  li.innerHTML = `
    <label class="task-left">
      <input type="checkbox" class="task-checkbox" ${
        completed ? "checked" : ""
      } />
      <span class="costum-checkbox"></span>
      <span class="task-name">${text}</span>
    </label>

    <span class="date">
      ${new Date().toLocaleDateString()}
      ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>

    <button class="edit">Edit</button>
    <button class="delete">Delete</button>
  `;

  if (completed) li.classList.add("completed");

  taskList.appendChild(li);
}

// =====================
// LOAD ON START
// =====================

document.addEventListener("DOMContentLoaded", () => {
  autoCleanup();

  const tasks = getTasks();
  tasks.forEach((task) => {
    createTaskElement(task.text, task.completed);
  });

  const history = JSON.parse(localStorage.getItem("historyTasks")) || [];
  history.forEach((item) => {
    if (typeof item === "string") {
      addTaskToHistory(item);
    } else if (item && item.text) {
      addTaskToHistory(item.text, new Date(item.date));
    }
  });
});

// =====================
// ADD / EDIT TASK
// =====================

addTaskButton.addEventListener("click", () => {
  const value = taskInput.value.trim();

  if (!value) {
    errorSpan.classList.remove("hide");
    taskInput.classList.add("outline-error");
    return;
  }

  let tasks = getTasks();

  // EDIT MODE
  if (addTaskButton.classList.contains("edited")) {
    const taskNameEl = taskBeingEdited.querySelector(".task-name");
    const oldText = taskNameEl.textContent;

    taskNameEl.textContent = value;

    tasks = tasks.map((task) =>
      task.text === oldText ? { ...task, text: value } : task
    );

    saveTasks(tasks);

    taskBeingEdited = null;
    addTaskButton.textContent = "Add task";
    addTaskButton.classList.remove("edited");
    taskInput.value = "";
    return;
  }

  // ADD MODE
  createTaskElement(value);
  tasks.push({ text: value, completed: false });
  saveTasks(tasks);

  taskInput.value = "";
});

// =====================
// REMOVE ERROR ON INPUT
// =====================

taskInput.addEventListener("input", () => {
  if (taskInput.value.trim()) {
    errorSpan.classList.add("hide");
    taskInput.classList.remove("outline-error");
  }
});

// =====================
// CHECKBOX COMPLETE
// =====================

taskList.addEventListener("change", (e) => {
  if (!e.target.classList.contains("task-checkbox")) return;

  const taskItem = e.target.closest(".task-item");
  const text = taskItem.querySelector(".task-name").textContent;

  taskItem.classList.toggle("completed", e.target.checked);

  const tasks = getTasks().map((task) =>
    task.text === text ? { ...task, completed: e.target.checked } : task
  );

  saveTasks(tasks);

  // ADD TO HISTORY WHEN COMPLETED
  if (e.target.checked) {
    saveToHistory(text);
    addTaskToHistory(text);
  }
});

// =====================
// DELETE & EDIT
// =====================

taskList.addEventListener("click", (e) => {
  const taskItem = e.target.closest(".task-item");
  if (!taskItem) return;

  const text = taskItem.querySelector(".task-name").textContent;

  // DELETE
  if (e.target.classList.contains("delete")) {
    taskItem.remove();
    const tasks = getTasks().filter((task) => task.text !== text);
    saveTasks(tasks);
  }

  // EDIT
  if (e.target.classList.contains("edit")) {
    taskBeingEdited = taskItem;
    taskInput.value = text;
    addTaskButton.textContent = "Edit task";
    addTaskButton.classList.add("edited");
  }
});

// =====================
// LIVE & HISTORY BUTTONS
// =====================

historyBtn.addEventListener("click", () => {
  liveSection.classList.add("hide");
  historySection.classList.remove("hide");
});

liveBtn.addEventListener("click", () => {
  liveSection.classList.remove("hide");
  historySection.classList.add("hide");
});
