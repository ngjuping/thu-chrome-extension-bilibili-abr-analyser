function main() {
  console.log(`
      =====================================
      ==        ABR Traffic Analyser     ==
      =====================================
  `);

  let [video_player] = document.getElementsByTagName("video");

  // console.log(video_player);
  if (video_player === undefined) {
    console.log("ABR Traffic Analyser - No video player found");
    return true;
  }

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "get_video_info") {
      console.log(video_player);
      video_player = document.getElementsByTagName("video")[0];

      sendResponse({
        buffer_health:
          video_player.buffered.end(0) - video_player.buffered.start(0),
        view_width: video_player.videoWidth,
        view_height: video_player.videoHeight,
      });
    }
  });
}

main();
