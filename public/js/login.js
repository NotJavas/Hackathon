document.addEventListener("DOMContentLoaded", () => {
  const toastContainer = document.getElementById("toast-container");
  const btn = document.getElementById("google-login");

  function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function checkAuthStatus() {
    try {
      const res = await fetch("http://localhost:3001/auth/status", { credentials: "include" });
      if (res.ok) {
        const { authenticated } = await res.json();
        if (authenticated) {
          // Usuario ya autenticado, vamos directo al landing
          window.location.href = "./landing.html";
          return true;
        }
      } else {
        sessionStorage.removeItem("hasSynced");
      }
    } catch (e) {
      sessionStorage.removeItem("hasSynced");
    }
    return false;
  }

  btn?.addEventListener("click", () => {
    // Redirige al flujo OAuth del backend
    window.location.href = "http://localhost:3001/auth/initiate";
  });

  // Si ya hay sesión válida, redirigimos automáticamente
  checkAuthStatus().then((logged) => {
    if (!logged && !btn) {
      showToast("Botón de Google no disponible.", "error");
    }
  });
});
