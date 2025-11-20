import { randomElement, move, revert, checkWinner } from "./minimax.js"

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
const searchIndicator = document.getElementById("search-indicator")
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

function searchingBegin() {
    document.body.classList.add('searching')
    setTimeout(() => {
        if (document.body.classList.contains('searching'))
            searchIndicator.style.display = 'inline-flex'
    }, 60)
}

function searchingEnd(nMove) {
    document.body.classList.remove('searching')
    searchIndicator.style.display = 'none'
    console.log(nMove, "moves explored")
}

function moveAndUpdate(position) {
    const patch = move(gameBoard, currentPlayer, position)
    historyPatches.push(patch)
    currentPlayer = currentPlayer == 'O' ? 'X' : 'O'
    const result = checkWinner(gameBoard)
    updateStatus(result)
}

function handleCellClick(e) {
    const cellIndex = parseInt(e.target.getAttribute('data-index'))

    if (!allowMove || gameBoard[cellIndex][0] !== '')
        return

    moveAndUpdate(cellIndex)
}

const minimaxWorker = new Worker('./minimaxWorker.js', { type: 'module' })
minimaxWorker.onmessage = (e) => {
    const { type, scores, nMove } = e.data

    searchingEnd(nMove)
    let bestScore = -Infinity
    let bestMoves = []
    scores.forEach((score, i) => {
        if (score > bestScore) {
            bestScore = score
            bestMoves = [i]
        } else if (score == bestScore) {
            bestMoves.push(i)
        }
    })

    if (type == 'HINT') {
        hintCells(bestMoves, 550)
    } else if (type == 'MOVE') {
        const bestMove = randomElement(bestMoves)
        moveAndUpdate(bestMove)
    }
}

function minimaxHint() {
    if (!allowMove) return

    searchingBegin()
    const maxDepth = Number(depthSlider.value)
    minimaxWorker.postMessage({
        type: 'HINT',
        currentPlayer,
        maxDepth,
        gameBoard
    })
}

function minimaxMove() {
    if (!allowMove) return

    searchingBegin()
    const maxDepth = Number(depthSlider.value)
    minimaxWorker.postMessage({
        type: 'MOVE',
        currentPlayer,
        maxDepth,
        gameBoard
    })
}

function winHint() {
    if (!allowMove) return

    hintCells(currentWinActions, 550)
}

function winMove() {
    if (!allowMove) return

    const move = randomElement(currentWinActions)
    moveAndUpdate(move)
}

function highlightWinningCells(pattern) {
    if (!pattern) return

    pattern.forEach(index => {
        cells[index].classList.add('winning-cell')
    })
}

function hintCells(pattern, time) {
    if (!pattern) return

    pattern.forEach(index => {
        cells[index].classList.add('hint-cell')
    })

    setTimeout(() => {
        pattern.forEach(index => {
            cells[index].classList.remove('hint-cell')
        })
    }, time)
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
        winMoveButton.disabled = true
        winHintButton.setAttribute('data-tooltip', 'No winning strategy exists :(')
        winMoveButton.setAttribute('data-tooltip', 'No winning strategy exists :(')
    } else {
        winHintButton.disabled = false
        winMoveButton.disabled = false
        winHintButton.setAttribute('data-tooltip', 'A winning strategy exists for you! :)')
        winMoveButton.setAttribute('data-tooltip', 'A winning strategy exists for you! :)')
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