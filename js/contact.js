document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form");
  const submit = document.querySelector("#contact-submit");
  const email = document.querySelector("#contact-email");
  const body = document.querySelector("#contact-body");
  const message = document.querySelector("#contact-message");
  if (!form || !submit || !email || !body) return;

  form.addEventListener("input", () => {
    submit.disabled = !(email.value.trim() && body.value.trim());
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.reset();
    submit.disabled = true;
    if (message) message.textContent = "お問い合わせありがとうございました";
  });
});
