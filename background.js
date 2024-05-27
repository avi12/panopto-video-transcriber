chrome.webRequest.onBeforeRequest.addListener(({url}) => {
    if (url.includes("master.m3u8")) {
      chrome.storage.local.set({ videoUrl: url});
    }
  },
  {urls: ["https://*.cloudfront.net/*"]},
);

async function transcribeVideo(payload, sender) {
  const portConvertToMp3 = chrome.runtime.connect({name: "convert-with-ffmpeg"});
  const dataUrl = await new Promise(resolve => {
    portConvertToMp3.onMessage.addListener(resolve);
    portConvertToMp3.postMessage({
      url: payload.url
    });
  });
  const regexInvalidChars = /[<>:"\/\\|?*]/g;
  await chrome.downloads.download({
    url: dataUrl,
    filename: sender.tab.title.replace(regexInvalidChars, "") + ".mp3"
  });
}

chrome.runtime.onMessage.addListener(async ({ type, payload }, sender, sendResponse) => {
  if (type !== "get-video") {
    return;
  }

  if (await chrome.offscreen.hasDocument()) {
    await transcribeVideo(payload, sender);
    return;
  }

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("offscreen/offscreen.html"),
    reasons: ["BLOBS"],
    justification: "Transcribe video"
  });

  await transcribeVideo(payload, sender);
})
