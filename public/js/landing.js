document.addEventListener("DOMContentLoaded", async () => {
  const userNameElement = document.getElementById("user-name");
  const userAvatarElement = document.getElementById("user-avatar");
  const welcomeMessageElement = document.getElementById("welcome-message");
  const studentPanelLink = document.getElementById("student-panel-link");
  const teacherPanelLink = document.getElementById("teacher-panel-link");
  const contentFrame = document.getElementById("content-frame");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const logoutButton = document.getElementById("logout-button");

  // Mobile sidebar toggle
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("-translate-x-full");
  });

  // Logout button
  logoutButton.addEventListener("click", async () => {
    try {
      // Clear the sync flag on logout
      sessionStorage.removeItem("hasSynced");
      await fetch("http://localhost:3001/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during signout:", error);
    } finally {
      window.location.href = "./login.html";
    }
  });

  try {
    const response = await fetch("http://localhost:3001/api/me", { credentials: "include" });

    if (!response.ok) {
      // If not authenticated, redirect to login
      window.location.href = "./login.html";
      return;
    }

    const user = await response.json();

    // Update user info in the header
    if (userNameElement) {
      userNameElement.textContent = user.name;
    }
    if (welcomeMessageElement) {
        welcomeMessageElement.textContent = `Bienvenido, ${user.name}`;
    }
    if (userAvatarElement) {
      userAvatarElement.src = `https://i.pravatar.cc/32?u=${user.name}`;
    }

    // Sync data only once per session
    if (!sessionStorage.getItem("hasSynced")) {
      if (welcomeMessageElement) {
        welcomeMessageElement.textContent = `Bienvenido, ${user.name}. Sincronizando datos...`;
      }

      try {
        const syncResponse = await fetch(`http://localhost:3001/api/sync/${user.role}`, { credentials: "include" });
        if (!syncResponse.ok) {
          throw new Error(`Sync failed with status ${syncResponse.status}`);
        }
        sessionStorage.setItem("hasSynced", "true");
      } catch (syncError) {
        console.error("Error during data sync:", syncError);
        if (welcomeMessageElement) {
          welcomeMessageElement.textContent = `Bienvenido, ${user.name}. Error de sincronización.`;
        }
      } finally {
        if (welcomeMessageElement) {
            welcomeMessageElement.textContent = `Bienvenido, ${user.name}`;
        }
      }
    }

    // Show/hide panels based on role
    if (user.role === "teacher") {
      if (teacherPanelLink) teacherPanelLink.classList.remove("hidden");
      if (studentPanelLink) studentPanelLink.classList.add("hidden");
      if (contentFrame) contentFrame.src = "./TeacherPanel.html";
      if (teacherPanelLink) teacherPanelLink.classList.add("bg-gray-700", "text-white");
    } else { // Default to student
      if (studentPanelLink) studentPanelLink.classList.remove("hidden");
      if (teacherPanelLink) teacherPanelLink.classList.add("hidden");
      if (contentFrame) contentFrame.src = "./StudentPanel.html";
      if (studentPanelLink) studentPanelLink.classList.add("bg-gray-700", "text-white");
    }

  } catch (error) {
    console.error("Error fetching user data:", error);
    window.location.href = "./login.html";
  }
});