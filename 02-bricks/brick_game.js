"use strict";

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

const GAME = {
  width: canvas.width,
  height: canvas.height,
  hudHeight: 60,
  initialLives: 3,
  pointsPerBalloon: 10,
};

const BALLOON = {
  rows: 7,
  columns: 9,
  width: 72,
  height: 48,
  columnGap: 18,
  rowGap: 8,
  zigzagDrop: 8,
  top: 78,
  colors: ["#ff5c8a", "#7c6cff", "#28c7d9", "#ffb52e", "#6bd66b"],
};

const PLAYER = {
  width: 110,
  height: 80,
  speed: 620,
  bottomGap: 10,
};

const NEEDLE = { radius: 9, speed: 300 };
const BANANA = { width: 26, height: 34, speed: 180 };
const keys = { left: false, right: false };

const playerImage = new Image();
playerImage.src = "water_arcade_player.png";

let player;
let needle;
let balloons;
let bananas;
let score;
let lives;
let gameState;
let statusMessage;
let lastTime = 0;

function createBalloons() {
  const result = [];
  const totalWidth =
    BALLOON.columns * BALLOON.width +
    (BALLOON.columns - 1) * BALLOON.columnGap;
  const startX = (GAME.width - totalWidth) / 2;
  const rowStep = BALLOON.height + BALLOON.rowGap + BALLOON.zigzagDrop;

  for (let row = 0; row < BALLOON.rows; row += 1) {
    for (let column = 0; column < BALLOON.columns; column += 1) {
      const index = row * BALLOON.columns + column;
      const verticalOffset =
        (row + column) % 2 === 0 ? 0 : BALLOON.zigzagDrop;
      result.push({
        x: startX + column * (BALLOON.width + BALLOON.columnGap),
        y: BALLOON.top + row * rowStep + verticalOffset,
        width: BALLOON.width,
        height: BALLOON.height,
        color: BALLOON.colors[(row + column) % BALLOON.colors.length],
        hasBanana: index % 5 === 2,
        active: true,
      });
    }
  }
  return result;
}

function resetPlayerAndNeedle() {
  player = {
    x: (GAME.width - PLAYER.width) / 2,
    y: GAME.height - PLAYER.bottomGap - PLAYER.height,
    width: PLAYER.width,
    height: PLAYER.height,
  };
  needle = {
    x: GAME.width / 2,
    y: player.y - NEEDLE.radius - 3,
    radius: NEEDLE.radius,
    velocityX: NEEDLE.speed,
    velocityY: -NEEDLE.speed,
  };
}

function resetGame() {
  score = 0;
  lives = GAME.initialLives;
  balloons = createBalloons();
  bananas = [];
  gameState = "ready";
  statusMessage = "스페이스키를 눌러 시작하세요";
  resetPlayerAndNeedle();
}

function drawText(text, x, y, align = "left", size = 20) {
  context.fillStyle = "#16324f";
  context.font = `bold ${size}px "Malgun Gothic", sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillText(text, x, y);
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, GAME.height);
  gradient.addColorStop(0, "#b9f1ff");
  gradient.addColorStop(0.65, "#e8fbff");
  gradient.addColorStop(1, "#9be7f5");
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME.width, GAME.height);

  const bubbles = [
    [35, 120, 18], [955, 145, 24], [70, 390, 12],
    [920, 440, 17], [170, 590, 10], [840, 610, 14],
  ];
  context.strokeStyle = "rgba(255, 255, 255, 0.72)";
  context.lineWidth = 4;
  for (const [x, y, radius] of bubbles) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawHud() {
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.fillRect(0, 0, GAME.width, GAME.hudHeight);
  context.strokeStyle = "#49bfd6";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, GAME.hudHeight);
  context.lineTo(GAME.width, GAME.hudHeight);
  context.stroke();
  drawText(`점수: ${score}`, 24, 30);
  drawText(statusMessage, GAME.width / 2, 30, "center", 18);
  drawText(`남은 기회: ${lives}`, GAME.width - 24, 30, "right");
}

function drawBalloons() {
  for (const balloon of balloons) {
    if (!balloon.active) continue;
    const centerX = balloon.x + balloon.width / 2;
    const centerY = balloon.y + balloon.height / 2 - 2;
    context.beginPath();
    context.ellipse(centerX, centerY, 30, 21, 0, 0, Math.PI * 2);
    context.fillStyle = balloon.color;
    context.fill();
    context.strokeStyle = "rgba(28, 69, 99, 0.55)";
    context.lineWidth = 2;
    context.stroke();
    context.beginPath();
    context.ellipse(centerX - 10, centerY - 7, 6, 5, -0.45, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.72)";
    context.fill();
    context.beginPath();
    context.moveTo(centerX - 6, balloon.y + balloon.height - 4);
    context.lineTo(centerX + 6, balloon.y + balloon.height - 4);
    context.lineTo(centerX, balloon.y + balloon.height + 3);
    context.closePath();
    context.fillStyle = balloon.color;
    context.fill();
  }
}

function drawPlayer() {
  if (playerImage.complete && playerImage.naturalWidth > 0) {
    context.drawImage(playerImage, player.x, player.y, player.width, player.height);
    return;
  }
  context.fillStyle = "#ffd21f";
  context.fillRect(player.x, player.y, player.width, player.height);
}

function drawNeedle() {
  const angle = Math.atan2(needle.velocityY, needle.velocityX);
  context.save();
  context.translate(needle.x, needle.y);
  context.rotate(angle);
  context.strokeStyle = "#5d6b78";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-12, 0);
  context.lineTo(8, 0);
  context.stroke();
  context.fillStyle = "#f5fbff";
  context.beginPath();
  context.moveTo(16, 0);
  context.lineTo(5, -5);
  context.lineTo(5, 5);
  context.closePath();
  context.fill();
  context.strokeStyle = "#5d6b78";
  context.lineWidth = 1.5;
  context.stroke();
  context.fillStyle = "#ff5c8a";
  context.beginPath();
  context.arc(-12, 0, 5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBananas() {
  for (const banana of bananas) {
    context.save();
    context.translate(banana.x + banana.width / 2, banana.y + banana.height / 2);
    context.rotate(banana.rotation);
    context.strokeStyle = "#ffd21f";
    context.lineWidth = 10;
    context.lineCap = "round";
    context.beginPath();
    context.arc(0, -2, 12, 0.2 * Math.PI, 1.45 * Math.PI);
    context.stroke();
    context.strokeStyle = "#d89b00";
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  }
}

function drawGameOverOverlay() {
  if (gameState !== "gameOver") return;
  context.fillStyle = "rgba(15, 58, 82, 0.72)";
  context.fillRect(0, GAME.hudHeight, GAME.width, GAME.height - GAME.hudHeight);
  context.fillStyle = "#ffde33";
  context.font = 'bold 120px "Malgun Gothic", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("LOSE", GAME.width / 2, GAME.height / 2);
  context.fillStyle = "#ffffff";
  context.font = 'bold 24px "Malgun Gothic", sans-serif';
  context.fillText("스페이스키를 눌러 다시 시작하세요", GAME.width / 2, GAME.height / 2 + 90);
}

function draw() {
  context.clearRect(0, 0, GAME.width, GAME.height);
  drawBackground();
  drawHud();
  drawBalloons();
  drawBananas();
  drawPlayer();
  drawNeedle();
  drawGameOverOverlay();
}

function movePlayer(deltaTime) {
  if (keys.left) player.x -= PLAYER.speed * deltaTime;
  if (keys.right) player.x += PLAYER.speed * deltaTime;
  player.x = Math.max(0, Math.min(GAME.width - player.width, player.x));
  if (gameState === "ready" || gameState === "lifeLost") {
    needle.x = player.x + player.width / 2;
    needle.y = player.y - needle.radius - 3;
  }
}

function circleTouchesRectangle(circle, rectangle) {
  const closestX = Math.max(rectangle.x, Math.min(circle.x, rectangle.x + rectangle.width));
  const closestY = Math.max(rectangle.y, Math.min(circle.y, rectangle.y + rectangle.height));
  const differenceX = circle.x - closestX;
  const differenceY = circle.y - closestY;
  return differenceX * differenceX + differenceY * differenceY <= circle.radius * circle.radius;
}

function rectanglesTouch(first, second) {
  return first.x < second.x + second.width && first.x + first.width > second.x &&
    first.y < second.y + second.height && first.y + first.height > second.y;
}

function handleWallCollision() {
  if (needle.x - needle.radius <= 0 && needle.velocityX < 0) {
    needle.x = needle.radius;
    needle.velocityX *= -1;
  }
  if (needle.x + needle.radius >= GAME.width && needle.velocityX > 0) {
    needle.x = GAME.width - needle.radius;
    needle.velocityX *= -1;
  }
  if (needle.y - needle.radius <= GAME.hudHeight && needle.velocityY < 0) {
    needle.y = GAME.hudHeight + needle.radius;
    needle.velocityY *= -1;
  }
}

function handlePlayerCollision() {
  if (needle.velocityY <= 0 || !circleTouchesRectangle(needle, player)) return;
  needle.y = player.y - needle.radius;
  const hitPosition = (needle.x - (player.x + player.width / 2)) / (player.width / 2);
  const bounceAngle = hitPosition * (Math.PI / 3);
  const speed = Math.hypot(needle.velocityX, needle.velocityY);
  needle.velocityX = speed * Math.sin(bounceAngle);
  needle.velocityY = -Math.abs(speed * Math.cos(bounceAngle));
}

function dropBanana(balloon) {
  bananas.push({
    x: balloon.x + balloon.width / 2 - BANANA.width / 2,
    y: balloon.y + balloon.height / 2,
    width: BANANA.width,
    height: BANANA.height,
    speed: BANANA.speed,
    rotation: 0,
  });
}

function handleBalloonCollision() {
  for (const balloon of balloons) {
    if (!balloon.active || !circleTouchesRectangle(needle, balloon)) continue;
    balloon.active = false;
    score += GAME.pointsPerBalloon;
    if (balloon.hasBanana) dropBanana(balloon);
    const overlaps = [
      needle.x + needle.radius - balloon.x,
      balloon.x + balloon.width - (needle.x - needle.radius),
      needle.y + needle.radius - balloon.y,
      balloon.y + balloon.height - (needle.y - needle.radius),
    ];
    const smallest = Math.min(...overlaps);
    if (smallest === overlaps[0] || smallest === overlaps[1]) needle.velocityX *= -1;
    else needle.velocityY *= -1;
    if (balloons.every((item) => !item.active)) {
      gameState = "won";
      bananas = [];
      statusMessage = "축하합니다! 모든 물풍선을 터뜨렸습니다. 스페이스키를 눌러 다시 시작하세요";
    }
    break;
  }
}

function loseLife(message) {
  lives -= 1;
  bananas = [];
  if (lives <= 0) {
    gameState = "gameOver";
    statusMessage = "게임 오버! 스페이스키를 눌러 다시 시작하세요";
    return;
  }
  gameState = "lifeLost";
  statusMessage = `${message} 스페이스키를 눌러 계속하세요`;
  resetPlayerAndNeedle();
}

function updateBananas(deltaTime) {
  for (const banana of bananas) {
    banana.y += banana.speed * deltaTime;
    banana.rotation += 2.6 * deltaTime;
    if (rectanglesTouch(banana, player)) {
      loseLife("바나나에 맞았습니다!");
      return false;
    }
  }
  bananas = bananas.filter((banana) => banana.y < GAME.height + banana.height);
  return true;
}

function update(deltaTime) {
  movePlayer(deltaTime);
  if (gameState !== "playing") return;
  needle.x += needle.velocityX * deltaTime;
  needle.y += needle.velocityY * deltaTime;
  handleWallCollision();
  handlePlayerCollision();
  handleBalloonCollision();
  if (gameState !== "playing" || !updateBananas(deltaTime)) return;
  if (needle.y - needle.radius > GAME.height) loseLife("바늘을 놓쳤습니다!");
}

function gameLoop(currentTime) {
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.03);
  lastTime = currentTime;
  update(deltaTime);
  draw();
  window.requestAnimationFrame(gameLoop);
}

function startOrRestart() {
  if (gameState === "won" || gameState === "gameOver") resetGame();
  if (gameState === "ready" || gameState === "lifeLost") {
    gameState = "playing";
    statusMessage = "바나나는 피하고 물풍선을 터뜨리세요!";
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "ArrowLeft") keys.left = true;
  if (event.code === "ArrowRight") keys.right = true;
  if (event.code === "Space" && !event.repeat) startOrRestart();
});
window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") keys.left = false;
  if (event.code === "ArrowRight") keys.right = false;
});
window.addEventListener("blur", () => {
  keys.left = false;
  keys.right = false;
});

resetGame();
window.requestAnimationFrame(gameLoop);
