

/*
// Listen for custom event from chess game when a move is made
window.addEventListener('chessMoveMade', function(e) {
  const boardData = e.detail.boardData;
  console.log("♟️ Move made, sending board data to extension:", boardData);
  chrome.runtime.sendMessage(
    {
      type: "CHECK_CHESS",
      boardData: boardData
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("❌ Runtime error:", chrome.runtime.lastError.message);
      } else {
        console.log("📨 AI Response: ", response);
        // If AI returns a move, apply it to the board
        if (response && response.data && response.data.result && window.tryMoveNotation) {
          // Expecting format: "E2,E4" or similar
          const move = response.data.result.trim().split(',');
          if (move.length === 2) {
            const from = move[0].toUpperCase();
            const to = move[1].toUpperCase();
            const moveSuccess = window.tryMoveNotation(from, to);
            console.log("AI Move success:", moveSuccess);
          }
        }
      }
    }
  );
});
*/