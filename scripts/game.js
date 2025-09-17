// Variable to track the current turn
let currentTurn = 'white'; // White moves first

// Function to determine if a given square is under attack
function isSquareUnderAttack(board, square, attackingColor) {
    const [x, y] = square;

    // Iterate through all pieces of the attacking color
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            const piece = board[i][j];
            if (piece && piece.color === attackingColor) {
                const moves = getValidMoves(board, [i, j]);
                if (moves.some(([mx, my]) => mx === x && my === y)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Function to check if the current player's king is in check
function isKingInCheck(board, kingPosition, attackingColor) {
    return isSquareUnderAttack(board, kingPosition, attackingColor);
}

// Function to check if the current player is in checkmate
function isCheckmate(board, kingPosition, currentColor) {
    if (!isKingInCheck(board, kingPosition, currentColor === 'white' ? 'black' : 'white')) {
        return false;
    }

    // Iterate through all pieces of the current color
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            const piece = board[i][j];
            if (piece && piece.color === currentColor) {
                const moves = getValidMoves(board, [i, j]);
                for (const move of moves) {
                    const newBoard = makeMove(board, [i, j], move);
                    const newKingPosition = piece.type === 'king' ? move : kingPosition;
                    if (!isKingInCheck(newBoard, newKingPosition, currentColor === 'white' ? 'black' : 'white')) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

// Helper function to generate valid moves for a piece
function getValidMoves(board, position) {
    // This function should return all valid moves for the piece at the given position
    // You need to implement this based on the rules of chess
    return [];
}

// Helper function to make a move on the board
function makeMove(board, from, to) {
    const newBoard = JSON.parse(JSON.stringify(board)); // Deep copy the board
    newBoard[to[0]][to[1]] = newBoard[from[0]][from[1]];
    newBoard[from[0]][from[1]] = null;
    return newBoard;
}

// Function to make a move if it's the player's turn
function makePlayerMove(board, from, to) {
    const piece = board[from[0]][from[1]];

    // Check if the piece belongs to the current player
    if (!piece) {
        console.log('No piece at the selected square!');
        return false;
    }

    if (piece.color !== currentTurn) {
        console.log(`It's ${currentTurn}'s turn!`);
        return false;
    }

    // Get valid moves for the selected piece
    const validMoves = getValidMoves(board, from);

    // Check if the move is valid
    if (!validMoves.some(([x, y]) => x === to[0] && y === to[1])) {
        console.log('Invalid move!');
        return false;
    }

    // Make the move
    const newBoard = makeMove(board, from, to);

    // Check if the move puts the current player's king in check
    const kingPosition = findKingPosition(newBoard, currentTurn);
    if (isKingInCheck(newBoard, kingPosition, currentTurn === 'white' ? 'black' : 'white')) {
        console.log('You cannot move into check!');
        return false;
    }

    // Update the board and switch turns
    board[to[0]][to[1]] = board[from[0]][from[1]];
    board[from[0]][from[1]] = null;
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    console.log(`Move successful! It's now ${currentTurn}'s turn.`);
    return true;
}

// Helper function to find the king's position for a given color
function findKingPosition(board, color) {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            const piece = board[i][j];
            if (piece && piece.type === 'king' && piece.color === color) {
                return [i, j];
            }
        }
    }
    return null;
}