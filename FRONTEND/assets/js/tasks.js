
const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const descriptionInput = document.querySelector("#task-description");
const formStatus = document.querySelector("#form-status");
const tasksTable = document.querySelector("#tasks-table");
const tasksStatus = document.querySelector("#tasks-status");
const createButton = document.querySelector("#create-button");

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function makeCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text ?? "";
  return cell;
}

function makeButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", action);
  return button;
}

async function loadTasks() {
  tasksStatus.textContent = "Loading tasks...";
  tasksTable.replaceChildren();

  try {
    const result = await apiRequest("/api/tasks");
    const tasks = Array.isArray(result) ? result : (result.tasks || []);

    if (tasks.length === 0) {
      const row = document.createElement("tr");
      const cell = makeCell("No tasks yet. Create your first task above.");
      cell.colSpan = 5;
      cell.className = "empty-state";
      row.appendChild(cell);
      tasksTable.appendChild(row);
    } else {
      tasks.forEach(task => {
        const row = document.createElement("tr");
        row.appendChild(makeCell(`#${task.id}`));
        row.appendChild(makeCell(task.title));
        row.appendChild(makeCell(task.description || "—"));

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `badge ${task.completed ? "badge-success" : "badge-warning"}`;
        badge.textContent = task.completed ? "Completed" : "In progress";
        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        const actionsCell = document.createElement("td");

        if (!task.completed) {
          actionsCell.appendChild(
            makeButton("Complete", "btn btn-secondary btn-small", async () => {
              try {
                await apiRequest(`/api/tasks/${task.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ completed: true })
                });
                await loadTasks();
              } catch (error) {
                tasksStatus.textContent = `Could not complete task: ${error.message}`;
                tasksStatus.className = "status-message status-error";
              }
            })
          );
        }

        actionsCell.appendChild(
          makeButton("Delete", "btn btn-danger btn-small", async () => {
            if (!confirm(`Delete task "${task.title}"?`)) return;

            try {
              await apiRequest(`/api/tasks/${task.id}`, {
                method: "DELETE"
              });
              await loadTasks();
            } catch (error) {
              tasksStatus.textContent = `Could not delete task: ${error.message}`;
              tasksStatus.className = "status-message status-error";
            }
          })
        );

        row.appendChild(actionsCell);
        tasksTable.appendChild(row);
      });
    }

    tasksStatus.textContent = `${tasks.length} task(s) loaded successfully.`;
    tasksStatus.className = "status-message";
  } catch (error) {
    tasksStatus.textContent = `Unable to load tasks: ${error.message}`;
    tasksStatus.className = "status-message status-error";

    const row = document.createElement("tr");
    const cell = makeCell("Check that Docker and the Flask API are running.");
    cell.colSpan = 5;
    cell.className = "empty-state";
    row.appendChild(cell);
    tasksTable.appendChild(row);
  }
}

taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title) {
    formStatus.textContent = "Please enter a task title.";
    return;
  }

  createButton.disabled = true;
  formStatus.textContent = "Creating task...";

  try {
    await apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, description })
    });

    taskForm.reset();
    formStatus.textContent = "Task created successfully.";
    formStatus.className = "status-message";
    await loadTasks();
  } catch (error) {
    formStatus.textContent = `Could not create task: ${error.message}`;
    formStatus.className = "status-message status-error";
  } finally {
    createButton.disabled = false;
  }
});

document.querySelector("#refresh-tasks").addEventListener("click", loadTasks);

loadTasks();
