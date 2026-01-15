// ai.js — Balanced Alpha-Beta with quiescence and safety filtering
(function() {
    const AI_COLOR = 'black';
    window.AI_SEARCH_DEPTH = window.AI_SEARCH_DEPTH || 3;
    window.AI_MAX_DEPTH = window.AI_MAX_DEPTH || 6;

    const PIECE_VALUE = {
        pawn: 100,
        knight: 320,
        bishop: 330,
        rook: 500,
        queen: 900,
        king: 20000
    };

    // Evaluate board from aiColor perspective
    function evaluateBoard(board, aiColor) {
        const opp = aiColor === 'white' ? 'black' : 'white';
        let score = 0;
        let aiMob = 0, oppMob = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p) continue;
                const val = PIECE_VALUE[p.type] || 0;
                const mult = p.color === aiColor ? 1 : -1;
                score += val * mult;

                // mobility (rough)
                const moves = getValidMoves(board, [r, c]);
                if (p.color === aiColor) aiMob += moves.length;
                else oppMob += moves.length;

                // small central bonus
                if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
                    score += 0.05 * val * mult;
                }

                // king safety penalty if king is attacked
                if (p.type === 'king') {
                    if (isSquareUnderAttack(board, [r, c], p.color === 'white' ? 'black' : 'white')) {
                        score -= 0.25 * val * mult;
                    }
                }
            }
        }
        score += (aiMob - oppMob) * 0.1;
        return score;
    }

    function materialCount(board) {
        let total = 0;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            total += Math.abs(PIECE_VALUE[p.type] || 0);
        }
        return total;
    }

    // Generate legal moves (that don't leave own king in check)
    function generateAllLegalMoves(board, color) {
        const moves = [];
        const opp = color === 'white' ? 'black' : 'white';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p || p.color !== color) continue;
                const raw = getValidMoves(board, [r, c]);
                for (const mv of raw) {
                    const sim = makeMove(board, [r, c], mv, window.lastDoublePawnMove);
                    const newBoard = sim.board;
                    // ensure king exists (should)
                    const kingPos = findKingPosition(newBoard, color);
                    if (!kingPos) continue;
                    if (isKingInCheck(newBoard, kingPos, opp)) continue;
                    const captured = board[mv[0]][mv[1]];
                    moves.push({
                        from: [r, c],
                        to: [mv[0], mv[1]],
                        capture: !!captured,
                        captureValue: captured ? PIECE_VALUE[captured.type] || 0 : 0
                    });
                }
            }
        }
        return moves;
    }

    // order moves: captures first (MVV-LVA)
    function orderMoves(moves) {
        return moves.sort((a, b) => {
            if (a.capture && b.capture) return b.captureValue - a.captureValue;
            if (a.capture) return -1;
            if (b.capture) return 1;
            return 0;
        });
    }

    // Quiescence search over captures
    function quiescence(board, alpha, beta, aiColor, sideToMove) {
        const stand = evaluateBoard(board, aiColor);
        if (stand >= beta) return { score: stand };
        if (alpha < stand) alpha = stand;

        const moves = generateAllLegalMoves(board, sideToMove).filter(m => m.capture);
        const ordered = orderMoves(moves);
        const opp = sideToMove === 'white' ? 'black' : 'white';
        for (const mv of ordered) {
            const sim = makeMove(board, mv.from, mv.to, window.lastDoublePawnMove);
            const res = quiescence(sim.board, -beta, -alpha, aiColor, opp);
            const score = -res.score;
            if (score >= beta) return { score };
            if (score > alpha) alpha = score;
        }
        return { score: alpha };
    }

    function computeAdaptiveDepth(board, baseDepth) {
        let depth = baseDepth;
        const mat = materialCount(board);
        if (mat <= 3000) depth += 1;
        if (mat <= 2000) depth += 1;
        const myMoves = generateAllLegalMoves(board, AI_COLOR).length;
        if (myMoves > 0 && myMoves <= 12) depth += 1;
        depth = Math.min(depth, window.AI_MAX_DEPTH);
        return depth;
    }

    function alphaBeta(board, depth, alpha, beta, sideToMove, aiColor) {
        if (depth === 0) {
            const q = quiescence(board, alpha, beta, aiColor, sideToMove);
            return { score: q.score };
        }

        const moves = generateAllLegalMoves(board, sideToMove);
        if (moves.length === 0) {
            const kingPos = findKingPosition(board, sideToMove);
            const opp = sideToMove === 'white' ? 'black' : 'white';
            const inCheck = kingPos && isKingInCheck(board, kingPos, opp);
            if (inCheck) {
                return { score: sideToMove === aiColor ? -999999 : 999999 };
            } else return { score: 0 }; // stalemate
        }

        const ordered = orderMoves(moves);
        const oppColor = sideToMove === 'white' ? 'black' : 'white';

        if (sideToMove === aiColor) {
            let value = -Infinity;
            let bestMove = null;
            for (const mv of ordered) {
                const sim = makeMove(board, mv.from, mv.to, window.lastDoublePawnMove);
                const res = alphaBeta(sim.board, depth - 1, alpha, beta, oppColor, aiColor);
                if (res.score > value) {
                    value = res.score;
                    bestMove = mv;
                }
                alpha = Math.max(alpha, value);
                if (alpha >= beta) break;
            }
            return { score: value, move: bestMove };
        } else {
            let value = Infinity;
            let bestMove = null;
            for (const mv of ordered) {
                const sim = makeMove(board, mv.from, mv.to, window.lastDoublePawnMove);
                const res = alphaBeta(sim.board, depth - 1, alpha, beta, oppColor, aiColor);
                if (res.score < value) {
                    value = res.score;
                    bestMove = mv;
                }
                beta = Math.min(beta, value);
                if (beta <= alpha) break;
            }
            return { score: value, move: bestMove };
        }
    }

    // Determine if a simulated move leaves a moved piece on a square attacked by opponent
    function isMoveExposingPiece(board, from, to, color) {
        const sim = makeMove(board, from, to, window.lastDoublePawnMove);
        const newBoard = sim.board;
        const opp = color === 'white' ? 'black' : 'white';
        // if destination square is attacked by opponent, consider dangerous
        return isSquareUnderAttack(newBoard, [to[0], to[1]], opp);
    }

    // Find attackers for a square (used for defense bonus)
    function findAttackers(board, target, attackerColor) {
        const attackers = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p || p.color !== attackerColor) continue;
                const moves = getValidMoves(board, [r, c]);
                for (const mv of moves) {
                    if (mv[0] === target[0] && mv[1] === target[1]) {
                        attackers.push([r, c]);
                        break;
                    }
                }
            }
        }
        return attackers;
    }

    // Choose best move with safety considerations (balanced)
    function chooseBestMove(board, baseDepth, aiColor) {
        const depth = computeAdaptiveDepth(board, baseDepth);
        const opp = aiColor === 'white' ? 'black' : 'white';
        const rootMoves = generateAllLegalMoves(board, aiColor);
        if (rootMoves.length === 0) return null;
        const ordered = orderMoves(rootMoves);

        // Identify currently threatened pieces for defensive opportunities
        const threatened = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p || p.color !== aiColor) continue;
                if (isSquareUnderAttack(board, [r, c], opp)) threatened.push({ r, c, p });
            }
        }

        let bestMove = null;
        let bestScore = -Infinity;

        for (const mv of ordered) {
            const sim = makeMove(board, mv.from, mv.to, window.lastDoublePawnMove);
            const newBoard = sim.board;

            // Safety penalty: moving valuable piece into attacked square
            const movedPiece = board[mv.from[0]][mv.from[1]];
            let dangerPenalty = 0;
            if (movedPiece && isSquareUnderAttack(newBoard, [mv.to[0], mv.to[1]], opp)) {
                const val = PIECE_VALUE[movedPiece.type] || 0;
                // penalty scaled by piece value; captures reduce penalty
                const captured = board[mv.to[0]][mv.to[1]];
                const captureVal = captured ? (PIECE_VALUE[captured.type] || 0) : 0;
                if (!captured || captureVal < val * 0.8) dangerPenalty = val * 0.6;
            }

            // Defense bonus: moved threatened piece to safety, captured attacker, or defended
            let defenseBonus = 0;
            for (const t of threatened) {
                if (t.r === mv.from[0] && t.c === mv.from[1]) {
                    // moved this threatened piece
                    if (!isSquareUnderAttack(newBoard, [mv.to[0], mv.to[1]], opp)) {
                        defenseBonus += (PIECE_VALUE[t.p.type] || 0) * 0.5;
                    }
                }
                // captured attacker?
                const attackers = findAttackers(board, [t.r, t.c], opp);
                for (const a of attackers) {
                    if (a[0] === mv.from[0] && a[1] === mv.from[1]) {
                        defenseBonus += (PIECE_VALUE[t.p.type] || 0) * 0.6;
                    }
                }
                // newly defended?
                if (isSquareUnderAttack(newBoard, [t.r, t.c], aiColor)) {
                    defenseBonus += (PIECE_VALUE[t.p.type] || 0) * 0.15;
                }
            }

            // Evaluate deeper with alphaBeta
            const ab = alphaBeta(newBoard, depth - 1, -Infinity, Infinity, opp, aiColor);
            const total = ab.score - dangerPenalty + defenseBonus;

            if (total > bestScore) {
                bestScore = total;
                bestMove = mv;
            }
        }

        return bestMove;
    }

    // Public AI: compute & play
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

            const ok = window.tryMove(fromObj, toObj);
            if (!ok) {
                console.warn('AI: tryMove failed for chosen move. Trying fallback.');
                const all = generateAllLegalMoves(window.board, aiColor);
                for (const mv of all) {
                    const f = { x: mv.from[1], y: mv.from[0] }, t = { x: mv.to[1], y: mv.to[0] };
                    if (window.tryMove(f, t)) {
                        if (typeof renderBoard === 'function') renderBoard();
                        return true;
                    }
                }
                return false;
            }

            if (typeof renderBoard === 'function') renderBoard();
            console.log(`AI (${aiColor}) moved ${fromObj.x},${fromObj.y} -> ${toObj.x},${toObj.y}`);
            return true;
        } catch (err) {
            console.error('AI error:', err);
            return false;
        }
    };

    // Autoplay (optional)
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
                if (ok) console.log(`AI (${AI_COLOR}) done in ${ms} ms`);
                thinking = false;
            }
        }, POLL_MS);
    }

    window.aiComputeBestMove = function(depth = window.AI_SEARCH_DEPTH, color = AI_COLOR) {
        if (typeof window.board === 'undefined') return null;
        return chooseBestMove(window.board, depth, color);
    };

    console.log('Balanced AI loaded — color:', AI_COLOR, 'base depth:', window.AI_SEARCH_DEPTH);
})();
