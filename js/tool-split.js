document.addEventListener("DOMContentLoaded", () => {
  const totalEl = document.querySelector("#split-total");
  const peopleEl = document.querySelector("#split-people");
  const resultEl = document.querySelector("#split-result");
  const btn = document.querySelector("#split-run");
  if (!totalEl || !peopleEl || !resultEl || !btn) return;

  btn.addEventListener("click", () => {
    const total = Number(totalEl.value);
    const people = Number(peopleEl.value);
    if (!total || !people) {
      resultEl.textContent = "金額と人数を入力してください。";
      return;
    }
    const each = Math.ceil((total / people) * 100) / 100;
    resultEl.textContent = `1人あたり: ${each.toLocaleString()} 円`;
  });
});
