
(async function () {
  "use strict";

  const status = document.querySelector("#dashboard-status");
  const recent = document.querySelector("#recent-tasks");

  const totalEl = document.querySelector("#total-tasks");
  const completedEl = document.querySelector("#completed-tasks");
  const pendingEl = document.querySelector("#pending-tasks");
  const rateEl = document.querySelector("#completion-rate");

  if (!status || !recent) {
    console.error("Dashboard elements not found.");
    return;
  }

  function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text ?? "";
    row.appendChild(cell);
    return cell;
  }

  
  function renderTask(task) {
    const row = document.createElement("tr");

    // 1. Task ID — first column
    addCell(row, `#${task.id}`);

    // 2. Task title
    addCell(row, task.title || "Untitled task");

    // 3. Assigned user and avatar
    const userCell = document.createElement("td");
    const userWrap = document.createElement("div");
    userWrap.className = "assigned-user";

    const username = task.assigned_user || "Unassigned";

    const avatar = document.createElement("span");
    avatar.className = "user-avatar";
    avatar.textContent = username.charAt(0).toUpperCase();

    const name = document.createElement("span");
    name.className = "assigned-user-name";
    name.textContent = username;

    userWrap.append(avatar, name);
    userCell.appendChild(userWrap);
    row.appendChild(userCell);

    // 4. Status
    const isCompleted =
      task.completed === true ||
      task.completed === 1 ||
      task.completed === "1";

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");

    badge.className = isCompleted
      ? "badge badge-success"
      : "badge badge-warning";

    badge.textContent = isCompleted ? "Completed" : "In progress";

    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    return row;
  }


  try {
    status.textContent = "Loading tasks...";

    const response = await fetch("/api/tasks", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const result = await response.json();

    const tasks = Array.isArray(result)
      ? result
      : Array.isArray(result.tasks)
        ? result.tasks
        : Array.isArray(result.value)
          ? result.value
          : [];

    const isCompleted = task =>
      task.completed === true ||
      task.completed === 1 ||
      task.completed === "1";

    const completed = tasks.filter(isCompleted).length;
    const pending = tasks.length - completed;
    const rate = tasks.length
      ? Math.round(completed * 100 / tasks.length)
      : 0;

    if (totalEl) totalEl.textContent = tasks.length;
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;
    if (rateEl) rateEl.textContent = `${rate}%`;

    recent.replaceChildren();

    if (tasks.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 4;
      cell.className = "empty-state";
      cell.textContent = "No tasks yet. Create your first task.";

      row.appendChild(cell);
      recent.appendChild(row);
    } else {
      tasks.slice(0, 5).forEach(task => {
        recent.appendChild(renderTask(task));
      });
    }

    status.textContent = "Dashboard data loaded from the Flask API.";
    status.className = "status-message";

    console.log("Updated dashboard.js loaded.");
    console.log("Assigned-user rendering verified:",
      recent.querySelectorAll(".assigned-user").length
    );

  } catch (error) {
    console.error("Dashboard error:", error);

    status.textContent = `Unable to load dashboard data: ${error.message}`;
    status.className = "status-message status-error";

    recent.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "Unable to load tasks. Please refresh.";
    row.appendChild(cell);
    recent.appendChild(row);
  }
})();
