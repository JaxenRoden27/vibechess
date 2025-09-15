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

            // En passant
            // Check if last move was an enemy pawn moving two squares to adjacent file
            if (
                board.lastMove &&
                board.lastMove.piece instanceof Pawn &&
                board.lastMove.piece.color !== this.color &&
                board.lastMove.from.y === y + 2 * dir &&
                board.lastMove.to.y === y &&
                board.lastMove.to.x === nx
            ) {
                // The enemy pawn is next to us and just moved two squares
                if (board.isEmpty(nx, ny)) {
                    moves.push({ x: nx, y: ny, enPassant: true });
                }
            }
        }

        // Promotion not implemented here

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