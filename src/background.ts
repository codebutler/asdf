import contentScript from "./content?script";

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    files: [contentScript],
    injectImmediately: true,
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getBaseEmail") {
    chrome.storage.sync.get("overrideEmail", (data) => {
      if (data.overrideEmail) {
        sendResponse(data.overrideEmail);
      } else {
        chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (userInfo) => {
          sendResponse(userInfo.email || null);
        });
      }
    });
    return true;
  }
});
