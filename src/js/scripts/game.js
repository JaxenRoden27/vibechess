// game.js — Fixed cloning, check detection and move pipeline (browser global style)

let gameOver = false;

// Main board array (8x8 of piece objects or null)
window.board = Array(8).fill(null).map(() => Array(8).fill(null));
window.currentTurn = 'white';

// Move history array
window.moveHistory = []; // Store moves as ["E2,E4", "E7,E5", ...]

// Track last double pawn move for en passant (row, col, color)
window.lastDoublePawnMove = null;

// Utility: clone board while preserving class prototypes and flags
function cloneBoard(board) {
    return board.map((row) => {
        return row.map((piece) => {
            if (!piece) return null;
            // Create a new object with same prototype so methods still exist
            const copy = Object.create(Object.getPrototypeOf(piece));
            // shallow-copy own properties (positions, hasMoved, type, color, etc.)
            for (let k in piece) {
                if (Object.prototype.hasOwnProperty.call(piece, k)) {
                    // clone nested position object to avoid shared refs
                    if (k === 'position' && piece.position) {
                        copy.position = { x: piece.position.x, y: piece.position.y };
                    } else {
                        copy[k] = piece[k];
                    }
                }
            }
            return copy;
        });
    });
}

// Setup initial pieces (call after piece classes defined)
function setupBoard() {
    // Clear board first
    window.board = Array(8).fill(null).map(() => Array(8).fill(null));

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

    window.lastDoublePawnMove = null;
    window.moveHistory = [];
    window.currentTurn = 'white';
    gameOver = false;
}

// Call setupBoard once piece classes are loaded
setupBoard(); // leave to caller so user can load pieces first

// returns true if square [row,col] is under attack by attackingColor
function isSquareUnderAttack(board, square, attackingColor) {
    const [targetRow, targetCol] = square;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === attackingColor) {
                // Use getValidMoves but in "forAttack" mode to avoid recursive castling checks
                const moves = getValidMoves(board, [r, c], true);
                if (moves.some(([mr, mc]) => mr === targetRow && mc === targetCol)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isKingInCheck(board, kingPosition, attackingColor) {
    if (!kingPosition) return false;
    return isSquareUnderAttack(board, kingPosition, attackingColor);
}

// Checkmate detection
function isCheckmate(board, kingPosition, currentColor) {
    // If king not in check, can't be checkmate
    const attacker = currentColor === 'white' ? 'black' : 'white';
    if (!isKingInCheck(board, kingPosition, attacker)) return false;

    // For every piece of currentColor, try all valid moves and see if any escape check
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece || piece.color !== currentColor) continue;
            const moves = getValidMoves(board, [r, c]);
            for (const move of moves) {
                const sim = makeMove(board, [r, c], move); // returns new board object
                const newBoard = sim.board;
                const kingPos = findKingPosition(newBoard, currentColor);
                if (!isKingInCheck(newBoard, kingPos, attacker)) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * getValidMoves(board, [row, col], forAttack=false)
 * - board: 2D array of pieces (piece instances or null)
 * - position: [row, col] (integers)
 * - forAttack: when true, reduce checks that call isSquareUnderAttack to avoid recursion (used by isSquareUnderAttack)
 *
 * returns array of [row, col] target positions
 */
function getValidMoves(board, position, forAttack = false) {
    const [i, j] = position;
    const piece = board[i]?.[j];
    if (!piece) return [];
    const moves = [];
    const color = piece.color;
    const forward = color === 'white' ? -1 : 1;

    // Pawn
    if (piece.type === 'pawn') {
        const ni = i + forward;
        if (ni >= 0 && ni < 8) {
            // forward
            if (!board[ni][j]) {
                moves.push([ni, j]);
                // double
                if ((color === 'white' && i === 6) || (color === 'black' && i === 1)) {
                    const ni2 = i + 2 * forward;
                    if (!board[ni2][j]) moves.push([ni2, j]);
                }
            }
            // captures
            for (let dj of [-1, 1]) {
                const nj = j + dj;
                if (nj >= 0 && nj < 8 && board[ni][nj] && board[ni][nj].color !== color) {
                    moves.push([ni, nj]);
                }
            }
        }
        // en passant using global lastDoublePawnMove (real game state)
        if (window.lastDoublePawnMove) {
            const lm = window.lastDoublePawnMove;
            // lastDoublePawnMove.row is the row the pawn ended on after the double move
            // if this pawn is adjacent horizontally and on same rank as lastDouble's pawn, allow capture
            if (Math.abs(j - lm.col) === 1) {
                // direction: the capturing pawn moves to ni (i+forward) and column lm.col
                const ni = i + forward;
                if (ni === lm.row) {
                    // ensure there is an enemy pawn at i, lm.col (the pawn that moved two squares is still beside us)
                    if (board[i][lm.col] && board[i][lm.col].type === 'pawn' && board[i][lm.col].color !== color) {
                        moves.push([ni, lm.col]);
                    }
                }
            }
        }
    }

    // Rook
    else if (piece.type === 'rook') {
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            let ni = i + dx, nj = j + dy;
            while (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj]) moves.push([ni, nj]);
                else {
                    if (board[ni][nj].color !== color) moves.push([ni, nj]);
                    break;
                }
                ni += dx; nj += dy;
            }
        }
    }

    // Knight
    else if (piece.type === 'knight') {
        for (const [dx, dy] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
            const ni = i + dx, nj = j + dy;
            if (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj] || board[ni][nj].color !== color) moves.push([ni, nj]);
            }
        }
    }

    // Bishop
    else if (piece.type === 'bishop') {
        for (const [dx, dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
            let ni = i + dx, nj = j + dy;
            while (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj]) moves.push([ni, nj]);
                else {
                    if (board[ni][nj].color !== color) moves.push([ni, nj]);
                    break;
                }
                ni += dx; nj += dy;
            }
        }
    }

    // Queen
    else if (piece.type === 'queen') {
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
            let ni = i + dx, nj = j + dy;
            while (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                if (!board[ni][nj]) moves.push([ni, nj]);
                else {
                    if (board[ni][nj].color !== color) moves.push([ni, nj]);
                    break;
                }
                ni += dx; nj += dy;
            }
        }
    }

    // King
    else if (piece.type === 'king') {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const ni = i + dx, nj = j + dy;
                if (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                    if (!board[ni][nj] || board[ni][nj].color !== color) {
                        moves.push([ni, nj]);
                    }
                }
            }
        }

        // Castling: only check when not forAttack (avoid recursion)
        if (!forAttack && !piece.hasMoved && !isKingInCheck(board, [i, j], color === 'white' ? 'black' : 'white')) {
            // King-side
            if (j + 3 < 8 &&
                board[i][j+1] === null &&
                board[i][j+2] === null &&
                board[i][j+3] &&
                board[i][j+3].type === 'rook' &&
                !board[i][j+3].hasMoved &&
                !isSquareUnderAttack(board, [i, j+1], color === 'white' ? 'black' : 'white') &&
                !isSquareUnderAttack(board, [i, j+2], color === 'white' ? 'black' : 'white')) {
                moves.push([i, j+2]);
            }
            // Queen-side
            if (j - 4 >= 0 &&
                board[i][j-1] === null &&
                board[i][j-2] === null &&
                board[i][j-3] === null &&
                board[i][j-4] &&
                board[i][j-4].type === 'rook' &&
                !board[i][j-4].hasMoved &&
                !isSquareUnderAttack(board, [i, j-1], color === 'white' ? 'black' : 'white') &&
                !isSquareUnderAttack(board, [i, j-2], color === 'white' ? 'black' : 'white')) {
                moves.push([i, j-2]);
            }
        }
    }

    return moves;
}

// makeMove: returns { board: newBoard, lastDoublePawnMove: newLastDouble }
// - does NOT mutate the input board
// - does not update global lastDoublePawnMove; the caller should update global if desired
function makeMove(board, from, to, lastDouble = window.lastDoublePawnMove) {
    const newBoard = cloneBoard(board);
    const piece = newBoard[from[0]][from[1]];
    if (!piece) return { board: newBoard, lastDoublePawnMove: lastDouble };

    // Handle en passant capture: if pawn moves diagonally to empty square, capture the pawn behind it
    if (piece.type === 'pawn' && from[1] !== to[1] && !newBoard[to[0]][to[1]]) {
        // the captured pawn sits at row = from[0], col = to[1]
        newBoard[from[0]][to[1]] = null;
    }

    // Track new lastDouble (local)
    let newLastDouble = null;
    if (piece.type === 'pawn' && Math.abs(to[0] - from[0]) === 2) {
        newLastDouble = { row: to[0], col: to[1], color: piece.color };
    } else {
        newLastDouble = null;
    }

    // Castling: if king moves two files, move rook accordingly
    if (piece.type === 'king' && Math.abs(to[1] - from[1]) === 2) {
        // king-side (to[1] > from[1])
        if (to[1] > from[1]) {
            // move rook from file 7 to file 5
            newBoard[from[0]][5] = newBoard[from[0]][7];
            newBoard[from[0]][7] = null;
            if (newBoard[from[0]][5]) newBoard[from[0]][5].hasMoved = true;
        } else {
            // queen-side: rook from file 0 to file 3
            newBoard[from[0]][3] = newBoard[from[0]][0];
            newBoard[from[0]][0] = null;
            if (newBoard[from[0]][3]) newBoard[from[0]][3].hasMoved = true;
        }
    }

    // Move piece
    newBoard[to[0]][to[1]] = piece;
    newBoard[from[0]][from[1]] = null;

    // Update piece position & flags
    if (piece.position) piece.position = { x: to[1], y: to[0] };
    if (piece.type === 'king' || piece.type === 'rook' || piece.type === 'pawn') {
        piece.hasMoved = true;
    }

    // Pawn promotion: replace with a Queen instance (simple automatic promotion to queen)
    if (piece.type === 'pawn' && (to[0] === 0 || to[0] === 7)) {
        newBoard[to[0]][to[1]] = new Queen(piece.color, { x: to[1], y: to[0] });
    }

    return { board: newBoard, lastDoublePawnMove: newLastDouble };
}

// makePlayerMove(board, fromArr, toArr) where fromArr/toArr are [row, col]
// returns true if move applied
function makePlayerMove(boardRef, from, to) {
    if (gameOver) {
        console.log('Game is over!');
        return false;
    }

    const piece = boardRef[from[0]][from[1]];
    if (!piece) {
        console.log('No piece at the selected square!');
        return false;
    }
    if (piece.color !== window.currentTurn) {
        console.log(`It's ${window.currentTurn}'s turn!`);
        return false;
    }

    const validMoves = getValidMoves(boardRef, from);
    if (!validMoves.some(([r, c]) => r === to[0] && c === to[1])) {
        console.log('Invalid move!');
        return false;
    }

    // Simulate the move to check for moving into check
    const sim = makeMove(boardRef, from, to, window.lastDoublePawnMove);
    const newBoard = sim.board;
    const newLastDouble = sim.lastDoublePawnMove;

    // Find king position after the move (for the moving color)
    const kingPos = findKingPosition(newBoard, piece.color);
    const attacker = piece.color === 'white' ? 'black' : 'white';
    if (isKingInCheck(newBoard, kingPos, attacker)) {
        console.log('You cannot move into check!');
        return false;
    }

    // Commit the move (mutate the real boardRef)
    // Note: to preserve class instances, assign references from newBoard
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            boardRef[r][c] = newBoard[r][c];
        }
    }

    // Update global lastDoublePawnMove based on sim result
    window.lastDoublePawnMove = newLastDouble;

    // Record move notation
    const fromNotation = String.fromCharCode(65 + from[1]) + (8 - from[0]);
    const toNotation = String.fromCharCode(65 + to[1]) + (8 - to[0]);
    window.moveHistory.push(`${fromNotation},${toNotation}`);

    // Switch turns
    window.currentTurn = window.currentTurn === 'white' ? 'black' : 'white';
    console.log(`Move successful! It's now ${window.currentTurn}'s turn.`);

    // Check for checkmate
    const opponentKingPos = findKingPosition(boardRef, window.currentTurn);
    if (isCheckmate(boardRef, opponentKingPos, window.currentTurn)) {
        console.log(`Checkmate! ${window.currentTurn === 'white' ? 'Black' : 'White'} wins!`);
        gameOver = true;
    }

    return true;
}

// find king position [row,col] for color
function findKingPosition(board, color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.type === 'king' && p.color === color) return [r, c];
        }
    }
    return null;
}

/**
 * Unified move interface for UI / AI: from/to are objects {x,y} (x=file, y=rank)
 * returns true if move applied
 */
window.tryMove = function(fromObj, toObj) {
    // translate UI coords {x, y} to matrix coords [row, col]
    const from = [fromObj.y, fromObj.x];
    const to = [toObj.y, toObj.x];
    return makePlayerMove(window.board, from, to);
};

// Notation helper for AI convenience
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
