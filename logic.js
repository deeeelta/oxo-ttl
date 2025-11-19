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

function minimax(maxDepth, board, depth, isMaximizing) {
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
        const [_, score] = minimax(maxDepth, board, depth + 1, !isMaximizing)
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

function encodeState(board, player) {
    const needRevert = (player == 'O')
    let n = 0
    board.forEach(c => {
        let digit
        if (c[0] == '') {
            digit = 0
        } else if (c[0] == 'X') {
            digit = needRevert ? c[1] + 4 : c[1] + 1
        } else if (c[0] == 'O') {
            digit = needRevert ? c[1] + 1 : c[1] + 4
        }
        n = n * 7 + digit
    })
    return n * 2
}

let gameBoard
let allowMove
let currentPlayer
let currentWinActions
let historyPatches = []
const cells = document.querySelectorAll('.cell')
const gameStatus = document.getElementById('game-status')
const winHintButton = document.getElementById('win-hint')
const winMoveButton = document.getElementById('win-move')
const depthSlider = document.getElementById('minimax-depth')
const depthValueLabel = document.getElementById('depth-value')
resetGame()
updateDepthLabel()
document.getElementById('reset').addEventListener('click', resetGame)
document.getElementById('undo').addEventListener('click', undoGame)
depthSlider.addEventListener('input', updateDepthLabel)
document.getElementById('board').addEventListener('click', handleCellClick)
document.getElementById('minimax-hint').addEventListener('click', minimaxHint)
document.getElementById('minimax-move').addEventListener('click', minimaxMove)
winHintButton.addEventListener('click', winHint)
winMoveButton.addEventListener('clink', winMove)

function updateDepthLabel() {
    depthValueLabel.textContent = depthSlider.value;
}

function resetGame() {
    gameBoard = [
        [''], [''], [''],
        [''], [''], [''],
        [''], [''], [''],
    ]
    allowMove = true
    currentPlayer = 'X'
    historyPatches = []

    cells.forEach(cell => {
        cell.textContent = ''
        cell.classList.remove('winning-cell')
    })

    updateStatus(null)
}

function undoGame() {
    if (historyPatches.length > 0) {
        const patch = historyPatches.pop()
        revert(gameBoard, patch)
        currentPlayer = currentPlayer == 'O' ? 'X' : 'O'
        if (!allowMove) {
            allowMove = true
            cells.forEach(cell => {
                cell.textContent = ''
                cell.classList.remove('winning-cell')
            })
        }
        updateStatus(null)
    }
}

function moveAndUpdate(position) {
    const patch = move(gameBoard, currentPlayer, position)
    historyPatches.push(patch)
    currentPlayer = currentPlayer == 'O' ? 'X' : 'O'
    const result = checkWinner(gameBoard)
    updateStatus(result)
    return result
}

function handleCellClick(e) {
    const cellIndex = parseInt(e.target.getAttribute('data-index'))

    if (!allowMove || gameBoard[cellIndex][0] !== '')
        return

    moveAndUpdate(cellIndex)
}

function minimaxHint() {
    if (!allowMove) return

    const maxDepth = Number(depthSlider.value)
    const [bestMoves, _] = minimax(maxDepth, gameBoard, 0, true)
    hintCells(bestMoves)
}

function minimaxMove() {
    if (!allowMove) return

    const maxDepth = Number(depthSlider.value)
    const [bestMoves, _] = minimax(maxDepth, gameBoard, 0, true)
    const bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)]
    return moveAndUpdate(bestMove)
}

function winHint() {
    if (!allowMove) return

    hintCells(currentWinActions)
}

function winMove() {
    if (!allowMove) return

    const move = currentWinActions[Math.floor(Math.random() * currentWinActions.length)]
    return moveAndUpdate(move)
}

function highlightWinningCells(pattern) {
    if (!pattern) return

    pattern.forEach(index => {
        cells[index].classList.add('winning-cell')
    })
}

function hintCells(pattern) {
    if (!pattern) return

    pattern.forEach(index => {
        cells[index].classList.add('hint-cell')
    })

    setTimeout((() => {
        pattern.forEach(index => {
            cells[index].classList.remove('hint-cell')
        })
    }), 550)
}

function updateStatus(result) {
    cells.forEach((cell, i) => {
        const player = gameBoard[i][0]
        if (gameBoard[i].length > 1) {
            cell.textContent = player + '₀₁₂' [gameBoard[i][1]]
        } else {
            cell.textContent = player
        }
        // cell.textContent = gameBoard[i][0]
    })

    const currStateCode = encodeState(gameBoard, currentPlayer)
    currentWinActions = winActions[currStateCode]
    if (currentWinActions === undefined) {
        winHintButton.disabled = true
    } else {
        winHintButton.disabled = false
    }

    if (result) {
        allowMove = false
        const { winner,  pattern } = result
        gameStatus.textContent = `${winner} wins!`
        highlightWinningCells(pattern)
    } else {
        gameStatus.textContent = `${currentPlayer}'s turn`
    }
}