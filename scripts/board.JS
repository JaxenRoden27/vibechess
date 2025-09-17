// board.js

// Piece placement for standard chess starting position
const initialBoard = [
    ['black-rook', 'black-knight', 'black-bishop', 'black-queen', 'black-king', 'black-bishop', 'black-knight', 'black-rook'],
    ['black-pawn', 'black-pawn',   'black-pawn',   'black-pawn',  'black-pawn', 'black-pawn',   'black-pawn',   'black-pawn'],
    [null,         null,           null,           null,          null,         null,           null,           null],
    [null,         null,           null,           null,          null,         null,           null,           null],
    [null,         null,           null,           null,          null,         null,           null,           null],
    [null,         null,           null,           null,          null,         null,           null,           null],
    ['white-pawn', 'white-pawn',   'white-pawn',   'white-pawn',  'white-pawn', 'white-pawn',   'white-pawn',   'white-pawn'],
    ['white-rook', 'white-knight', 'white-bishop', 'white-queen', 'white-king', 'white-bishop', 'white-knight', 'white-rook'],
];

// Piece arrays
const pawns = [], rooks = [], knights = [], bishops = [], queens = [], kings = [];

// Board state: 8x8 array of piece objects or null
const boardState = Array(8).fill(null).map(() => Array(8).fill(null));

// Helper: create piece object from string
function createPiece(pieceStr, x, y) {
    if (!pieceStr) return null;
    const [color, type] = pieceStr.split('-');
    const pos = { x, y };
    switch (type) {
        case 'pawn':   var p = new Pawn(color, pos); pawns.push(p); return p;
        case 'rook':   var r = new Rook(color, pos); rooks.push(r); return r;
        case 'knight': var k = new Knight(color, pos); knights.push(k); return k;
        case 'bishop': var b = new Bishop(color, pos); bishops.push(b); return b;
        case 'queen':  var q = new Queen(color, pos); queens.push(q); return q;
        case 'king':   var ki = new King(color, pos); kings.push(ki); return ki;
        default: return null;
    }
}

// Initialize boardState with piece objects
for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
        boardState[row][col] = createPiece(initialBoard[row][col], col, row);
    }
}

// Helper functions
function isEmpty(x, y) {
    return y >= 0 && y < 8 && x >= 0 && x < 8 && boardState[y][x] === null;
}
function isEnemy(x, y, color) {
    if (y < 0 || y > 7 || x < 0 || x > 7) return false;
    const p = boardState[y][x];
    return p && p.color !== color;
}

// Board interface for piece logic
const boardInterface = {
    isEmpty,
    isEnemy,
    lastMove: null
};

// Castling logic
function canCastle(color, side) {
    const y = color === 'white' ? 7 : 0;
    const king = boardState[y][4];
    if (!king || king.hasMoved) return false;
    if (side === 'king') {
        const rook = boardState[y][7];
        if (!rook || rook.hasMoved) return false;
        if (!isEmpty(5, y) || !isEmpty(6, y)) return false;
        return true;
    }
    if (side === 'queen') {
        const rook = boardState[y][0];
        if (!rook || rook.hasMoved) return false;
        if (!isEmpty(1, y) || !isEmpty(2, y) || !isEmpty(3, y)) return false;
        return true;
    }
    return false;
}
boardInterface.canCastle = canCastle;

// DOM rendering and move logic
const chessboard = document.createElement('div');
chessboard.style.display = 'grid';
chessboard.style.gridTemplateColumns = 'repeat(8, 80px)';
chessboard.style.gridTemplateRows = 'repeat(8, 80px)';
chessboard.style.width = '640px';
chessboard.style.height = '640px';
chessboard.style.border = '2px solid black';
chessboard.id = 'chessboard';

document.body.appendChild(chessboard);

let draggedPiece = null;
let validMoves = [];

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

            // Alternate colors for the squares
            if ((row + col) % 2 === 0) {
                square.style.backgroundColor = '#f0d9b5'; // Light square
            } else {
                square.style.backgroundColor = '#b58863'; // Dark square
            }

            // Add piece if present
            const piece = boardState[row][col];
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.draggable = true;
                pieceDiv.dataset.x = col;
                pieceDiv.dataset.y = row;
                pieceDiv.ondragstart = onDragStart;
                pieceDiv.ondragend = onDragEnd;

                // Use SVG images for pieces
                let imgName = '';
                if (piece instanceof Pawn) {
                    imgName = `${piece.color}-pawn.svg`;
                } else if (piece instanceof Rook) {
                    imgName = `${piece.color}-rook.svg`;
                } else if (piece instanceof Knight) {
                    imgName = `${piece.color}-knight.svg`;
                } else if (piece instanceof Bishop) {
                    imgName = `${piece.color}-bishop.svg`;
                } else if (piece instanceof Queen) {
                    imgName = `${piece.color}-queen.svg`;
                } else if (piece instanceof King) {
                    imgName = `${piece.color}-king.svg`;
                }
                if (imgName) {
                    const img = document.createElement('img');
                    img.src = `assets/${imgName}`;
                    img.style.width = '60px';
                    img.style.height = '60px';
                    img.draggable = false; // Prevent dragging the image itself
                    pieceDiv.appendChild(img);
                }

                pieceDiv.style.cursor = 'grab';
                square.appendChild(pieceDiv);
            }

            chessboard.appendChild(square);
        }
    }
}

function onDragStart(e) {
    const x = parseInt(this.dataset.x);
    const y = parseInt(this.dataset.y);
    draggedPiece = boardState[y][x];
    validMoves = draggedPiece.getPossibleMoves({
        ...boardInterface,
        lastMove: boardInterface.lastMove
    });
    // Highlight valid squares
    document.querySelectorAll('#chessboard > div').forEach(sq => {
        const sx = parseInt(sq.dataset.x);
        const sy = parseInt(sq.dataset.y);
        if (validMoves.some(m => m.x === sx && m.y === sy)) {
            sq.style.outline = '2px solid orange';
        }
    });
    e.dataTransfer.setData('text/plain', `${x},${y}`);
}

function onDragEnd() {
    document.querySelectorAll('#chessboard > div').forEach(sq => sq.style.outline = '');
    draggedPiece = null;
    validMoves = [];
}

function onDrop(e) {
    const toX = parseInt(this.dataset.x);
    const toY = parseInt(this.dataset.y);
    if (!draggedPiece) return;
    const fromX = draggedPiece.position.x;
    const fromY = draggedPiece.position.y;
    // Check if move is valid
    const move = validMoves.find(m => m.x === toX && m.y === toY);
    if (move) {
        // Handle normal capture
        if (boardState[toY][toX]) {
            const capturedPiece = boardState[toY][toX];
            if (capturedPiece instanceof Pawn) {
                const idx = pawns.indexOf(capturedPiece);
                if (idx !== -1) pawns.splice(idx, 1);
            } else if (capturedPiece instanceof Rook) {
                const idx = rooks.indexOf(capturedPiece);
                if (idx !== -1) rooks.splice(idx, 1);
            } else if (capturedPiece instanceof Knight) {
                const idx = knights.indexOf(capturedPiece);
                if (idx !== -1) knights.splice(idx, 1);
            } else if (capturedPiece instanceof Bishop) {
                const idx = bishops.indexOf(capturedPiece);
                if (idx !== -1) bishops.splice(idx, 1);
            } else if (capturedPiece instanceof Queen) {
                const idx = queens.indexOf(capturedPiece);
                if (idx !== -1) queens.splice(idx, 1);
            } else if (capturedPiece instanceof King) {
                const idx = kings.indexOf(capturedPiece);
                if (idx !== -1) kings.splice(idx, 1);
            }
            boardState[toY][toX] = null;
        }
        // En passant capture
        if (draggedPiece instanceof Pawn && move.enPassant) {
            const dir = draggedPiece.color === 'white' ? 1 : -1;
            const capturedY = toY + dir;
            const capturedPawn = boardState[capturedY][toX];
            if (capturedPawn && capturedPawn instanceof Pawn) {
                const idx = pawns.indexOf(capturedPawn);
                if (idx !== -1) pawns.splice(idx, 1);
                boardState[capturedY][toX] = null;
            }
        }
        // Castling move
        if (draggedPiece instanceof King && move.castling) {
            // King-side
            if (move.castling === 'king') {
                const rook = boardState[toY][7];
                boardState[toY][7] = null;
                boardState[toY][5] = rook;
                rook.moveTo({ x: 5, y: toY });
            }
            // Queen-side
            if (move.castling === 'queen') {
                const rook = boardState[toY][0];
                boardState[toY][0] = null;
                boardState[toY][3] = rook;
                rook.moveTo({ x: 3, y: toY });
            }
        }
        // Move piece
        boardState[fromY][fromX] = null;
        boardState[toY][toX] = draggedPiece;
        draggedPiece.moveTo({ x: toX, y: toY });
        boardInterface.lastMove = {
            piece: draggedPiece,
            from: { x: fromX, y: fromY },
            to: { x: toX, y: toY }
        };
        renderBoard();
    }
    onDragEnd();
}

renderBoard();