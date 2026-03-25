import contentScript from "./content?script";

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    files: [contentScript],
    injectImmediately: true,
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getOverrides") {
    chrome.storage.sync.get("overrides", (data) => {
      const overrides = data.overrides ?? {};
      if (overrides.email) {
        sendResponse(overrides);
      } else {
        chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (userInfo) => {
          sendResponse({ ...overrides, email: userInfo.email || null });
        });
      }
    });
    return true;
  }
});
