export const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
]

export function getValidPositions(board) {
    let indices = []
    for (let i = 0; i < 9; i++) {
        if (board[i][0] == '') {
            indices.push(i)
        }
    }
    return indices
}

export function remember(board, patch, position) {
    patch.push([position, structuredClone(board[position])])
}

export function revert(board, patch) {
    patch.forEach(p => {
        board[p[0]] = p[1]
    })
}

export function move(board, player, position) {
    let patch = []
    remember(board, patch, position)
    board[position] = [player, 2]
    for (let i = 0; i < 9; i++) {
        if (i != position && board[i][0] == player) {
            remember(board, patch, i)
            const ttl = board[i][1]
            if (ttl <= 0) {
                board[i] = ['']
            } else {
                board[i][1] = ttl - 1
            }
        }
    }
    return patch
}

export function checkWinner(board) {
    for (let i = 0; i < winPatterns.length; i++) {
        const [a, b, c] = winPatterns[i]
        const player = board[a][0]
        if (player != '' && player == board[b][0] && player == board[c][0]) {
            return {
                winner: player,
                pattern: winPatterns[i]
            }
        }
    }
    return null
}

export function minimax(currentPlayer, maxDepth, board) {
    function minimaxRec(depth, alpha, beta, isMaximizing) {
        const positions = getValidPositions(board)

        if (depth >= maxDepth) return 0

        const result = checkWinner(board)
        if (result) {
            if (result.winner == currentPlayer) {
                return maxDepth - depth
            } else {
                return depth - maxDepth
            }
        }

        if (isMaximizing) {
            const nextPlayer = currentPlayer
            let bestScore = -Infinity
            for (const i of positions) {
                const patch = move(board, nextPlayer, i)
                const score = minimaxRec(depth + 1, alpha, beta, !isMaximizing)
                revert(board, patch)
                bestScore = Math.max(bestScore, score)
                if (bestScore >= beta) break
                alpha = Math.max(alpha, score)
            }
            return bestScore
        } else {
            const nextPlayer = currentPlayer == 'O' ? 'X' : 'O'
            let bestScore = Infinity
            for (const i of positions) {
                const patch = move(board, nextPlayer, i)
                const score = minimaxRec(depth + 1, alpha, beta, !isMaximizing)
                revert(board, patch)
                bestScore = Math.min(bestScore, score)
                if (bestScore <= alpha) break
                beta = Math.min(beta, score)
            }
            return bestScore
        }
    }

    const positions = getValidPositions(board)
    let scores = new Array(board.length).fill(-Infinity)
    for (const i of positions) {
        const patch = move(board, currentPlayer, i)
        const score = minimaxRec(1, -Infinity, Infinity, false)
        revert(board, patch)
        scores[i] = score
    }

    return scores
}
