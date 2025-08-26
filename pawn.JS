class Pawn {
    constructor(color, position) {
        this.color = color; // 'white' or 'black'
        this.position = position; // e.g., { x: 0, y: 1 }
        this.hasMoved = false;
    }

    // Returns array of possible moves (not checking for check)
    getPossibleMoves(board) {
        const moves = [];
        const dir = this.color === 'white' ? 1 : -1;
        const { x, y } = this.position;

        // Forward move
        if (board.isEmpty(x, y + dir)) {
            moves.push({ x, y: y + dir });

            // First move: two squares
            if (!this.hasMoved && board.isEmpty(x, y + 2 * dir)) {
                moves.push({ x, y: y + 2 * dir });
            }
        }

        // Captures
        for (let dx of [-1, 1]) {
            const nx = x + dx;
            const ny = y + dir;
            if (board.isEnemy(nx, ny, this.color)) {
                moves.push({ x: nx, y: ny });
            }
        }

        // En passant and promotion not implemented here

        return moves;
    }

    moveTo(position) {
        this.position = position;
        this.hasMoved = true;
    }
}

// Example board interface for reference
// board.isEmpty(x, y): returns true if square is empty
// board.isEnemy(x, y, color): returns true if square has enemy piece

module.exports = Pawn;