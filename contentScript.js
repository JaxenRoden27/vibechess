
function sendChessAnalysis() {
  // This is where you would get the moves from the player
  var playerMoves = "e2e4 e7e5 g1f3"; // Example moves
  var mostRecentMove = "g1f3";         // Example most recent move
  var level = 1;                        // Example level

  chrome.runtime.sendMessage(
    {
      type: "CHECK_CHESS",
      player_moves: playerMoves,
      most_recent_move: mostRecentMove,
      level: level
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("❌ Runtime error:", chrome.runtime.lastError.message);
      } else {
        console.log("📨 Background Responded ", response);
        // HANDLE THE RESPONSE like moving the pieces here
      }
    }
  );
}

sendChessAnalysis();
