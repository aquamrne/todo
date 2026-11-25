/* Todo for My Dog — data, display, actions and memory in one small file. */

(function () {
  "use strict";

  var STORAGE_KEY = "todo-app";
  var SEED_TASKS = ["Go for a walk", "Poop in the yard", "Ask for refills"];

  var form = document.getElementById("add-form");
  var input = document.getElementById("new-task");
  var list = document.getElementById("task-list");
  var counter = document.getElementById("counter");
  var emptyMessage = document.getElementById("empty-message");
  var searchInput = document.getElementById("search-tasks");
  var filterButtons = document.querySelectorAll(".filter");

  // data: the tasks
  var tasks = [];

  // actions: which tasks the user wants to see
  var filter = "all";

  // actions: the words typed in the search box
  var query = "";

  /* ---------- memory: localStorage ---------- */

  function makeTask(text) {
    return {
      id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      text: text,
      done: false,
    };
  }

  // A saved task is usable only if it is an object with some text.
  function cleanTask(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    if (typeof value.text !== "string" || value.text.trim() === "") {
      return null;
    }
    return {
      id: typeof value.id === "string" && value.id !== "" ? value.id : makeTask("").id,
      text: value.text,
      done: value.done === true,
    };
  }

  function firstVisit() {
    return SEED_TASKS.map(function (text) {
      return makeTask(text);
    });
  }

  function loadTasks() {
    var raw = null;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      // The browser refuses storage. Start with the first list, never crash.
      return firstVisit();
    }

    // Nothing saved yet: this is the very first open.
    if (raw === null) {
      return firstVisit();
    }

    // Something is saved: use it, even if it is an empty list.
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map(cleanTask).filter(function (task) {
        return task !== null;
      });
    } catch (error) {
      // Broken saved data: start with an empty list.
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      // Storage is full or blocked. The app keeps working for this visit.
    }
  }

  /* ---------- display: what the user sees ---------- */

  function matchesSearch(task, needle) {
    return task.text.toLowerCase().indexOf(needle) !== -1;
  }

  function visibleTasks() {
    var chosen = tasks;

    if (filter === "active") {
      chosen = tasks.filter(function (task) {
        return !task.done;
      });
    } else if (filter === "done") {
      chosen = tasks.filter(function (task) {
        return task.done;
      });
    }

    var needle = query.trim().toLowerCase();
    if (needle === "") {
      return chosen;
    }

    return chosen.filter(function (task) {
      return matchesSearch(task, needle);
    });
  }

  function buildTaskRow(task) {
    var row = document.createElement("li");
    row.className = "task" + (task.done ? " is-done" : "");
    row.dataset.id = task.id;

    var label = document.createElement("label");

    var box = document.createElement("input");
    box.type = "checkbox";
    box.checked = task.done;
    box.setAttribute("aria-label", task.done ? "Mark as not done" : "Mark as done");

    var text = document.createElement("span");
    text.className = "text";
    text.textContent = task.text;

    label.appendChild(box);
    label.appendChild(text);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", "Delete task: " + task.text);

    row.appendChild(label);
    row.appendChild(remove);
    return row;
  }

  function render() {
    var shown = visibleTasks();

    list.textContent = "";
    shown.forEach(function (task) {
      list.appendChild(buildTaskRow(task));
    });

    if (shown.length === 0) {
      emptyMessage.textContent =
        query.trim() === ""
          ? "Nothing to do for the dog right now. Add the first task above."
          : "No task matches your search.";
    }
    emptyMessage.hidden = shown.length !== 0;

    var left = tasks.filter(function (task) {
      return !task.done;
    }).length;
    counter.textContent = left + (left === 1 ? " item left" : " items left");

    filterButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.filter === filter ? "true" : "false");
    });
  }

  /* ---------- actions: add, tick, delete, filter ---------- */

  function addTask(text) {
    var clean = text.trim();
    if (clean === "") {
      return;
    }
    tasks.push(makeTask(clean));
    filter = "all";
    query = "";
    searchInput.value = "";
    saveTasks();
    render();
  }

  function toggleTask(id) {
    tasks.forEach(function (task) {
      if (task.id === id) {
        task.done = !task.done;
      }
    });
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (task) {
      return task.id !== id;
    });
    saveTasks();
    render();
  }

  /* ---------- start the app ---------- */

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    addTask(input.value);
    input.value = "";
    input.focus();
  });

  list.addEventListener("change", function (event) {
    if (event.target.type !== "checkbox") {
      return;
    }
    var row = event.target.closest(".task");
    if (row) {
      toggleTask(row.dataset.id);
    }
  });

  list.addEventListener("click", function (event) {
    if (!event.target.classList.contains("delete")) {
      return;
    }
    var row = event.target.closest(".task");
    if (row) {
      deleteTask(row.dataset.id);
    }
  });

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filter = button.dataset.filter;
      render();
    });
  });

  searchInput.addEventListener("input", function () {
    query = searchInput.value;
    render();
  });

  tasks = loadTasks();
  saveTasks(); // remember the first list, and repair broken saved data
  render();
})();
