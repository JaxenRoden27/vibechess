// ==========================
// board.js
// ==========================

const board = window.board;

// --------------------------
// Piece SVGs
// --------------------------
const pieceSVGs = {
    white: {
        pawn: '/assets/white-pawn.svg',
        rook: '/assets/white-rook.svg',
        knight: '/assets/white-knight.svg',
        bishop: '/assets/white-bishop.svg',
        queen: '/assets/white-queen.svg',
        king: '/assets/white-king.svg'
    },
    black: {
        pawn: '/assets/black-pawn.svg',
        rook: '/assets/black-rook.svg',
        knight: '/assets/black-knight.svg',
        bishop: '/assets/black-bishop.svg',
        queen: '/assets/black-queen.svg',
        king: '/assets/black-king.svg'
    }
};

// --------------------------
// State
// --------------------------
let selectedFrom = null;
let validMoves = [];
let lastMove = null;
let draggedFrom = null;

// --------------------------
// Board Container
// --------------------------
const boardContainer = document.createElement('div');
boardContainer.style.position = 'relative';
boardContainer.style.width = '680px';
boardContainer.style.height = '680px';
boardContainer.style.margin = '20px';
document.body.appendChild(boardContainer);

const chessboard = document.createElement('div');
chessboard.style.display = 'grid';
chessboard.style.gridTemplateColumns = 'repeat(8, 80px)';
chessboard.style.gridTemplateRows = 'repeat(8, 80px)';
chessboard.style.width = '640px';
chessboard.style.height = '640px';
chessboard.style.border = '2px solid black';
chessboard.style.position = 'absolute';
chessboard.style.left = '40px';
chessboard.style.top = '0px';
boardContainer.appendChild(chessboard);

// --------------------------
// Labels
// --------------------------
function createLabels() {
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
        label.textContent = String.fromCharCode(65 + i);
        label.style.width = '80px';
        label.style.textAlign = 'center';
        fileLabels.appendChild(label);
    }
    boardContainer.appendChild(fileLabels);

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
}
createLabels();

// --------------------------
// Highlight helpers
// --------------------------
function highlightValidMoves() {
    clearHighlights();
    const squares = chessboard.querySelectorAll('div[data-x][data-y]');
    squares.forEach(square => {
        const x = parseInt(square.dataset.x);
        const y = parseInt(square.dataset.y);

        // Highlight selected square
        if (selectedFrom && selectedFrom.x === x && selectedFrom.y === y) {
            square.style.outline = '3px solid orange';
        }

        // Highlight valid moves
        if (validMoves.some(m => m.x === x && m.y === y)) {
            square.style.boxShadow = 'inset 0 0 0 4px yellow';
        }
    });
}

function clearHighlights() {
    const squares = chessboard.querySelectorAll('div[data-x][data-y]');
    squares.forEach(square => {
        square.style.boxShadow = '';
        square.style.outline = '';
    });
}

// --------------------------
// Drag-and-drop handlers
// --------------------------
function onDragStart(e) {
    const x = parseInt(this.dataset.x);
    const y = parseInt(this.dataset.y);

    // Only allow dragging pieces of the current turn
    if (board[y][x].color !== window.currentTurn) {
        e.preventDefault();
        return;
    }

    // Clear any click highlights when dragging begins
    selectedFrom = null;
    clearHighlights();

    draggedFrom = { x, y };
    e.dataTransfer.setData('text/plain', `${x},${y}`);
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.5';

    // Highlight valid moves for this drag
    validMoves = getValidMoves(board, [y, x]).map(([r, c]) => ({ x: c, y: r }));
    highlightValidMoves();
}

function onDragEnd() {
    this.style.opacity = '1';
    draggedFrom = null;
    validMoves = [];
    clearHighlights();
}

function onDrop(e) {
    e.preventDefault();
    if (!draggedFrom) return;

    const toX = parseInt(this.dataset.x);
    const toY = parseInt(this.dataset.y);

    const isValid = validMoves.some(m => m.x === toX && m.y === toY);

    if (isValid && window.tryMove(draggedFrom, { x: toX, y: toY })) {
        lastMove = { from: { ...draggedFrom }, to: { x: toX, y: toY } };
    }

    draggedFrom = null;
    validMoves = [];
    clearHighlights();
    renderBoard();
}

function onDragOver(e) {
    if (!draggedFrom) return;
    const toX = parseInt(this.dataset.x);
    const toY = parseInt(this.dataset.y);
    if (validMoves.some(m => m.x === toX && m.y === toY)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
}

// --------------------------
// Render Board
// --------------------------
function renderBoard() {
    chessboard.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.dataset.x = col;
            square.dataset.y = row;
            square.style.width = '80px';
            square.style.height = '80px';
            square.style.display = 'flex';
            square.style.alignItems = 'center';
            square.style.justifyContent = 'center';
            square.style.boxSizing = 'border-box';
            square.style.backgroundColor = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';

            // Highlight last move squares
            if (lastMove && ((lastMove.from.x === col && lastMove.from.y === row) || (lastMove.to.x === col && lastMove.to.y === row))) {
                square.style.border = '2px solid lightgreen';
            }

            square.addEventListener('dragover', onDragOver);
            square.addEventListener('drop', onDrop);

            const piece = board[row][col];
            if (piece) {
                const img = document.createElement('img');
                img.src = pieceSVGs[piece.color][piece.type];
                img.dataset.x = col;
                img.dataset.y = row;
                img.draggable = true;
                img.style.width = '60px';
                img.style.height = '60px';
                img.style.cursor = 'grab';

                img.addEventListener('dragstart', onDragStart);
                img.addEventListener('dragend', onDragEnd);

                square.appendChild(img);
            }

            chessboard.appendChild(square);
        }
    }

    highlightValidMoves();
}

// --------------------------
// Click-to-Move (optional)
// --------------------------
function handleClick(e) {
    let target = e.target;
    while (target && (!target.dataset || typeof target.dataset.x === 'undefined')) {
        target = target.parentElement;
    }
    if (!target) return;

    const x = parseInt(target.dataset.x);
    const y = parseInt(target.dataset.y);
    const piece = board[y][x];

    // Reset highlights when switching interaction modes
    clearHighlights();

    if (!selectedFrom) {
        if (piece && piece.color === window.currentTurn) {
            selectedFrom = { x, y };
            validMoves = getValidMoves(board, [y, x]).map(([r, c]) => ({ x: c, y: r }));
            renderBoard();
            highlightValidMoves();
        }
    } else {
        if (window.tryMove(selectedFrom, { x, y })) {
            lastMove = { from: { ...selectedFrom }, to: { x, y } };
            selectedFrom = null;
            validMoves = [];
            renderBoard();
        } else if (piece && piece.color === window.currentTurn) {
            selectedFrom = { x, y };
            validMoves = getValidMoves(board, [y, x]).map(([r, c]) => ({ x: c, y: r }));
            renderBoard();
            highlightValidMoves();
        } else {
            selectedFrom = null;
            validMoves = [];
            renderBoard();
        }
    }
}

chessboard.addEventListener('click', handleClick);

// --------------------------
// Initial render
// --------------------------
renderBoard();
