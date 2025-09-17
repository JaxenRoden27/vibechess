class Knight {
    constructor(color, position) {
        this.color = color;
        this.position = position;
    }

    getPossibleMoves(board) {
        const moves = [];
        const { x, y } = this.position;
        const deltas = [
            [1, 2], [2, 1], [-1, 2], [-2, 1],
            [1, -2], [2, -1], [-1, -2], [-2, -1]
        ];
        for (const [dx, dy] of deltas) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                if (board.isEmpty(nx, ny) || board.isEnemy(nx, ny, this.color)) {
                    moves.push({ x: nx, y: ny });
                }
            }
        }
        return moves;
    }

    moveTo(pos) {
        this.position = pos;
    }

    capture(target, boardState, piecesArray) {
        // Remove the target piece from the board state and its array
        boardState[target.position.y][target.position.x] = null;
        const idx = piecesArray.indexOf(target);
        if (idx !== -1) piecesArray.splice(idx, 1);
    }
}