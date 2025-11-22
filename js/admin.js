document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#admin-form");
  const input = document.querySelector("#admin-password");
  const message = document.querySelector("#admin-message");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value === "letmein") {
      localStorage.setItem("mcommon_admin", "true");
      location.href = "/index.html";
    } else if (message) {
      message.textContent = "パスワードが違います。";
    }
  });
});
