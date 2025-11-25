import React, { useState } from 'react';
import Lobby from './components/Lobby';
import BattleGame from './components/BattleGame';

function App() {
  const [gameData, setGameData] = useState(null); // { roomId, playerId }

  const handleJoin = (roomId, playerId) => {
    setGameData({ roomId, playerId });
  };

  return (
    <div className="App">
      {!gameData ? (
        <Lobby onJoin={handleJoin} />
      ) : (
        <BattleGame roomId={gameData.roomId} playerId={gameData.playerId} />
      )}
    </div>
  );
}

export default App;
