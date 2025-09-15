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

// Create a chessboard container
const chessboard = document.createElement('div');
chessboard.style.display = 'grid';
chessboard.style.gridTemplateColumns = 'repeat(8, 80px)';
chessboard.style.gridTemplateRows = 'repeat(8, 80px)';
chessboard.style.width = '640px';
chessboard.style.height = '640px';
chessboard.style.border = '2px solid black';

// Generate the 8x8 grid for the chessboard
for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.style.width = '80px';
        square.style.height = '80px';
        square.style.boxSizing = 'border-box';
        square.style.display = 'flex';
        square.style.alignItems = 'center';
        square.style.justifyContent = 'center';

        // Alternate colors for the squares
        if ((row + col) % 2 === 0) {
            square.style.backgroundColor = '#f0d9b5'; // Light square
        } else {
            square.style.backgroundColor = '#b58863'; // Dark square
        }

        // Add piece image if present
        const piece = initialBoard[row][col];
        if (piece) {
            const img = document.createElement('img');
            img.src = `assets/${piece}.svg`;
            img.alt = piece;
            img.style.width = '60px';
            img.style.height = '60px';
            square.appendChild(img);
        }

        chessboard.appendChild(square);
    }
}

// Append the chessboard to the body
document.body.appendChild(chessboard);