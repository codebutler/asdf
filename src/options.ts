const emailInput = document.getElementById("email") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

chrome.storage.sync.get("overrideEmail", (data) => {
  emailInput.value = data.overrideEmail || "";
});

let timeout: ReturnType<typeof setTimeout>;
emailInput.addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    chrome.storage.sync.set({ overrideEmail: emailInput.value.trim() });
    statusEl.style.opacity = "1";
    setTimeout(() => (statusEl.style.opacity = "0"), 1500);
  }, 300);
});
