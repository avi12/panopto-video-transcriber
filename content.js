let videoUrl = document.querySelector("video")?.src;
new MutationObserver((_, observer) => {
  const elVideos = [...document.querySelectorAll("video")];
  const urlValid = elVideos.find(elVideo => elVideo?.src);
  videoUrl = urlValid?.src;
  observer.disconnect();
}).observe(document, { childList: true, subtree: true });

chrome.storage.onChanged.addListener(changes => {
  if (changes.videoUrl?.newValue) {
    videoUrl = changes.videoUrl.newValue;
  }
})

function createButton() {
  const elButton = document.createElement("button");
  elButton.textContent = "Transcribe Video";
  return elButton;
}

function addButton() {
  const elParent = document.querySelector("#settingsButton");
  const elButton = createButton();
  elParent.insertAdjacentElement("beforebegin", elButton);
  elButton.addEventListener("click", async e => {
    e.preventDefault();
    await chrome.runtime.sendMessage({
      type: "get-video",
      payload: {
        url: videoUrl
      }
    })
  });
}

addButton();
