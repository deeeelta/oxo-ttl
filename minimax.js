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

export function minimax(currentPlayer, maxDepth, board, depth, isMaximizing) {
    const positions = getValidPositions(board)

    if (depth >= maxDepth) return [positions, 0]

    const result = checkWinner(board)
    if (result) {
        if (result.winner == currentPlayer) {
            return [positions, maxDepth - depth]
        } else {
            return [positions, depth - maxDepth]
        }
    }

    const nextPlayer = isMaximizing ? currentPlayer : (currentPlayer == 'O' ? 'X' : 'O')
    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMoves = []

    positions.forEach(i => {
        const patch = move(board, nextPlayer, i)
        const [_, score] = minimax(currentPlayer, maxDepth, board, depth + 1, !isMaximizing)
        revert(board, patch)
        if (score == bestScore) {
            bestMoves.push(i)
        } else if ((isMaximizing && score > bestScore) ||
            (!isMaximizing && score < bestScore)) {
            bestScore = score
            bestMoves = [i]
        }
    })

    return [bestMoves, bestScore]
}
