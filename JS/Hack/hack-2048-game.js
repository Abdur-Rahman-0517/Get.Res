// ===== 2048 FULL HACK ===== //
// Run this in the browser console (F12)

// 1. Override the game's move function to always place a 2048 tile
var originalMove = GameManager.prototype.move;
GameManager.prototype.move = function (direction) {
  originalMove.call(this, direction);
  this.grid.cells.forEach((row) => {
    row.forEach((cell) => {
      if (cell) {
        cell.value = 2048; // All tiles become 2048
      }
    });
  });
  this.updateView();
};

// 2. Force a win instantly
function forceWin() {
  if (window.GameManager) {
    const manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
    manager.won = true;
    manager.keepPlaying = true;
    manager.actuate();
    console.log("🎉 You won! (forced)");
  } else {
    console.error("GameManager not found. Is this 2048?");
  }
}

// 3. Set custom board (replace numbers as desired)
function setCustomBoard(board) {
  const manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
  manager.grid = new Grid(4);
  manager.grid.cells = board.map(row => row.map(val => val ? new Tile({ x: 0, y: 0 }, val) : null));
  manager.actuate();
  console.log("✅ Custom board set!");
}

// 4. Add infinite moves (no more 'Game Over')
GameManager.prototype.isGameTerminated = function () {
  return false;
};

// 5. Spawn a specific tile (x, y, value)
function spawnTile(x, y, value) {
  const manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
  const tile = new Tile({ x, y }, value);
  manager.grid.insertTile(tile);
  manager.actuate();
  console.log(`🔄 Spawned ${value} at (${x}, ${y})`);
}

// 6. Set your score to any value
function setScore(score) {
  if (window.GameManager) {
    const manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
    manager.score = score;
    manager.actuate();
    console.log(`🏆 Score set to ${score}!`);
  }
}

// ==== USAGE EXAMPLES ==== //
// forceWin(); // Instantly win the game
// setScore(999999); // Set high score
// spawnTile(0, 0, 2048); // Spawn 2048 at top-left
// setCustomBoard([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]); // Custom board

console.log("🔥 2048 HACK LOADED! Use forceWin(), setScore(), etc.");
