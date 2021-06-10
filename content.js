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

      let buffer_healths = [];

      // Flatten the buffers
      for (let i = 0; i < video_player.buffered.length; i++) {
        buffer_healths.push(
          video_player.buffered.end(i) - video_player.buffered.start(i)
        );
      }

      sendResponse({
        buffer_healths: buffer_healths,
        view_width: video_player.clientWidth,
        view_height: video_player.clientHeight,
      });
    }
  });
}

main();
