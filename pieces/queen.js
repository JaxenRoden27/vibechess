class Queen {
    constructor(color, position) {
        this.color = color; // 'white' or 'black'
        this.position = position; // { x, y }
    }

    moveTo(position) {
        this.position = position;
    }

    // Returns all possible moves for the queen
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
            let nx = x + dx;
            let ny = y + dy;
            while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                if (boardInterface.isEmpty(nx, ny)) {
                    moves.push({ x: nx, y: ny });
                } else if (boardInterface.isEnemy(nx, ny, this.color)) {
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