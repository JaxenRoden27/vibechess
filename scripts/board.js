
// Convert board array to FEN string
function boardArrayToFEN(board, currentTurn = 'w') {
    let fen = '';
    for (let row = 0; row < 8; row++) {
        let empty = 0;
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (!piece) {
                empty++;
            } else {
                if (empty > 0) {
                    fen += empty;
                    empty = 0;
                }
                let symbol = '';
                switch (piece.type) {
                    case 'pawn': symbol = 'p'; break;
                    case 'rook': symbol = 'r'; break;
                    case 'knight': symbol = 'n'; break;
                    case 'bishop': symbol = 'b'; break;
                    case 'queen': symbol = 'q'; break;
                    case 'king': symbol = 'k'; break;
                }
                fen += piece.color === 'white' ? symbol.toUpperCase() : symbol;
            }
        }
        if (empty > 0) fen += empty;
        if (row < 7) fen += '/';
    }
    // Add turn, castling, en passant, halfmove, fullmove (basic)
    fen += ` ${currentTurn} - - 0 1`;
    return fen;
}

// Send board state to AI backend and apply AI move
function sendBoardToAI(boardData, retryCount = 0) {
    const fen = boardArrayToFEN(window.board, window.currentTurn === 'white' ? 'w' : 'b');
    // Browser-safe random integer between min (inclusive) and max (inclusive)
    function randomInt(min, max) {
        if (window.crypto && window.crypto.getRandomValues) {
            const range = max - min + 1;
            const maxUint32 = 0xFFFFFFFF;
            const rand = window.crypto.getRandomValues(new Uint32Array(1))[0] / (maxUint32 + 1);
            return Math.floor(rand * range) + min;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const seed = randomInt(1, 9999);
    var prompt = 
        "On a scale of 1 to 10, 10 being the best player in the world and 1 being someone who has minimal knowledge about chess, you are a 10. " +
        "You are always going to be the black pieces in the game. You will move one piece at a time. " +
    "You must only move a black piece, never a white piece. " +
    `The current state of the board is: ${fen} ` +
    `The move history of the game so far is: ${window.moveHistory} ` +
        "Based on the current state of the board, suggest a move for black that a beginner chess player might make in the same situation. " +
        "Beginners do not always make the exact same move, so you should introduce variety in your choices. " +
        "From all valid black beginner moves, pick one at random as if different beginners were making the decision. " +
        "Make sure that even though this is a beginner move, it is still a valid move according to chess rules. " +
        "Do not always choose the same move in the same situation. " +
        "Respond in the following format: COLUMNROW, COLUMNROW. " +
        "The first COLUMNROW is the black piece you are moving, the second COLUMNROW is the location on the board you are moving the black piece to. " +
        "Make sure you respond with exactly the format specified, making sure to include the comma and space between the COLUMNROW and the COLUMNROW. " +
        "Here are some example responses, this is only for you to learn from the formatting not the moves themselves: Example 1: E7, E5. Example 2: D7, D5. Example 3: C6, C5. Example 4: B7, C5. " +
        "Abide by all basic chess rules and remember you are always going to be black. " +
    "Only include the move in the specified chess notation, no additional text. " +
    `Use this Randomized number to vary your response: ${seed}`;

    
    if (retryCount > 0) {
        prompt += `Already have attempted previous move. Try to move a different piece. This move should still follow all basic chess rules.`;
    }

    fetch("https://chessbros.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardData: fen, moveHistory: window.moveHistory, prompt: prompt })
    })
    .then(res => res.json())
    .then(response => {
        if (response && response.result && window.makeAIMove) {
            const move = response.result.trim().split(',');
            if (move.length === 2) {
                const from = move[0].trim().toUpperCase();
                const to = move[1].trim().toUpperCase();
                const moveSuccess = makeAIMove(from, to);
                if (!moveSuccess && retryCount < 3) {
                    // Retry up to 3 times
                    sendBoardToAI(boardData, retryCount + 1);
                }
            }
        }
    })
    .catch(err => {
        console.error("❌ Fetch failed", err);
    });
}
// board.js

// Use the board from game.js as the source of truth
const board = window.board;

// DOM rendering and move logic
const chessboard = document.createElement('div');
chessboard.style.display = 'grid';
chessboard.style.gridTemplateColumns = 'repeat(8, 80px)';
chessboard.style.gridTemplateRows = 'repeat(8, 80px)';
chessboard.style.width = '640px';
chessboard.style.height = '640px';
chessboard.style.border = '2px solid black';
chessboard.id = 'chessboard';

// Create a container for the board and labels
const boardContainer = document.createElement('div');
boardContainer.style.position = 'relative';
boardContainer.style.width = '680px'; // 640px board + 40px for labels
boardContainer.style.height = '680px';
boardContainer.style.margin = '20px';
document.body.appendChild(boardContainer);

// Add the chessboard to the container
chessboard.style.position = 'absolute';
chessboard.style.left = '40px';
chessboard.style.top = '0px';
boardContainer.appendChild(chessboard);

// Add file (A-H) labels at the bottom
const fileLabels = document.createElement('div');
fileLabels.style.position = 'absolute';
fileLabels.style.left = '40px';
fileLabels.style.top = '640px';
fileLabels.style.width = '640px';
fileLabels.style.height = '40px';
fileLabels.style.display = 'flex';
fileLabels.style.justifyContent = 'space-between';
fileLabels.style.alignItems = 'center';
fileLabels.style.fontWeight = 'bold';
fileLabels.style.fontSize = '20px';
for (let i = 0; i < 8; i++) {
    const label = document.createElement('div');
    label.textContent = String.fromCharCode(65 + i); // 'A' to 'H'
    label.style.width = '80px';
    label.style.textAlign = 'center';
    fileLabels.appendChild(label);
}
boardContainer.appendChild(fileLabels);

// Add rank (8-1) labels on the left
const rankLabels = document.createElement('div');
rankLabels.style.position = 'absolute';
rankLabels.style.left = '0px';
rankLabels.style.top = '0px';
rankLabels.style.width = '40px';
rankLabels.style.height = '640px';
rankLabels.style.display = 'flex';
rankLabels.style.flexDirection = 'column';
rankLabels.style.justifyContent = 'space-between';
rankLabels.style.alignItems = 'center';
rankLabels.style.fontWeight = 'bold';
rankLabels.style.fontSize = '20px';
for (let i = 0; i < 8; i++) {
    const label = document.createElement('div');
    label.textContent = 8 - i;
    label.style.height = '80px';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'center';
    rankLabels.appendChild(label);
}
boardContainer.appendChild(rankLabels);

let selectedFrom = null;
let draggedFrom = null;
let validMoves = []; // Store valid moves for highlighting

// Helper: Convert chess notation (A2) to board coordinates
function notationToCoords(notation) {
    if (!notation || notation.length < 2) return null;
    const file = notation[0].toUpperCase();
    const rank = notation[1];
    const x = file.charCodeAt(0) - 'A'.charCodeAt(0);
    const y = 8 - parseInt(rank);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    return { x, y };
}

// Render the board from the game.js board array
function renderBoard() {
    chessboard.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.style.width = '80px';
            square.style.height = '80px';
            square.style.boxSizing = 'border-box';
            square.style.display = 'flex';
            square.style.alignItems = 'center';
            square.style.justifyContent = 'center';
            square.dataset.x = col;
            square.dataset.y = row;
            square.ondragover = e => e.preventDefault();
            square.ondrop = onDrop;
            square.onclick = onSquareClick;

            // Alternate colors for the squares
            if ((row + col) % 2 === 0) {
                square.style.backgroundColor = '#f0d9b5'; // Light square
            } else {
                square.style.backgroundColor = '#b58863'; // Dark square
            }

            // Highlight selected square
            if (selectedFrom && selectedFrom.x === col && selectedFrom.y === row) {
                square.style.outline = '2px solid orange';
            }

            // Highlight valid move squares
            if (validMoves.some(m => m.x === col && m.y === row)) {
                square.style.boxShadow = 'inset 0 0 0 4px yellow';
            }

            // Add piece if present
            const piece = board[row][col];
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.draggable = true;
                pieceDiv.dataset.x = col;
                pieceDiv.dataset.y = row;
                pieceDiv.ondragstart = onDragStart;
                pieceDiv.ondragend = onDragEnd;
                pieceDiv.onclick = onSquareClick;

                // Use SVG images for pieces
                let imgName = '';
                if (piece.type === 'pawn') {
                    imgName = `${piece.color}-pawn.svg`;
                } else if (piece.type === 'rook') {
                    imgName = `${piece.color}-rook.svg`;
                } else if (piece.type === 'knight') {
                    imgName = `${piece.color}-knight.svg`;
                } else if (piece.type === 'bishop') {
                    imgName = `${piece.color}-bishop.svg`;
                } else if (piece.type === 'queen') {
                    imgName = `${piece.color}-queen.svg`;
                } else if (piece.type === 'king') {
                    imgName = `${piece.color}-king.svg`;
                }
                if (imgName) {
                    const img = document.createElement('img');
                    img.src = `assets/${imgName}`;
                    img.style.width = '60px';
                    img.style.height = '60px';
                    img.draggable = false;
                    img.dataset.x = col;
                    img.dataset.y = row;
                    img.onclick = onSquareClick;
                    pieceDiv.appendChild(img);
                }

                pieceDiv.style.cursor = 'grab';
                square.appendChild(pieceDiv);
            }

            chessboard.appendChild(square);
        }
    }
}

// Drag-and-drop handlers
function onDragStart(e) {
    const x = parseInt(this.dataset.x);
    const y = parseInt(this.dataset.y);
    draggedFrom = { x, y };
    e.dataTransfer.setData('text/plain', `${x},${y}`);
}
function onDragEnd() {
    draggedFrom = null;
}
function onDrop(e) {
    if (!draggedFrom) return;
    const toX = parseInt(this.dataset.x);
    const toY = parseInt(this.dataset.y);
    if (window.tryMove(draggedFrom, { x: toX, y: toY })) {
        renderBoard();
        // Send board state to AI backend
        sendBoardToAI(JSON.stringify(window.board));
    }
    draggedFrom = null;
}

// Click-to-move handler
function onSquareClick(e) {
    let target = e.target;
    while (target && (!target.dataset.x || !target.dataset.y)) {
        target = target.parentElement;
    }
    if (!target) return;
    const x = parseInt(target.dataset.x);
    const y = parseInt(target.dataset.y);
    const piece = board[y][x];

    if (!selectedFrom) {
        // Select only if it's the current player's piece
        if (piece && piece.color === window.currentTurn) {
            selectedFrom = { x, y };
            // Get valid moves from game.js and store for highlighting
            const moves = getValidMoves(board, [y, x]);
            validMoves = moves.map(([toY, toX]) => ({ x: toX, y: toY }));
            renderBoard();
        }
    } else {
        if (window.tryMove(selectedFrom, { x, y })) {
            selectedFrom = null;
            validMoves = [];
            renderBoard();
            // Send board state to AI backend
            sendBoardToAI(JSON.stringify(window.board));
            console.log("Move made from", selectedFrom, "to", { x, y });
        } else if (piece && piece.color === window.currentTurn) {
            // Select a different piece of the same color
            selectedFrom = { x, y };
            const moves = getValidMoves(board, [y, x]);
            validMoves = moves.map(([toY, toX]) => ({ x: toX, y: toY }));
            renderBoard();
        } else {
            // Deselect if invalid
            selectedFrom = null;
            validMoves = [];
            renderBoard();
        }
    }
}

// Function for AI to make a move: from and to are strings like "A2", "A4"
function makeAIMove(fromNotation, toNotation) {
    if (window.tryMoveNotation(fromNotation, toNotation)) {
        renderBoard();
        return true;
    }
    return false;
}

// Initial render
renderBoard();
