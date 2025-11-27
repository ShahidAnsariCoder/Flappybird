// Flappy Bird clone — HTML5 Canvas
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // DOM
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySub = document.getElementById('overlay-sub');
  const restartBtn = document.getElementById('restart');

  // Game state
  let bird, pipes, frame, gravity, flapPower, pipeGap, pipeWidth, spawnTimer, score, best, running;

  best = Number(localStorage.getItem('flappy-best') || 0);
  bestEl.textContent = `Best: ${best}`;

  function reset() {
    bird = { x: 90, y: H/2, w: 34, h: 24, vy: 0, rot: 0 };
    pipes = []; // each pipe => {x, topHeight}
    frame = 0;
    gravity = 0.6;
    flapPower = -9.5;
    pipeGap = 150;
    pipeWidth = 56;
    spawnTimer = 0;
    score = 0;
    running = true;
    overlay.classList.add('hidden');
    scoreEl.textContent = `Score: ${score}`;
  }

  function spawnPipe() {
    const minTop = 60;
    const maxTop = H - pipeGap - 140; // leave room for ground
    const topHeight = Math.random()*(maxTop - minTop) + minTop;
    pipes.push({ x: W + 10, top: Math.floor(topHeight), passed: false });
  }

  function update() {
    if(!running) return;

    frame++;
    // physics
    bird.vy += gravity;
    bird.y += bird.vy;
    bird.rot = Math.max(-0.6, Math.min(1.2, bird.vy / 12));

    // ground collision
    const groundY = H - 80;
    if (bird.y + bird.h/2 >= groundY) {
      bird.y = groundY - bird.h/2;
      endGame();
      return;
    }
    if (bird.y - bird.h/2 <= 0) {
      bird.y = bird.h/2;
      bird.vy = 0;
    }

    // pipes spawn
    spawnTimer += 1;
    const spawnInterval = 90; // frames (approx 1.5s at 60fps)
    if (spawnTimer > spawnInterval) {
      spawnPipe();
      spawnTimer = 0;
    }

    // update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= 2.6 + Math.min(2.2, score * 0.06); // speed increases slightly with score

      // scoring
      if (!p.passed && p.x + pipeWidth < bird.x - bird.w/2) {
        p.passed = true;
        score += 1;
        scoreEl.textContent = `Score: ${score}`;
        if (score > best) {
          best = score;
          bestEl.textContent = `Best: ${best}`;
          localStorage.setItem('flappy-best', best);
        }
      }

      // remove off-screen
      if (p.x + pipeWidth < -20) pipes.splice(i, 1);
    }

    // collision with pipes
    for (const p of pipes) {
      const topRect = { x: p.x, y: 0, w: pipeWidth, h: p.top };
      const bottomRect = { x: p.x, y: p.top + pipeGap, w: pipeWidth, h: H - (p.top + pipeGap) - 80 };

      if (rectCircleCollide(topRect, bird) || rectCircleCollide(bottomRect, bird)) {
        endGame();
        return;
      }
    }
  }

  function rectCircleCollide(rect, circle) {
    // circle center
    const cx = circle.x;
    const cy = circle.y;
    // find closest point to circle within rectangle
    const closestX = clamp(cx, rect.x, rect.x + rect.w);
    const closestY = clamp(cy, rect.y, rect.y + rect.h);
    // distance from circle to that point
    const dx = cx - closestX;
    const dy = cy - closestY;
    const radius = Math.max(circle.w, circle.h) * 0.5 - 2;
    return (dx*dx + dy*dy) < (radius*radius);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function endGame() {
    running = false;
    overlay.classList.remove('hidden');
    overlayTitle.textContent = 'Game Over';
    overlaySub.textContent = `Your score: ${score}`;
    // show encouragement for high score
    if (score >= 10) overlaySub.textContent += ' — Great job!';
  }

  function flap() {
    if (!running) {
      reset();
      return;
    }
    bird.vy = flapPower;
  }

  // rendering
  function draw() {
    // background
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawPipes();
    drawGround();
    drawBird();
    if (!running) {
      // dim screen and show hint
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawSky() {
    // subtle clouds (simple)
    ctx.fillStyle = '#9ce7f7';
    ctx.fillRect(0, 0, W, H - 80);
  }

  function drawPipes() {
    for (const p of pipes) {
      // top pipe
      ctx.fillStyle = '#2b9a2b';
      roundRect(ctx, p.x, 0, pipeWidth, p.top, 6, true, false);
      // bottom pipe
      ctx.fillStyle = '#2b9a2b';
      roundRect(ctx, p.x, p.top + pipeGap, pipeWidth, H - (p.top + pipeGap) - 80, 6, true, false);

      // darker bezel
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(p.x, p.top - 6, pipeWidth, 6);
      ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, 6);
    }
  }

  function drawGround() {
    ctx.fillStyle = '#d2a66b';
    ctx.fillRect(0, H - 80, W, 80);
    // simple repeating lines for texture
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let x = 0; x < W; x += 18) ctx.fillRect(x, H - 80, 10, 6);
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);
    // body
    ctx.fillStyle = '#ffd54a';
    roundRect(ctx, -bird.w/2, -bird.h/2, bird.w, bird.h, 6, true, false);
    // wing
    ctx.fillStyle = '#ffb74d';
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.w*0.4, bird.h*0.25, -0.8, 0, Math.PI*2);
    ctx.fill();
    // eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.w*0.14, -bird.h*0.08, 2.4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // utils
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // main loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      flap();
    }
  });

  canvas.addEventListener('click', () => flap());
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
  }, { passive: false });

  restartBtn.addEventListener('click', () => {
    reset();
  });

  // init
  reset();
  requestAnimationFrame(loop);
})();
