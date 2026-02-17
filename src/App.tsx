import { useReducer } from 'react';
import { gameReducer, initialState } from './state/reducer';
import { useTimer } from './hooks/useTimer';
import { Game } from './components/Game/Game';
import './App.css';

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  useTimer(state.status, dispatch);

  return (
    <div className="app">
      <h1 className="title">Minesweeper</h1>
      <Game state={state} dispatch={dispatch} />
    </div>
  );
}

export default App;
