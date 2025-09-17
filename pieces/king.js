class King {
    constructor(color, position) {
        this.color = color; // 'white' or 'black'
        this.position = position; // { x, y }
        this.hasMoved = false;
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

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                if (boardInterface.isEmpty(nx, ny) || boardInterface.isEnemy(nx, ny, this.color)) {
                    moves.push({ x: nx, y: ny });
                }
            }
        }

        // Castling logic
        if (!this.hasMoved) {
            // King-side castling
            if (
                boardInterface.canCastle &&
                boardInterface.canCastle(this.color, 'king') // expects a function
            ) {
                moves.push({ x: x + 2, y: y, castling: 'king' });
            }
            // Queen-side castling
            if (
                boardInterface.canCastle &&
                boardInterface.canCastle(this.color, 'queen')
            ) {
                moves.push({ x: x - 2, y: y, castling: 'queen' });
            }
        }

        return moves;
    }
}