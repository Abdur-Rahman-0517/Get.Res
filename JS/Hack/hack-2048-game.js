// ===== 2048 ULTIMATE HACK ===== //
// Works even on obfuscated versions

// 1. Find the game manager (works on most 2048 clones)
function getGameManager() {
  const manager = Object.values(document.querySelector("body").children)
    .find(e => e.hasOwnProperty("move") || e.hasOwnProperty("grid"));
  if (!manager) throw new Error("GameManager not found. Try another 2048 site.");
  return manager;
}

// 2. Force all tiles to become 2048
function setAllTilesTo2048() {
  const gm = getGameManager();
  gm.grid.cells.forEach(row => {
    row.forEach(cell => {
      if (cell) cell.value = 2048;
    });
  });
  gm.actuate();
  console.log("✅ All tiles set to 2048!");
}

// 3. Instantly win the game
function forceWin() {
  const gm = getGameManager();
  gm.won = true;
  gm.keepPlaying = true;
  gm.actuate();
  console.log("🎉 You won! (forced)");
}

// 4. Set custom score
function setScore(score) {
  const gm = getGameManager();
  gm.score = score;
  gm.actuate();
  console.log(`🏆 Score set to ${score}!`);
}

// 5. Disable game over (infinite moves)
function disableGameOver() {
  const gm = getGameManager();
  gm.isGameTerminated = () => false;
  console.log("♾️ Game Over disabled!");
}

// 6. Spawn a specific tile (x, y, value)
function spawnTile(x, y, value) {
  const gm = getGameManager();
  const tile = { position: { x, y }, value };
  gm.grid.insertTile(tile);
  gm.actuate();
  console.log(`🔄 Spawned ${value} at (${x}, ${y})`);
}

// ==== RUN HACKS ==== //
// Uncomment the hacks you want:
// setAllTilesTo2048(); // Every tile becomes 2048
// forceWin(); // Instantly win
// setScore(999999); // Set high score
// disableGameOver(); // Never lose
// spawnTile(0, 0, 4096); // Spawn 4096 at top-left

console.log("🚀 2048 HACKS LOADED! Run commands like forceWin(), setScore(), etc.");
