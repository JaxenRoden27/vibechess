// board.js

// Create a chessboard container
const chessboard = document.createElement('div');
chessboard.style.display = 'grid';
chessboard.style.gridTemplateColumns = 'repeat(8, 50px)';
chessboard.style.gridTemplateRows = 'repeat(8, 50px)';
chessboard.style.width = '800px';
chessboard.style.height = '800px';
chessboard.style.border = '2px solid black';

// Generate the 8x8 grid for the chessboard
for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.style.width = '100px';
        square.style.height = '100px';
        square.style.boxSizing = 'border-box';

        // Alternate colors for the squares
        if ((row + col) % 2 === 0) {
            square.style.backgroundColor = '#f0d9b5'; // Light square
        } else {
            square.style.backgroundColor = '#b58863'; // Dark square
        }

        chessboard.appendChild(square);
    }
}

// Append the chessboard to the body
document.body.appendChild(chessboard);