
document.querySelector("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.querySelector("#message");
  message.textContent = "Logging in...";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email: document.querySelector("#email").value.trim(),
        password: document.querySelector("#password").value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed");
    location.href = "index.html";
  } catch (error) {
    message.textContent = error.message;
  }
});

