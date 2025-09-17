class Bishop {
    constructor(color, position) {
        this.color = color; // 'white' or 'black'
        this.type = 'bishop';
        this.position = position; // { x, y }
    }

    // Returns all possible moves for this bishop
    getPossibleMoves(board) {
        const moves = [];
        const directions = [
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: -1 }
        ];
        for (const dir of directions) {
            let x = this.position.x + dir.dx;
            let y = this.position.y + dir.dy;
            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (board.isEmpty(x, y)) {
                    moves.push({ x, y });
                } else if (board.isEnemy(x, y, this.color)) {
                    moves.push({ x, y });
                    break;
                } else {
                    break;
                }
                x += dir.dx;
                y += dir.dy;
            }
        }
        return moves;
    }

    moveTo(pos) {
        this.position = pos;
    }
}

module.exports = Bishop;