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
function sendBoardToAI(boardData) {
    // Convert boardData (array) to FEN before sending
    const fen = boardArrayToFEN(window.board, window.currentTurn === 'white' ? 'w' : 'b');
    console.log("♟️ Move made, sending FEN and moveHistory to AI backend:", fen, window.moveHistory);
    fetch("https://chessbros.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardData: fen, moveHistory: window.moveHistory })
    })
    .then(res => res.json())
    .then(response => {
        console.log("📨 AI Response: ", response);
        if (response && response.result && window.makeAIMove) {
            // Expecting format: "E7, E5"
            const move = response.result.trim().split(',');
            if (move.length === 2) {
                const from = move[0].trim().toUpperCase();
                const to = move[1].trim().toUpperCase();
                const moveSuccess = makeAIMove(from, to);
                console.log("AI Move success:", moveSuccess, "from", from, "to", to);
            } else {
                console.error("AI response format invalid:", response.result);
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
