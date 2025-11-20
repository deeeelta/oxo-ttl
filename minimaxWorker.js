import { minimax } from "./minimax.js"

self.onmessage = (e) => {
    const { type, currentPlayer, maxDepth, gameBoard } = e.data
    const [bestMoves, _] = minimax(currentPlayer, maxDepth, gameBoard, 0, true)
    self.postMessage({ type, bestMoves })
}
