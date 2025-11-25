# Battle Quiz Client

This is the frontend for the Multiplayer Battle Quiz game, built with React, Vite, and Tailwind CSS.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

## Game Rules

-   **2 Players** are required to start a game.
-   **Simultaneous Turns**: Both players must answer the quiz (or wait for the timer to end) before the battle action occurs.
-   **Scoring**:
    -   Correct Answer: Attack the opponent.
    -   Wrong Answer: Take damage.
    -   Both Correct: Clash (small damage to both or based on speed - currently balanced for simultaneous).
    -   Combo: Consecutive correct answers increase combo count.

## Project Structure

-   `src/components/Lobby.jsx`: Entry screen for name input and room creation/joining.
-   `src/components/BattleGame.jsx`: Main game controller, handles Socket.io events and UI.
-   `src/components/GameCanvas.jsx`: Renders the battle animations using HTML5 Canvas.
-   `src/socket.js`: Singleton Socket.io client instance.
