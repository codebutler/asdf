const fields = ["email", "firstName", "lastName", "password"] as const;
const inputs = Object.fromEntries(
  fields.map((id) => [id, document.getElementById(id) as HTMLInputElement]),
);
const statusEl = document.getElementById("status") as HTMLDivElement;

chrome.storage.sync.get("overrides", (data) => {
  const overrides = data.overrides ?? {};
  for (const field of fields) {
    inputs[field].value = overrides[field] || "";
  }
});

let timeout: ReturnType<typeof setTimeout>;
const save = () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const overrides = Object.fromEntries(
      fields.map((id) => [id, inputs[id].value.trim()]).filter(([, v]) => v),
    );
    chrome.storage.sync.set({ overrides });
    statusEl.style.opacity = "1";
    setTimeout(() => (statusEl.style.opacity = "0"), 1500);
  }, 300);
};

for (const field of fields) {
  inputs[field].addEventListener("input", save);
}
