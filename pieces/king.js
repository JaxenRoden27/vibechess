class King {
    constructor(color, position) {
        this.color = color;
        this.position = position;
        this.hasMoved = false;
        this.type = 'king'; // <-- Add this line
    }

    moveTo(position) {
        this.position = position;
        this.hasMoved = true;
    }

    // Returns all possible moves for the king (one square in any direction + castling)
    getPossibleMoves(boardInterface) {
        const moves = [];
        const directions = [
            { dx: 1, dy: 0 },   // right
            { dx: -1, dy: 0 },  // left
            { dx: 0, dy: 1 },   // down
            { dx: 0, dy: -1 },  // up
            { dx: 1, dy: 1 },   // down-right
            { dx: -1, dy: 1 },  // down-left
            { dx: 1, dy: -1 },  // up-right
            { dx: -1, dy: -1 }  // up-left
        ];
        const { x, y } = this.position;

        // Collect all squares attacked by enemy pieces
        const attackedSquares = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row][col];
                if (piece && piece.color !== this.color) {
                    if (piece instanceof Pawn) {
                        // Pawns attack diagonally
                        const dir = piece.color === 'white' ? -1 : 1;
                        for (let dx of [-1, 1]) {
                            const ax = piece.position.x + dx;
                            const ay = piece.position.y + dir;
                            if (ax >= 0 && ax < 8 && ay >= 0 && ay < 8) {
                                attackedSquares.push(`${ax},${ay}`);
                            }
                        }
                    } else if (piece instanceof King) {
                        // Enemy king attacks adjacent squares only
                        const kingDirs = [
                            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                            { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
                            { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
                        ];
                        for (const { dx, dy } of kingDirs) {
                            const kx = piece.position.x + dx;
                            const ky = piece.position.y + dy;
                            if (kx >= 0 && kx < 8 && ky >= 0 && ky < 8) {
                                attackedSquares.push(`${kx},${ky}`);
                            }
                        }
                    } else {
                        // Other pieces: use their possible moves
                        const theirMoves = piece.getPossibleMoves(boardInterface);
                        for (const m of theirMoves) {
                            attackedSquares.push(`${m.x},${m.y}`);
                        }
                    }
                }
            }
        }

        // Collect all squares adjacent to enemy king
        const adjacentToEnemyKing = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row][col];
                if (piece && piece.color !== this.color && piece instanceof King) {
                    const kingDirs = [
                        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                        { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                        { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
                        { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
                    ];
                    for (const { dx, dy } of kingDirs) {
                        const kx = piece.position.x + dx;
                        const ky = piece.position.y + dy;
                        if (kx >= 0 && kx < 8 && ky >= 0 && ky < 8) {
                            adjacentToEnemyKing.push(`${kx},${ky}`);
                        }
                    }
                    // Also include the enemy king's own square
                    adjacentToEnemyKing.push(`${piece.position.x},${piece.position.y}`);
                }
            }
        }

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (
                nx >= 0 && nx < 8 && ny >= 0 && ny < 8 &&
                (boardInterface.isEmpty(nx, ny) || boardInterface.isEnemy(nx, ny, this.color)) &&
                !attackedSquares.includes(`${nx},${ny}`) &&
                !adjacentToEnemyKing.includes(`${nx},${ny}`)
            ) {
                moves.push({ x: nx, y: ny });
            }
        }

        // Castling logic (now checks if squares are attacked)
        if (!this.hasMoved) {
            // King-side castling
            if (
                boardInterface.canCastle &&
                boardInterface.canCastle(this.color, 'king')
            ) {
                // King moves from e to g (x: 4 to x: 6)
                const kingSideSquares = [
                    { x: x, y: y },       // e
                    { x: x + 1, y: y },  // f
                    { x: x + 2, y: y }   // g
                ];
                if (kingSideSquares.every(sq => !attackedSquares.includes(`${sq.x},${sq.y}`))) {
                    moves.push({ x: x + 2, y: y, castling: 'king' });
                }
            }
            // Queen-side castling
            if (
                boardInterface.canCastle &&
                boardInterface.canCastle(this.color, 'queen')
            ) {
                // King moves from e to c (x: 4 to x: 2)
                const queenSideSquares = [
                    { x: x, y: y },       // e
                    { x: x - 1, y: y },  // d
                    { x: x - 2, y: y }   // c
                ];
                if (queenSideSquares.every(sq => !attackedSquares.includes(`${sq.x},${sq.y}`))) {
                    moves.push({ x: x - 2, y: y, castling: 'queen' });
                }
            }
        }

        return moves;
    }
}