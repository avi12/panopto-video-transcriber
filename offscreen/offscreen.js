const {FFmpeg} = FFmpegWASM;
const {fetchFile} = FFmpegUtil;
const ffmpeg = new FFmpeg();

async function getVideoBinary(url) {
  if (!url.includes(".m3u8")) {
    return fetchFile(url);
  }
  const masterM3u8 = await (await fetch(url)).text();
  const firstIndexM3u8 = masterM3u8.split("\n").findLast(line => line.match(/(?:.*\/)?index\.m3u8/)).split("/")[0];
  const urlBase = url.match(/(.*\/)/)[1];
  const urlFragmented = urlBase + firstIndexM3u8 + "/fragmented.mp4";
  return fetchFile(urlFragmented);
}

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(async ({url}) => {
    if (port.name === "convert-with-ffmpeg") {
      ffmpeg.on("log", ({message}) => console.log(message));
      ffmpeg.on("progress", ({progress}) => console.log("Progress:", progress));
      await ffmpeg.load({coreURL: chrome.runtime.getURL("lib/ffmpeg-core.js")});
      const videoBinary = await getVideoBinary(url);
      const filenameInput = "input.mp4";
      const filenameOutput = "output.aac";
      await ffmpeg.writeFile(filenameInput, videoBinary);
      await ffmpeg.exec(["-i", filenameInput, "-c", "copy", filenameOutput]);
      const data = await ffmpeg.readFile(filenameOutput);
      const dataUrl = URL.createObjectURL(new Blob([data.buffer], {type: "audio/aac"}));
      port.postMessage(dataUrl);
      return
    }

    if (port.name === "transcribe-video") {

    }
  })
})
