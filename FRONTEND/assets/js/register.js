
document.querySelector("#register-form").addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.querySelector("#message");
  message.textContent = "Creating account...";

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        username: document.querySelector("#username").value.trim(),
        email: document.querySelector("#email").value.trim(),
        password: document.querySelector("#password").value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Registration failed");
    location.href = "index.html";
  } catch (error) {
    message.textContent = error.message;
  }
});

