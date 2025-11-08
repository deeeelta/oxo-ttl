from dataclasses import dataclass
from collections import deque

@dataclass(frozen=True)
class State:
    board: tuple
    player: bool

    # (None,) -> 0
    # (False, _) -> 1, 2, 3
    # (True, _) -> 4, 5, 6

    def encode(self) -> int:
        result = 0
        for cell in self.board:
            if cell[0] is None:
                digit = 0
            elif cell[0] == False:
                digit = cell[1] + 1
            else:
                digit = cell[1] + 4
            result = result * 7 + digit
        if self.player == False:
            result = result * 2
        else:
            result = result * 2 + 1
        return result

def decode(n: int) -> State:
    player = (n % 2 == 1)
    n //= 2
    board = []
    for _ in range(9):
        digit = n % 7
        if digit == 0:
            cell = (None,)
        elif digit <= 3:
            cell = (False, digit - 1)
        else:
            cell = (True, digit - 4)
        board.append(cell)
        n //= 7
    board.reverse()
    return State(tuple(board), player)

WIN_PATTERNS = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),
    (0, 3, 6), (1, 4, 7), (2, 5, 8),
    (0, 4, 8), (2, 4, 6),
]

def valid_positions(state: State):
    # return [i for i in range(9) if state.board[i][0] is None]
    indices = []
    for i in range(9):
        if state.board[i][0] is None:
            indices.append(i)
    return indices

def move(state: State, position: int) -> State:
    def new_item(i: int) -> tuple:
        if i == position:
            return (state.player, 2)
        elif state.board[i][0] == state.player:
            ttl = state.board[i][1]
            if ttl <= 0:
                return (None,)
            else:
                return (state.player, ttl - 1)
        else:
            return state.board[i]
    new_board = tuple(map(new_item, range(9)))
    return State(new_board, not state.player)

def check_winner(state: State) -> bool | None:
    for (a, b, c) in WIN_PATTERNS:
        player = state.board[a][0]
        if player is not None and player == state.board[b][0] and player == state.board[c][0]:
            return player
    return None

def main():
    init_state1 = State(((None,),) * 9, True)
    init_state2 = State(((None,),) * 9, False)

    transitions: dict[int, list[tuple[int, int]]] = {
        init_state1.encode(): [],
        init_state2.encode(): [],
    }
    rev_transitions = transitions.copy()

    def add_transition(curr, pos, next):
        edges = transitions.get(curr)
        if edges is not None:
            edges.append((pos, next))
        else:
            transitions[curr] = [(pos, next)]
        rev_edges = rev_transitions.get(next)
        if rev_edges is not None:
            rev_edges.append((pos, curr))
        else:
            rev_transitions[next] = [(pos, curr)]

    end_states: dict[bool, list[int]] = {True: [], False: []}
    queue = deque([init_state1, init_state2])
    searched = set([init_state1.encode(), init_state2.encode()])
    while len(queue) > 0:
        curr_state = queue.popleft()
        curr_id = curr_state.encode()
        for pos in valid_positions(curr_state):
            next_state = move(curr_state, pos)
            next_id = next_state.encode()
            add_transition(curr_id, pos, next_id)
            if next_id not in searched:
                searched.add(next_id)
                winner = check_winner(next_state)
                if winner is None:
                    queue.append(next_state)
                else:
                    end_states[winner].append(next_id)

    player_to_win = False
    win_states = set(end_states[player_to_win])
    win_actions: dict[int, set[int]] = dict()
    queue = deque(end_states[player_to_win])
    searched = set()
    while len(queue) > 0:
        idx = queue.popleft()
        searched.add(idx)
        for pos, parent_id in rev_transitions[idx]:
            parent_state = decode(parent_id)
            if parent_state.player == player_to_win:
                win_states.add(parent_id)
                if parent_id not in searched:
                    queue.append(parent_id)
                parent_win_actions = win_actions.get(parent_id)
                if parent_win_actions is not None:
                    parent_win_actions.add(pos)
                else:
                    win_actions[parent_id] = set([pos])
            else:
                must_win = True
                for _, sibling_id in transitions[parent_id]:
                    if sibling_id not in win_states:
                        must_win = False
                        break
                if must_win:
                    win_states.add(parent_id)
                    if parent_id not in searched:
                        queue.append(parent_id)

    win_actions = {id: list(actions) for id, actions in win_actions.items()}
    print('const winActions = {', end='')
    for id, actions in win_actions.items():
        print(f'{id}:{actions},', end='')
    print('};', end='')

if __name__ == '__main__':
    main()
