import { minimax } from "./minimax.js"

self.onmessage = (e) => {
    const { type, currentPlayer, maxDepth, gameBoard } = e.data
    const scores = minimax(currentPlayer, maxDepth, gameBoard)
    self.postMessage({ type, scores })
}
