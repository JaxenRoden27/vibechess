class Rook {
    constructor(position, color) {
        this.position = position; // Position as [row, col]
        this.color = color; // 'white' or 'black'
        this.hasMoved = false; // Track if rook has moved (for castling)
    }

    getMoves(board) {
        const moves = [];
        const directions = [
            [1, 0],  // Down
            [-1, 0], // Up
            [0, 1],  // Right
            [0, -1]  // Left
        ];

        for (const [dx, dy] of directions) {
            let [x, y] = this.position;

            while (true) {
                x += dx;
                y += dy;

                if (x < 0 || x >= 8 || y < 0 || y >= 8) break; // Out of bounds

                const piece = board[x][y];
                if (piece) {
                    if (piece.color !== this.color) moves.push([x, y]); // Capture
                    break; // Blocked
                }

                moves.push([x, y]); // Valid move
            }
        }

        return moves;
    }

    move(newPosition) {
        this.position = newPosition;
        this.hasMoved = true;
    }
}

module.exports = Rook;