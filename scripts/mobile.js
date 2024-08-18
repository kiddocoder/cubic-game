class RubiksCube {
      constructor() {
          this.colors = ['blue', 'green', 'white', 'yellow', 'orange', 'red'];
          this.pieces = document.getElementsByClassName('piece');
          this.guide = document.getElementById('guide');
          this.scene = document.getElementById('scene');
          this.pivot = document.getElementById('pivot');
          this.cube = document.getElementById('cube');
          this.timer = new Timer();
          this.score = new Score(this);
          this.music = new Audio('./musics/happyrock.mp3');
          this.music.loop = true;
          this.isGameOver = false;
          this.setupEventListeners();
      }

      setupEventListeners() {
          window.addEventListener('load', () => this.assembleCube());
          this.scene.addEventListener('mousedown', (e) => this.handleMouseDown(e));
          this.scene.addEventListener('touchstart', (e) => this.handleTouchStart(e)); // mobile events
          this.scene.addEventListener('touchmove', (e) => this.handleTouchMove(e)); // mobile events
          document.getElementById('start-button').addEventListener('click', () => this.startGame());
          document.getElementById('stop-button').addEventListener('click', () => this.stopGame());
          document.getElementById('resume-button').addEventListener('click', () => this.resumeGame());
      }

      startGame() {
          this.music.play();
          this.timer.start();
          this.score.reset();
          this.isGameOver = false;
          this.randomizeCube();
      }

      stopGame() {
          this.music.pause();
          this.timer.stop();
          this.score.addTimeBasedPoints(this.timer.getTotalSeconds());
      }

      resumeGame() {
          if (!this.isGameOver) {
              this.music.play();
              this.timer.resume();
          }
      }

      randomizeCube() {
          const faces = [0, 1, 2, 3, 4, 5];
          const moves = 20;
          for (let i = 0; i < moves; i++) {
              const face = faces[Math.floor(Math.random() * faces.length)];
              const clockwise = Math.random() < 0.5;
              this.animateRotation(face, clockwise, Date.now());
          }
      }

      mx(i, j) {
          return ([2, 4, 3, 5][j % 4 | 0] + i % 2 * ((j | 0) % 4 * 2 + 3) + 2 * (i / 2 | 0)) % 6;
      }

      getAxis(face) {
          return String.fromCharCode('X'.charCodeAt(0) + face / 2);
      }

      assembleCube() {
          for (let i = 0; i < 26; i++) {
              let id = 0;
              const moveto = (face) => {
                  id = id + (1 << face);
                  this.pieces[i].children[face].appendChild(document.createElement('div'))
                      .setAttribute('class', 'sticker ' + this.colors[face]);
                  return `translate${this.getAxis(face)}(${face % 2 * 4 - 2}em)`;
              };
              const x = this.mx(i, i % 18);
              this.pieces[i].style.transform = `rotateX(0deg)${moveto(i % 6)}${
                  i > 5 ? moveto(x) + (i > 17 ? moveto(this.mx(x, x + 2)) : '') : ''
              }`;
              this.pieces[i].setAttribute('id', `piece${id}`);
          }
      }

      getPieceBy(face, index, corner) {
          return document.getElementById(`piece${
              (1 << face) + (1 << this.mx(face, index)) + (1 << this.mx(face, index + 1)) * corner
          }`);
      }

      swapPieces(face, times) {
          for (let i = 0; i < 6 * times; i++) {
              const piece1 = this.getPieceBy(face, i / 2, i % 2);
              const piece2 = this.getPieceBy(face, i / 2 + 1, i % 2);
              for (let j = 0; j < 5; j++) {
                  const sticker1 = piece1.children[j < 4 ? this.mx(face, j) : face]?.firstChild;
                  const sticker2 = piece2.children[j < 4 ? this.mx(face, j + 1) : face]?.firstChild;
                  if (sticker1 && sticker2) {
                      const className = sticker1.className;
                      sticker1.className = sticker2.className;
                      sticker2.className = className;
                  }
              }
          }
          this.score.checkFaceCompletion(face);
      }

      animateRotation(face, cw, currentTime) {
          const k = 0.3 * (face % 2 * 2 - 1) * (2 * cw - 1);
          const qubes = Array(9).fill(this.pieces[face]).map((value, index) =>
              index ? this.getPieceBy(face, index / 2, index % 2) : value
          );
          const rotatePieces = () => {
              const passed = Date.now() - currentTime;
              const style = `rotate${this.getAxis(face)}(${k * passed * (passed < 300)}deg)`;
              qubes.forEach(piece => {
                  if (piece) {
                      piece.style.transform = piece.style.transform.replace(/rotate.\(\S+\)/, style);
                  }
              });
              if (passed >= 300) {
                  this.swapPieces(face, 3 - 2 * cw);
                  return;
              }
              requestAnimationFrame(rotatePieces);
          };
          rotatePieces();
      }

      handleMouseDown(md_e) {
          const startXY = this.pivot.style.transform.match(/-?\d+\.?\d*/g).map(Number);
          const element = md_e.target.closest('.element');
          const face = Array.from((element || this.cube).parentNode.children).indexOf(element);
          const mousemove = (mm_e) => {
              if (element) {
                  const gid = /\d/.exec(document.elementFromPoint(mm_e.pageX, mm_e.pageY).id);
                  if (gid && gid.input.includes('anchor')) {
                      mouseup();
                      const e = element.parentNode.children[this.mx(face, Number(gid) + 3)].hasChildNodes();
                      this.animateRotation(this.mx(face, Number(gid) + 1 + 2 * e), e, Date.now());
                  }
              } else {
                  this.pivot.style.transform =
                      `rotateX(${startXY[0] - (mm_e.pageY - md_e.pageY) / 2}deg)` +
                      `rotateY(${startXY[1] + (mm_e.pageX - md_e.pageX) / 2}deg)`;
              }
          };
          const mouseup = () => {
              document.body.appendChild(this.guide);
              this.scene.removeEventListener('mousemove', mousemove);
              document.removeEventListener('mouseup', mouseup);
              this.scene.addEventListener('mousedown', (e) => this.handleMouseDown(e));
          };
          (element || document.body).appendChild(this.guide);
          this.scene.addEventListener('mousemove', mousemove);
          document.addEventListener('mouseup', mouseup);
          this.scene.removeEventListener('mousedown', (e) => this.handleMouseDown(e));
      }

      handleTouchStart(e) {
          e.preventDefault(); // prevent page scrolling
          this.handleMouseDown(e.touches[0]); // use the contact point
      }

      handleTouchMove(e) {
          e.preventDefault(); // prevent page scrolling
          const touch = e.touches[0];
          this.handleMouseMove(touch); // use the contact point
      }

      handleMouseMove(mm_e) {
          // Vous pouvez ajouter ici la logique de mouvement similaire à celle de mousemove
      }

      getFaceElements(face) {
          return Array.from(this.pieces).filter(piece =>
              piece.children[face] && piece.children[face].firstChild !== null
          );
      }

      gameOver(isWin) {
          this.isGameOver = true;
          this.timer.stop();
          if (isWin) {
              alert(`Félicitations ! Vous avez résolu le Rubik's Cube ! Votre score : ${this.score.score}`);
          } else {
              alert(`Fin de la partie ! Votre score : ${this.score.score}`);
          }
          // Vous pouvez désactiver les contrôles ou afficher un bouton "Rejouer" ici
      }
  }

  class Timer {
      constructor() {
          this.timerElement = document.getElementById('clock-counter');
          this.totalSeconds = 0;
          this.intervalId = null;
      }

      start() {
          this.reset();
          this.intervalId = setInterval(() => this.updateTimer(), 1000);
      }

      stop() {
          clearInterval(this.intervalId);
      }

      resume() {
          if (!this.intervalId) {
              this.intervalId = setInterval(() => this.updateTimer(), 1000);
          }
      }

      reset() {
          this.stop();
          this.totalSeconds = 0;
          this.updateDisplay();
      }

      updateTimer() {
          this.totalSeconds++;
          this.updateDisplay();
      }

      updateDisplay() {
          const hours = Math.floor(this.totalSeconds / 3600);
          const minutes = Math.floor((this.totalSeconds % 3600) / 60);
          const seconds = this.totalSeconds % 60;
          const formatTime = (time) => String(time).padStart(2, '0');
          this.timerElement.innerText = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
      }

      getTotalSeconds() {
          return this.totalSeconds;
      }
  }

  class Score {
      constructor(rubiksCube) {
          this.scoreElement = document.getElementById('score-counter');
          this.score = 0;
          this.rubiksCube = rubiksCube;
          this.facesCompleted = new Set();
      }

      checkFaceCompletion(face) {
          const faceElements = this.rubiksCube.getFaceElements(face);
          const firstColor = faceElements[0].firstChild.className.split(' ')[1];
          const isComplete = faceElements.every(element =>
              element.firstChild.className.split(' ')[1] === firstColor
          );
          if (isComplete && !this.facesCompleted.has(face)) {
              this.facesCompleted.add(face);
              this.addPoints(3);
              this.checkGameCompletion();
          }
      }

      addPoints(points) {
          this.score += points;
          this.updateDisplay();
      }

      addTimeBasedPoints(elapsedSeconds) {
          const pointsToAdd = Math.floor(elapsedSeconds / 10);
          this.addPoints(pointsToAdd);
      }

      checkGameCompletion() {
          if (this.facesCompleted.size === 6) {
              this.rubiksCube.gameOver(true);
          }
      }

      updateDisplay() {
          this.scoreElement.innerText = this.score;
      }

      reset() {
          this.score = 0;
          this.facesCompleted.clear();
          this.updateDisplay();
      }
  }

  // Initialiser le jeu
  document.addEventListener('DOMContentLoaded', () => {
      new RubiksCube();
  });