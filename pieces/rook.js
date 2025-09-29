class Rook {
    constructor(color, position) {
        this.color = color;
        this.position = { ...position };
        this.hasMoved = false;
        this.type = 'rook'; // <-- Add this line
    }

    moveTo(pos) {
        this.position = { ...pos };
        this.hasMoved = true;
    }

    getPossibleMoves(board) {
        const moves = [];
        const { x, y } = this.position;
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        for (const { dx, dy } of directions) {
            let nx = x + dx, ny = y + dy;
            while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                if (board.isEmpty(nx, ny)) {
                    moves.push({ x: nx, y: ny });
                } else if (board.isEnemy(nx, ny, this.color)) {
                    moves.push({ x: nx, y: ny });
                    break;
                } else {
                    break;
                }
                nx += dx;
                ny += dy;
            }
        }
        return moves;
    }
}