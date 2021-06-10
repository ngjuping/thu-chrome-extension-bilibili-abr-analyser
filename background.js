let abr_logs = {};

chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.set({ logs: abr_logs }, function () {
    console.log("Logs saved", abr_logs);
  });
});

chrome.tabs.onUpdated.addListener((tab_id, change_info, tab) => {
  if (
    "url" in tab &&
    (change_info["status"] === "complete" || "title" in change_info)
  ) {
    if (tab.url.includes("https://www.bilibili.com/video/")) {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ["content.js"],
        })
        .then();
      // If log exists
      if (tab_id.toString() in abr_logs) {
        // If url has changed (clicked on other video link) , update log info
        if (tabUrlChanged(tab) === true) {
          updateTabAbrLogInfo(tab);
        }
        // Update title if necessary
        if ("title" in change_info) {
          abr_logs[tab_id]["title"] = change_info["title"];
        }
      }
      // Create new log if log doesn't exist
      else {
        createLog(tab);
      }
    }
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "get_logs") {
    // Save logs if there are any
    if (Object.keys(abr_logs).length !== 0) {
      chrome.storage.local.set({ logs: abr_logs }, function () {
        console.log("Logs saved", abr_logs);
      });
      console.log("Sending logs");
      console.log(abr_logs);
      sendResponse({ data: abr_logs });
    }
    // Else get log from storage
    else {
      chrome.storage.local.get("logs", function (result) {
        if (result["logs"] !== undefined) {
          abr_logs = result["logs"];
        }
      });
      console.log("Sending logs from storage");
      console.log(abr_logs);
      sendResponse({ data: abr_logs });
    }
  } else if (request.action === "clear_logs") {
    chrome.storage.local.remove("logs", () => {
      console.log("Storage logs cleared.");
    });
    abr_logs = {};
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    const requestId = details.requestId;
    const url = details.url;
    const qualityStrLen = 3;

    let videoQualityIndex = url.search(".m4s") - 3;
    let quality = parseInt(
      url.slice(videoQualityIndex, videoQualityIndex + qualityStrLen)
    );
    let buffer_health = 0;
    let view_width = 0;
    let view_height = 0;

    chrome.tabs.get(details.tabId, (tab) => {
      console.log(`Measuring ABR on \n ${tab.title}`);

      if (!(tab.id.toString() in abr_logs)) {
        createLog(tab);
      }

      chrome.tabs.sendMessage(
        tab.id,
        { action: "get_video_info" },
        function (response) {
          // Set buffer health value
          if (response === undefined) {
            if (chrome.runtime.lastError) {
              // console.warn(chrome.runtime.lastError.message)
              console.warn(`Can't get video's info.`);
            }
          } else {
            console.log(response);
            buffer_health = response.buffer_health;
            view_width = response.view_width;
            view_height = response.view_height;
          }

          // Append log data
          let log_data = `${Date.now()},${quality},${buffer_health},${view_width},${view_height}`;
          abr_logs[tab.id]["data"].push(log_data);
          abr_logs[tab.id]["requestId"].push(requestId);
        }
      );
    });
  },
  { urls: ["https://upos-hz-mirrorakam.akamaized.net/*"] }
);

chrome.webRequest.onResponseStarted.addListener(
  (details) => {
    const { tabId, requestId } = details;

    let index = abr_logs[tabId]["requestId"].indexOf(requestId);
    let clen_obj = details.responseHeaders.filter((o) => {
      return o.name == "Content-Length";
    })[0];

    abr_logs[tabId]["data"][index] += `,${clen_obj.value}`;
    console.log(abr_logs[tabId]["data"][index]);
  },
  { urls: ["https://upos-hz-mirrorakam.akamaized.net/*"] },
  ["responseHeaders"]
);

function tabUrlChanged(tab) {
  return tab.url === abr_logs[tab.id]["url"];
}

function updateTabAbrLogInfo(tab) {
  abr_logs[tab.id]["url"] = tab.url;
  abr_logs[tab.id]["title"] = tab.title;
}

function createLog(tab) {
  abr_logs[tab.id] = {};
  abr_logs[tab.id]["header"] =
    "datetime,quality,buffer_health,view_width,view_height,clen";
  abr_logs[tab.id]["data"] = [];
  abr_logs[tab.id]["requestId"] = [];
  abr_logs[tab.id]["title"] = tab.title;
  abr_logs[tab.id]["url"] = tab.url;
  console.log(`Added ABR log for \n ${tab.id} - ${tab.title}`);
}
