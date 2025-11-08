const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
]

function getValidPositions(board) {
    let indices = []
    for (let i = 0; i < 9; i++) {
        if (board[i][0] == '') {
            indices.push(i)
        }
    }
    return indices
}

function remember(board, patch, position) {
    patch.push([position, structuredClone(board[position])])
}

function revert(board, patch) {
    patch.forEach(p => {
        board[p[0]] = p[1]
    })
}

function move(board, player, position) {
    patch = []
    remember(board, patch, position)
    board[position] = [player, 2]
    for (let i = 0; i < 9; i++) {
        if (i != position && board[i][0] == player) {
            remember(board, patch, i)
            const age = board[i][1]
            if (age <= 0) {
                board[i] = ['']
            } else {
                board[i][1] = age - 1
            }
        }
    }
    return patch
}

function checkWinner(board) {
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

const maxDepth = 5
function minimax(board, depth, isMaximizing) {
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
        const [_, score] = minimax(board, depth + 1, !isMaximizing)
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

let gameBoard
let gameActive
let currentPlayer
const cells = document.querySelectorAll('.cell')
const gameStatus = document.getElementById('game-status')
resetGame()
document.getElementById('board').addEventListener('click', handleCellClick)
document.getElementById('reset').addEventListener('click', resetGame)
document.getElementById('self-step').addEventListener('click', aiMove)

function resetGame() {
    gameBoard = [
        [''], [''], [''],
        [''], [''], [''],
        [''], [''], [''],
    ]
    gameActive = true
    currentPlayer = 'X'

    cells.forEach(cell => {
        cell.textContent = ''
        cell.classList.remove('winning-cell')
    })

    updateStatus(null)
}

function moveAndUpdate(position) {
    move(gameBoard, currentPlayer, position)
    currentPlayer = currentPlayer == 'O' ? 'X' : 'O'
    const result = checkWinner(gameBoard)
    updateStatus(result)
    return result
}

function handleCellClick(e) {
    const cellIndex = parseInt(e.target.getAttribute('data-index'))

    if (gameBoard[cellIndex][0] !== '' || !gameActive)
        return

    const result = moveAndUpdate(cellIndex)
    if (result == null) {
        aiMove()
    }
}

function aiMove() {
    if (!gameActive) return

    const [bestMoves, _] = minimax(gameBoard, 0, true)
    const bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)]

    return moveAndUpdate(bestMove)
}

function highlightWinningCells(pattern) {
    if (!pattern) return

    pattern.forEach(index => {
        cells[index].classList.add('winning-cell')
    })
}

function updateStatus(result) {
    if (result) gameActive = false

    cells.forEach((cell, i) => {
        const player = gameBoard[i][0]
        if (gameBoard[i].length > 1) {
            cell.textContent = player + '₀₁₂' [gameBoard[i][1]]
        } else {
            cell.textContent = player
        }
        // cell.textContent = gameBoard[i][0]
    })

    if (result) {
        const { winner,  pattern } = result
        gameStatus.textContent = `${winner} wins!`
        highlightWinningCells(pattern)
    } else {
        gameStatus.textContent = `${currentPlayer}'s turn`
    }
}