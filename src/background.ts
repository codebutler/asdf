import contentScript from "./content?script";

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    files: [contentScript],
    injectImmediately: true,
  });
});
