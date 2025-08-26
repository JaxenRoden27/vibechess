
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_CHESS") {
    const url = "https://chessbros.onrender.com/analyze"; 
    const payload = JSON.stringify({
      player_moves: message.player_moves,
      most_recent_move: message.most_recent_move,
      level: message.level
    });

    console.log("📡 Sending POST to:", url);
    console.log("🧾 With payload:", payload);

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    })
      .then(res => res.json())
      .then(data => {
        console.log("Response:", data);
        if (data.error) {
          console.error("❌ API Error:", data.error);
          sendResponse({ success: false, error: data.error });
          return;
        }

        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error("❌ Fetch failed");
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});