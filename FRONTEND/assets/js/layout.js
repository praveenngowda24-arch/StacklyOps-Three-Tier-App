
(() => {
  const page = location.pathname.split("/").pop() || "index.html";

  const links = [
    { file: "index.html", label: "Dashboard", icon: "▦" },
    { file: "tasks.html", label: "Tasks", icon: "✓" },
    { file: "projects.html", label: "Projects", icon: "◈" },
    { file: "reports.html", label: "Reports & Health", icon: "◷" }
  ];

  const sidebar = document.querySelector("#app-sidebar");
  const topbar = document.querySelector("#app-topbar");

  async function startApp() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "same-origin"
      });

      if (!response.ok) throw new Error("Unable to check session");

      const data = await response.json();

      if (!data.user) {
        location.replace("login.html");
        return;
      }

      const user = data.user;
      const username = user.username || "User";
      const email = user.email || "";
      const role = user.role || "user";
      const initials = username
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      if (sidebar) {
        sidebar.innerHTML = `
          <a class="brand" href="index.html">
            <span class="brand-mark">S</span>
            <span>Stackly<span style="color:#829cff">Ops</span></span>
          </a>
          <div class="nav-label">Workspace</div>
          <nav aria-label="Main navigation">
            ${links.map(link => `
              <a class="nav-link ${page === link.file ? "active" : ""}"
                 href="${link.file}"
                 ${page === link.file ? 'aria-current="page"' : ""}>
                <span class="nav-icon" aria-hidden="true">${link.icon}</span>
                <span>${link.label}</span>
              </a>
            `).join("")}
          </nav>
          <div class="sidebar-bottom">
            <strong>Stackly Three-Tier</strong><br>
            DevOps demonstration environment<br>
            <span id="sidebar-health">Checking API...</span>
          </div>
        `;
      }

      if (topbar) {
        const current = links.find(link => link.file === page);

        topbar.innerHTML = `
          <button class="menu-toggle" id="menu-toggle"
                  type="button" aria-label="Toggle navigation"
                  aria-expanded="false">☰</button>

          <div class="topbar-heading">
            <div class="breadcrumb">Workspace / ${current?.label || "Application"}</div>
            <div class="topbar-title">${current?.label || "Application"}</div>
          </div>

          <div class="profile-wrap" id="profile-wrap">
            <button class="profile-trigger" id="profile-trigger"
                    type="button" aria-expanded="false"
                    aria-controls="profile-menu" aria-label="Open user profile menu">
              <span class="profile-avatar" aria-hidden="true">${initials}</span>
              <span class="profile-summary">
                <span class="profile-name"></span>
                <span class="profile-role"></span>
              </span>
              <svg class="profile-chevron" viewBox="0 0 24 24"
                   width="17" height="17" fill="none"
                   stroke="currentColor" stroke-width="2"
                   aria-hidden="true">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>

            <div class="profile-menu hidden" id="profile-menu">
              <div class="profile-menu-header">
                <span class="profile-avatar profile-avatar-large"
                      aria-hidden="true">${initials}</span>
                <div class="profile-menu-identity">
                  <strong class="profile-menu-name"></strong>
                  <span class="profile-menu-email"></span>
                  <span class="profile-role-badge"></span>
                </div>
              </div>
              <div class="profile-menu-divider"></div>
              <button class="profile-menu-item" id="profile-account"
                      type="button">
                <span aria-hidden="true">♙</span>
                Account information
              </button>
              <button class="profile-menu-item profile-logout"
                      id="logout-button" type="button">
                <span aria-hidden="true">↪</span>
                Log out
              </button>
              <p class="profile-account-note hidden" id="profile-account-note">
                Signed in account details are shown above.
              </p>
            </div>
          </div>
        `;

        // Insert account data as text, never as HTML.
        topbar.querySelector(".profile-name").textContent = username;
        topbar.querySelector(".profile-role").textContent =
          role === "admin" ? "Administrator" : "Standard user";
        topbar.querySelector(".profile-menu-name").textContent = username;
        topbar.querySelector(".profile-menu-email").textContent =
          email || "Email not available";
        topbar.querySelector(".profile-role-badge").textContent =
          role === "admin" ? "Administrator" : "User";

        const profileWrap = document.querySelector("#profile-wrap");
        const profileTrigger = document.querySelector("#profile-trigger");
        const profileMenu = document.querySelector("#profile-menu");

        function closeProfileMenu() {
          profileMenu?.classList.add("hidden");
          profileTrigger?.setAttribute("aria-expanded", "false");
        }

        profileTrigger?.addEventListener("click", event => {
          event.stopPropagation();
          const opening = profileMenu.classList.contains("hidden");
          profileMenu.classList.toggle("hidden", !opening);
          profileTrigger.setAttribute("aria-expanded", String(opening));
        });

        document.addEventListener("click", event => {
          if (profileWrap && !profileWrap.contains(event.target)) {
            closeProfileMenu();
          }
        });

        document.addEventListener("keydown", event => {
          if (event.key === "Escape") {
            closeProfileMenu();
            profileTrigger?.focus();
          }
        });

        document.querySelector("#profile-account")?.addEventListener("click", () => {
          const note = document.querySelector("#profile-account-note");
          note.classList.toggle("hidden");
        });

        document.querySelector("#menu-toggle")?.addEventListener("click", event => {
          const isOpen = sidebar?.classList.toggle("open") || false;
          event.currentTarget.setAttribute("aria-expanded", String(isOpen));
        });

        document.querySelector("#logout-button")?.addEventListener("click", async event => {
          const button = event.currentTarget;
          button.disabled = true;
          button.lastChild.textContent = " Logging out...";

          try {
            const logoutResponse = await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "same-origin"
            });

            if (!logoutResponse.ok) {
              throw new Error("Logout request failed");
            }

            location.replace("login.html");
          } catch (error) {
            console.error("Logout failed:", error);
            button.disabled = false;
            button.lastChild.textContent = " Log out";
            alert("Unable to log out. Please try again.");
          }
        });
      }

      fetch("/api/health")
        .then(response => {
          if (!response.ok) throw new Error("API unavailable");
          return response.json();
        })
        .then(data => {
          const health = document.querySelector("#sidebar-health");
          if (health) {
            const connected = data.database === "connected";
            health.textContent = connected
              ? "● API and database connected"
              : "● Database unavailable";
            health.style.color = connected ? "#80e0b4" : "#ffb4b4";
          }
        })
        .catch(() => {
          const health = document.querySelector("#sidebar-health");
          if (health) {
            health.textContent = "● API connection unavailable";
            health.style.color = "#ffb4b4";
          }
        });

    } catch (error) {
      console.error("Session check failed:", error);
      const message = document.createElement("p");
      message.textContent =
        "Unable to connect to the application. Check that the services are running and refresh.";
      message.style.padding = "24px";
      document.body.prepend(message);
    }
  }

  startApp();
})();
