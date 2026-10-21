
(async function () {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const health = await response.json();
    console.log("Application health:", health);
  } catch (error) {
    console.error("Could not check application health:", error);
  }
})();
