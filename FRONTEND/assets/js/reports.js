
const serviceIds = {
  frontend: "frontend-status",
  backend: "backend-status",
  database: "database-status"
};

function setServiceStatus(id, healthy, label) {
  const element = document.getElementById(id);
  element.className = `badge ${healthy ? "badge-success" : "badge-warning"}`;
  element.textContent = label;
}

async function refreshHealth() {
  const message = document.querySelector("#health-message");
  message.textContent = "Checking application services...";

  setServiceStatus(serviceIds.frontend, true, "Page loaded");

  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error(`Health endpoint returned HTTP ${response.status}`);

    const health = await response.json();

    setServiceStatus(serviceIds.backend, true, "Reachable");

    const dbHealthy =
      health.database === "connected" ||
      health.database === "healthy" ||
      health.db === "connected" ||
      health.db === "healthy" ||
      health.database_status === "connected";

    setServiceStatus(
      serviceIds.database,
      dbHealthy,
      dbHealthy ? "Connected" : "Check health response"
    );

    message.textContent = "Health endpoint responded successfully.";
  } catch (error) {
    setServiceStatus(serviceIds.backend, false, "Unavailable");
    setServiceStatus(serviceIds.database, false, "Unverified");
    message.textContent = `Health check failed: ${error.message}`;
    message.className = "status-message status-error";
  }

  try {
    const response = await fetch("/api/tasks");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    const tasks = Array.isArray(result) ? result : (result.tasks || []);
    const completed = tasks.filter(task => Boolean(task.completed)).length;
    const total = tasks.length;

    document.querySelector("#report-total").textContent = total;
    document.querySelector("#report-completed").textContent = completed;
    document.querySelector("#report-pending").textContent = total - completed;
    document.querySelector("#report-rate").textContent =
      `${total ? Math.round(completed * 100 / total) : 0}%`;
  } catch (error) {
    document.querySelector("#report-total").textContent = "Unavailable";
    document.querySelector("#report-completed").textContent = "—";
    document.querySelector("#report-pending").textContent = "—";
    document.querySelector("#report-rate").textContent = "—";
  }

  document.querySelector("#last-checked").textContent = new Date().toLocaleString();
}

document.querySelector("#refresh-health").addEventListener("click", refreshHealth);
refreshHealth();
