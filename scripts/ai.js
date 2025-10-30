// ai.js — Adaptive Alpha-Beta AI with quiescence & improved move ordering
// Drop this file into your project and load it after your existing game scripts.

(function() {
    const AI_COLOR = 'black';
    window.AI_SEARCH_DEPTH = window.AI_SEARCH_DEPTH || 3; // base depth
    window.AI_MAX_DEPTH = window.AI_MAX_DEPTH || 6; // safeguard upper bound

    // Piece base values (white positive)
    const PIECE_VALUE = {
        pawn: 100,
        knight: 320,
        bishop: 330,
        rook: 500,
        queen: 900,
        king: 20000
    };

    // Small positional bonuses to help choose sensible moves
    const POSITIONAL_BONUS = {
        pawn: [
            [0,0,0,0,0,0,0,0],
            [5,10,10,-20,-20,10,10,5],
            [5,-5,-10,0,0,-10,-5,5],
            [0,0,0,20,20,0,0,0],
            [5,5,10,25,25,10,5,5],
            [10,10,20,30,30,20,10,10],
            [50,50,50,50,50,50,50,50],
            [0,0,0,0,0,0,0,0]
        ],
        knight: [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,0,5,5,0,-20,-40],
            [-30,5,10,15,15,10,5,-30],
            [-30,0,15,20,20,15,0,-30],
            [-30,5,15,20,20,15,5,-30],
            [-30,0,10,15,15,10,0,-30],
            [-40,-20,0,0,0,0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ]
        // add more tables if desired
    };

    // =====================
    // Advanced Evaluation Function
    // =====================
    function evaluateBoard(board, aiColor) {
        const oppColor = aiColor === 'white' ? 'black' : 'white';
        let score = 0;

        const CENTER_SQUARES = [
            [3, 3], [3, 4], [4, 3], [4, 4]
        ];

        let aiMobility = 0;
        let oppMobility = 0;

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];
                if (!piece) continue;

                const val = PIECE_VALUE[piece.type] || 0;
                const colorMult = (piece.color === aiColor) ? 1 : -1;

                // === Base material ===
                score += val * colorMult;

                // === Positional heuristics ===
                if (piece.color === aiColor) {
                    const moves = getValidMoves(board, [y, x]);
                    aiMobility += moves.length;
                } else {
                    const moves = getValidMoves(board, [y, x]);
                    oppMobility += moves.length;
                }

                // 1️⃣ Central control bonus
                for (const [cy, cx] of CENTER_SQUARES) {
                    if (y === cy && x === cx) score += 0.2 * val * colorMult;
                }

                // 2️⃣ King safety (encourage castled kings)
                if (piece.type === 'king') {
                    if ((piece.color === 'white' && y > 5) ||
                        (piece.color === 'black' && y < 2)) {
                        score += 0.3 * val * colorMult;
                    }
                }

                // 3️⃣ Development bonus (knights/bishops off back rank)
                if ((piece.type === 'knight' || piece.type === 'bishop')) {
                    if ((piece.color === 'white' && y < 6) ||
                        (piece.color === 'black' && y > 1)) {
                        score += 0.15 * val * colorMult;
                    }
                }

                // 4️⃣ Penalize exposed kings
                if (piece.type === 'king' && isSquareUnderAttack(board, [y, x], oppColor)) {
                    score -= 0.5 * val * colorMult;
                }
            }
        }

        // 5️⃣ Mobility bonus
        const mobilityScore = (aiMobility - oppMobility) * 0.2;
        score += mobilityScore;

        return score;
    }


    // Count material (sum of absolute values)
    function materialCount(board) {
        let mat = 0;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const p = board[y][x];
                if (!p) continue;
                mat += Math.abs(PIECE_VALUE[p.type] || 0);
            }
        }
        return mat;
    }

    // Generate legal moves for color (filters moves that leave king in check)
    // Returns array of {from:[r,c], to:[r,c], capture:bool, captureValue:number}
    function generateAllLegalMoves(board, color) {
        const moves = [];
        const opp = color === 'white' ? 'black' : 'white';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];
                if (!piece || piece.color !== color) continue;
                const raw = getValidMoves(board, [y, x]);
                for (const mv of raw) {
                    const toY = mv[0], toX = mv[1];
                    const newBoard = makeMove(board, [y, x], [toY, toX]);
                    const kingPos = findKingPosition(newBoard, color);
                    if (!kingPos) continue;
                    if (isKingInCheck(newBoard, kingPos, opp)) continue; // illegal
                    const captured = board[toY][toX];
                    const capture = !!captured;
                    const captureValue = capture ? (PIECE_VALUE[captured.type] || 0) : 0;
                    moves.push({ from: [y, x], to: [toY, toX], capture, captureValue });
                }
            }
        }
        return moves;
    }

    // MVV-LVA like ordering: captures of more valuable pieces first; then non-captures.
    function orderMoves(moves) {
        return moves.sort((a, b) => {
            if (a.capture && b.capture) {
                return b.captureValue - a.captureValue; // larger captured piece first
            } else if (a.capture) {
                return -1;
            } else if (b.capture) {
                return 1;
            }
            return 0;
        });
    }

    // Quiescence search: only explore capture moves to stabilize evaluation
    function quiescence(board, alpha, beta, aiColor, sideToMove) {
        const standPat = aiColor === 'white' ? evaluateBoard(board, AI_COLOR) : -evaluateBoard(board, AI_COLOR);
        if (standPat >= beta) return { score: standPat };
        if (alpha < standPat) alpha = standPat;

        // generate captures only
        const moves = generateAllLegalMoves(board, sideToMove).filter(m => m.capture);
        const ordered = orderMoves(moves);
        const opp = sideToMove === 'white' ? 'black' : 'white';

        for (const mv of ordered) {
            const newBoard = makeMove(board, mv.from, mv.to);
            const res = quiescence(newBoard, -beta, -alpha, aiColor, opp);
            const score = -res.score;
            if (score >= beta) return { score };
            if (score > alpha) alpha = score;
        }
        return { score: alpha };
    }

    // Adaptive depth based on material and move count
    function computeAdaptiveDepth(board, baseDepth) {
        const mat = materialCount(board);
        // If low material (endgame) increase depth
        let depth = baseDepth;
        if (mat <= 3000) depth += 1;     // some pieces removed
        if (mat <= 2000) depth += 1;
        // If very few legal moves, search deeper
        const myMoves = generateAllLegalMoves(board, AI_COLOR).length;
        if (myMoves > 0 && myMoves <= 12) depth += 1;
        // Cap depth
        depth = Math.min(depth, window.AI_MAX_DEPTH);
        return depth;
    }

    // Alpha-Beta with quiescence extension at leaf nodes
    function alphaBeta(board, depth, alpha, beta, sideToMove, aiColor) {
        if (depth === 0) {
            // call quiescence to resolve tactical captures
            const q = quiescence(board, alpha, beta, aiColor, sideToMove);
            return { score: q.score };
        }

        const moves = generateAllLegalMoves(board, sideToMove);
        if (moves.length === 0) {
            // checkmate or stalemate
            const kingPos = findKingPosition(board, sideToMove);
            const opp = sideToMove === 'white' ? 'black' : 'white';
            const inCheck = kingPos && isKingInCheck(board, kingPos, opp);
            if (inCheck) {
                // checkmate for sideToMove => very bad for that side
                const mateScore = sideToMove === aiColor ? -999999 : 999999;
                return { score: mateScore };
            } else {
                return { score: 0 }; // stalemate
            }
        }

        const ordered = orderMoves(moves);
        const oppColor = sideToMove === 'white' ? 'black' : 'white';

        if (sideToMove === aiColor) {
            let value = -Infinity;
            let bestMove = null;
            for (const mv of ordered) {
                const newBoard = makeMove(board, mv.from, mv.to);
                const result = alphaBeta(newBoard, depth - 1, alpha, beta, oppColor, aiColor);
                if (result.score > value) {
                    value = result.score;
                    bestMove = mv;
                }
                alpha = Math.max(alpha, value);
                if (alpha >= beta) break; // cutoff
            }
            return { score: value, move: bestMove };
        } else {
            let value = Infinity;
            let bestMove = null;
            for (const mv of ordered) {
                const newBoard = makeMove(board, mv.from, mv.to);
                const result = alphaBeta(newBoard, depth - 1, alpha, beta, oppColor, aiColor);
                if (result.score < value) {
                    value = result.score;
                    bestMove = mv;
                }
                beta = Math.min(beta, value);
                if (beta <= alpha) break; // cutoff
            }
            return { score: value, move: bestMove };
        }
    }

    // === Smarter AI move selector with danger avoidance + defensive play ===
    function chooseBestMove(board, baseDepth, aiColor) {
        const depth = computeAdaptiveDepth(board, baseDepth);
        const opp = aiColor === 'white' ? 'black' : 'white';

        const rootMoves = generateAllLegalMoves(board, aiColor);
        if (rootMoves.length === 0) return null;
        const ordered = orderMoves(rootMoves);

        // Step 1: Identify pieces under attack
        const threatenedPieces = [];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];
                if (!piece || piece.color !== aiColor) continue;
                if (isSquareUnderAttack(board, [y, x], opp)) {
                    threatenedPieces.push({ x, y, piece });
                }
            }
        }

        let bestMove = null;
        let bestScore = -Infinity;

        for (const mv of ordered) {
            const newBoard = makeMove(board, mv.from, mv.to);
            const movedPiece = board[mv.from[0]][mv.from[1]];
            const toPos = [mv.to[0], mv.to[1]];
            const fromPos = [mv.from[0], mv.from[1]];
            const captured = board[mv.to[0]][mv.to[1]];

            // === Safety Penalty: Don’t move valuable pieces into attack ===
            const underAttack = isSquareUnderAttack(newBoard, toPos, opp);
            let dangerPenalty = 0;
            if (underAttack && movedPiece) {
                const val = PIECE_VALUE[movedPiece.type] || 0;
                const captureVal = captured ? PIECE_VALUE[captured.type] || 0 : 0;
                if (!captured || captureVal < val * 0.8) {
                    dangerPenalty = val * 0.7;
                }
            }

            // === NEW: Defensive Bonus ===
            let defenseBonus = 0;
            for (const threat of threatenedPieces) {
                const { x, y, piece } = threat;
                const val = PIECE_VALUE[piece.type] || 0;

                // 1️⃣ Moved a threatened piece to safety
                if (fromPos[0] === y && fromPos[1] === x) {
                    const stillAttacked = isSquareUnderAttack(newBoard, toPos, opp);
                    if (!stillAttacked) defenseBonus += val * 0.6;
                }

                // 2️⃣ Captured an attacking piece
                const attackers = findAttackers(board, [y, x], opp);
                for (const attacker of attackers) {
                    if (attacker[0] === mv.from[0] && attacker[1] === mv.from[1]) {
                        defenseBonus += val * 0.7;
                    }
                }

                // 3️⃣ Defended a threatened piece (covers it)
                if (isSquareUnderAttack(newBoard, [y, x], aiColor)) {
                    defenseBonus += val * 0.2;
                }
            }

            // Evaluate recursively
            const result = alphaBeta(newBoard, depth - 1, -Infinity, Infinity, opp, aiColor);
            const totalScore = result.score - dangerPenalty + defenseBonus;

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMove = mv;
            }
        }

        return bestMove;
    }

    // Helper to find which opponent pieces attack a given square
    function findAttackers(board, target, attackerColor) {
        const attackers = [];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];
                if (!piece || piece.color !== attackerColor) continue;
                const moves = getValidMoves(board, [y, x]);
                for (const [toY, toX] of moves) {
                    if (toY === target[0] && toX === target[1]) {
                        attackers.push([y, x]);
                        break;
                    }
                }
            }
        }
        return attackers;
    }



    // Public: compute and play AI move
    window.aiMakeMove = function(depth = window.AI_SEARCH_DEPTH) {
        try {
            if (typeof window.board === 'undefined' || gameOver) return false;
            const aiColor = AI_COLOR;
            if (window.currentTurn !== aiColor) return false;

            const best = chooseBestMove(window.board, depth, aiColor);
            if (!best) {
                console.log('AI: no legal moves (stalemate/checkmate).');
                return false;
            }

            const fromObj = { x: best.from[1], y: best.from[0] };
            const toObj = { x: best.to[1], y: best.to[0] };

            // Use tryMove to ensure move is legal in game state
            const ok = window.tryMove(fromObj, toObj);
            if (!ok) {
                console.warn('AI: tryMove failed for chosen move. Attempting to fallback to safe move selection.');
                // Attempt fallback: pick first legal move that tryMove accepts
                const all = generateAllLegalMoves(window.board, aiColor);
                for (const mv of all) {
                    const f = { x: mv.from[1], y: mv.from[0] }, t = { x: mv.to[1], y: mv.to[0] };
                    if (window.tryMove(f, t)) {
                        renderBoard();
                        console.log('AI fallback applied move', f, '->', t);
                        return true;
                    }
                }
                return false;
            }

            // Update UI
            if (typeof renderBoard === 'function') renderBoard();
            console.log(`AI (${aiColor}) moved from ${fromObj.x},${fromObj.y} to ${toObj.x},${toObj.y}`);
            return true;
        } catch (err) {
            console.error('AI error:', err);
            return false;
        }
    };

    // Optional autoplayer (polls for AI turn) — can be disabled by setting window.AI_AUTOPLAY = false
    window.AI_AUTOPLAY = (typeof window.AI_AUTOPLAY === 'undefined') ? true : window.AI_AUTOPLAY;
    if (window.AI_AUTOPLAY) {
        const POLL_MS = 300;
        let thinking = false;
        setInterval(() => {
            if (!window.AI_AUTOPLAY) return;
            if (thinking || gameOver) return;
            if (typeof window.currentTurn === 'undefined') return;
            if (window.currentTurn === AI_COLOR) {
                thinking = true;
                const start = performance.now();
                const ok = window.aiMakeMove(window.AI_SEARCH_DEPTH);
                const ms = (performance.now() - start).toFixed(0);
                if (ok) console.log(`AI (${AI_COLOR}) move done in ${ms} ms`);
                thinking = false;
            }
        }, POLL_MS);
    }

    // Helper to compute best move without playing it
    window.aiComputeBestMove = function(depth = window.AI_SEARCH_DEPTH, color = AI_COLOR) {
        if (typeof window.board === 'undefined') return null;
        return chooseBestMove(window.board, depth, color);
    };

    console.log('Adaptive ai.js loaded — AI color:', AI_COLOR, 'base depth:', window.AI_SEARCH_DEPTH);
})();
