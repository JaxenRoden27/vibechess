// Variable to track the current turn
let gameOver = false;

// Main board array (8x8 of piece objects or null)
window.board = Array(8).fill(null).map(() => Array(8).fill(null));
window.currentTurn = 'white';

// Place pieces on the board
function setupBoard() {
    // Pawns
    for (let i = 0; i < 8; i++) {
        window.board[1][i] = new Pawn('black', { x: i, y: 1 });
        window.board[6][i] = new Pawn('white', { x: i, y: 6 });
    }
    // Rooks
    window.board[0][0] = new Rook('black', { x: 0, y: 0 });
    window.board[0][7] = new Rook('black', { x: 7, y: 0 });
    window.board[7][0] = new Rook('white', { x: 0, y: 7 });
    window.board[7][7] = new Rook('white', { x: 7, y: 7 });
    // Knights
    window.board[0][1] = new Knight('black', { x: 1, y: 0 });
    window.board[0][6] = new Knight('black', { x: 6, y: 0 });
    window.board[7][1] = new Knight('white', { x: 1, y: 7 });
    window.board[7][6] = new Knight('white', { x: 6, y: 7 });
    // Bishops
    window.board[0][2] = new Bishop('black', { x: 2, y: 0 });
    window.board[0][5] = new Bishop('black', { x: 5, y: 0 });
    window.board[7][2] = new Bishop('white', { x: 2, y: 7 });
    window.board[7][5] = new Bishop('white', { x: 5, y: 7 });
    // Queens
    window.board[0][3] = new Queen('black', { x: 3, y: 0 });
    window.board[7][3] = new Queen('white', { x: 3, y: 7 });
    // Kings
    window.board[0][4] = new King('black', { x: 4, y: 0 });
    window.board[7][4] = new King('white', { x: 4, y: 7 });
}

// Call this after defining your piece classes and before rendering the board
setupBoard();

// Function to determine if a given square is under attack
function isSquareUnderAttack(board, square, attackingColor) {
    const [x, y] = square;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            const piece = board[i][j];
            if (piece && piece.color === attackingColor) {
                const moves = getValidMoves(board, [i, j], true); // <--- pass true here
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

let lastDoublePawnMove = null;
// Helper function to generate valid moves for a piece
function getValidMoves(board, position, forAttack = false) {
    const [i, j] = position;
    const piece = board[i][j];
    if (!piece) return [];
    const moves = [];
    const color = piece.color;
    const forward = color === 'white' ? -1 : 1;

    if (piece.type === 'pawn') {
        // Forward move
        const ni = i + forward;
        if (ni >= 0 && ni < 8) {
            if (!board[ni][j]) {
                moves.push([ni, j]);
                // Double move from starting position
                if ((color === 'white' && i === 6) || (color === 'black' && i === 1)) {
                    const ni2 = i + 2 * forward;
                    if (!board[ni2][j]) {
                        moves.push([ni2, j]);
                    }
                }
            }
            // Captures
            for (let dj of [-1, 1]) {
                const nj = j + dj;
                if (nj >= 0 && nj < 8 && board[ni][nj] && board[ni][nj].color !== color) {
                    moves.push([ni, nj]);
                }
            }
        }
        // En passant
        if (lastDoublePawnMove && Math.abs(j - lastDoublePawnMove.col) === 1 && ni === lastDoublePawnMove.row) {
            if (board[i][lastDoublePawnMove.col] &&
                board[i][lastDoublePawnMove.col].type === 'pawn' &&
                board[i][lastDoublePawnMove.col].color !== color) {
                moves.push([ni, lastDoublePawnMove.col]);
            }
        }
    } else if (piece.type === 'rook') {
        // Horizontal and vertical
        for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
            let ni = i + dx, nj = j + dy;
            while (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj]) {
                    moves.push([ni, nj]);
                } else {
                    if (board[ni][nj].color !== color) moves.push([ni, nj]);
                    break;
                }
                ni += dx; nj += dy;
            }
        }
    } else if (piece.type === 'knight') {
        // L-shape
        for (const [dx, dy] of [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]]) {
            const ni = i + dx, nj = j + dy;
            if (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj] || board[ni][nj].color !== color) {
                    moves.push([ni, nj]);
                }
            }
        }
    } else if (piece.type === 'bishop') {
        // Diagonals
        for (const [dx, dy] of [[1,1], [1,-1], [-1,1], [-1,-1]]) {
            let ni = i + dx, nj = j + dy;
            while (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj]) {
                    moves.push([ni, nj]);
                } else {
                    if (board[ni][nj].color !== color) moves.push([ni, nj]);
                    break;
                }
                ni += dx; nj += dy;
            }
        }
    } else if (piece.type === 'queen') {
        // Combine rook and bishop
        for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]) {
            let ni = i + dx, nj = j + dy;
            while (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj]) {
                    moves.push([ni, nj]);
                } else {
                    if (board[ni][nj].color !== color) moves.push([ni, nj]);
                    break;
                }
                ni += dx; nj += dy;
            }
        }
    } else if (piece.type === 'king') {
        // One square any direction
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const ni = i + dx, nj = j + dy;
                if (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                    const target = board[ni][nj];
                    if (!target || target.color !== color) {
                        moves.push([ni, nj]);
                    }
                }
            }
        }
        // Castling (only if not for attack detection)
        if (!forAttack && !piece.hasMoved && !isKingInCheck(board, [i, j], color === 'white' ? 'black' : 'white')) {
            // King-side
            if (
                board[i][j+1] === null &&
                board[i][j+2] === null &&
                board[i][j+3] &&
                board[i][j+3].type === 'rook' &&
                !board[i][j+3].hasMoved &&
                !isSquareUnderAttack(board, [i, j+1], color === 'white' ? 'black' : 'white') &&
                !isSquareUnderAttack(board, [i, j+2], color === 'white' ? 'black' : 'white')
            ) {
                moves.push([i, j+2]); // King-side castling
            }
            // Queen-side
            if (
                board[i][j-1] === null &&
                board[i][j-2] === null &&
                board[i][j-3] === null &&
                board[i][j-4] &&
                board[i][j-4].type === 'rook' &&
                !board[i][j-4].hasMoved &&
                !isSquareUnderAttack(board, [i, j-1], color === 'white' ? 'black' : 'white') &&
                !isSquareUnderAttack(board, [i, j-2], color === 'white' ? 'black' : 'white')
            ) {
                moves.push([i, j-2]); // Queen-side castling
            }
        }
    }
    return moves;
}

// Helper function to make a move on the board
function makeMove(board, from, to) {
    const newBoard = JSON.parse(JSON.stringify(board));
    const piece = newBoard[from[0]][from[1]];

    // En passant
    if (
        piece.type === 'pawn' &&
        from[1] !== to[1] &&
        !newBoard[to[0]][to[1]]
    ) {
        // Capturing en passant
        newBoard[from[0]][to[1]] = null;
    }

    // Track double pawn move for en passant
    if (piece.type === 'pawn' && Math.abs(to[0] - from[0]) === 2) {
        lastDoublePawnMove = { row: to[0], col: to[1], color: piece.color };
    } else {
        lastDoublePawnMove = null;
    }

    // Castling
    if (piece.type === 'king' && Math.abs(to[1] - from[1]) === 2) {
        // King-side
        if (to[1] > from[1]) {
            // Move rook
            newBoard[from[0]][5] = newBoard[from[0]][7];
            newBoard[from[0]][7] = null;
            newBoard[from[0]][5].hasMoved = true;
        } else {
            // Queen-side
            newBoard[from[0]][3] = newBoard[from[0]][0];
            newBoard[from[0]][0] = null;
            newBoard[from[0]][3].hasMoved = true;
        }
    }

    newBoard[to[0]][to[1]] = piece;
    newBoard[from[0]][from[1]] = null;

    // Pawn promotion
    if (piece.type === 'pawn' && (to[0] === 0 || to[0] === 7)) {
        newBoard[to[0]][to[1]] = { type: 'queen', color: piece.color };
    }

    // Mark king or rook as moved
    if (piece.type === 'king' || piece.type === 'rook') {
        newBoard[to[0]][to[1]].hasMoved = true;
    }

    return newBoard;
}


// Function to make a move if it's the player's turn
function makePlayerMove(board, from, to) {
    if (gameOver) {
        console.log('Game is over!');
        return false;
    }

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

    // Check for checkmate after the move
    const opponentKingPos = findKingPosition(board, currentTurn);
    if (isCheckmate(board, opponentKingPos, currentTurn)) {
        console.log(`Checkmate! ${currentTurn === 'white' ? 'Black' : 'White'} wins!`);
        gameOver = true;
    }

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

/**
 * Unified move function for drag, click, and AI.
 * from and to are objects: {x, y}
 * Returns true if move was successful.
 */
window.tryMove = function(from, to) {
    // Use makePlayerMove for all moves
    return makePlayerMove(window.board, [from.y, from.x], [to.y, to.x]);
};

// For AI: from/to can be algebraic notation like "E2", "E4"
window.tryMoveNotation = function(fromNotation, toNotation) {
    function notationToCoords(notation) {
        if (!notation || notation.length < 2) return null;
        const file = notation[0].toUpperCase();
        const rank = notation[1];
        const x = file.charCodeAt(0) - 'A'.charCodeAt(0);
        const y = 8 - parseInt(rank);
        if (x < 0 || x > 7 || y < 0 || y > 7) return null;
        return { x, y };
    }
    const from = notationToCoords(fromNotation);
    const to = notationToCoords(toNotation);
    if (!from || !to) return false;
    return window.tryMove(from, to);
};