// Class representing the Rubik's Cube game
class RubiksCube {
    constructor() {
        // Define the colors of the cube
        this.colors = ['blue', 'green', 'white', 'yellow', 'orange', 'red'];

        // Get DOM elements related to the cube
        this.pieces = document.getElementsByClassName('piece');
        this.guide = document.getElementById('guide');
        this.scene = document.getElementById('scene');
        this.pivot = document.getElementById('pivot');
        this.cube = document.getElementById('cube');

        // Initialize timer and score
        this.timer = new Timer();
        this.score = new Score(this);

        // Load background music
        this.music = new Audio('./musics/happyrock.mp3');
        this.music.loop = true;

        // Game state
        this.isGameOver = false;

        // Set up event listeners for user interactions
        this.setupEventListeners();
    }

    // Set up event listeners for various game actions
    setupEventListeners() {
        // Assemble the cube when the window loads
        window.addEventListener('load', () => this.assembleCube());

        // Handle mouse down events on the scene
        this.scene.addEventListener('mousedown', (e) => this.handleMouseDown(e));

        // Start, stop, and resume game button event listeners
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('stop-button').addEventListener('click', () => this.stopGame());
        document.getElementById('resume-button').addEventListener('click', () => this.resumeGame());
    }

    // Start the game: play music, start timer, reset score, and randomize the cube
    startGame() {
        this.music.play();
        this.timer.start();
        this.score.reset();
        this.isGameOver = false;
        this.randomizeCube();
    }

    // Stop the game: pause music, stop timer, and add points based on time
    stopGame() {
        this.music.pause();
        this.timer.stop();
        this.score.addTimeBasedPoints(this.timer.getTotalSeconds());
    }

    // Resume the game if it is not over
    resumeGame() {
        if (!this.isGameOver) {
            this.music.play();
            this.timer.resume();
        }
    }

    // Randomize the cube by making a series of random moves
    randomizeCube() {
        const faces = [0, 1, 2, 3, 4, 5]; // Array of cube faces
        const moves = 20; // Number of random moves
        for (let i = 0; i < moves; i++) {
            const face = faces[Math.floor(Math.random() * faces.length)]; // Random face
            const clockwise = Math.random() < 0.5; // Random direction
            this.animateRotation(face, clockwise, Date.now()); // Animate rotation
        }
    }

    // Helper function to map indices for piece movement
    mx(i, j) {
        return ([2, 4, 3, 5][j % 4 | 0] + i % 2 * ((j | 0) % 4 * 2 + 3) + 2 * (i / 2 | 0)) % 6;
    }

    // Get the axis of rotation based on the face index
    getAxis(face) {
        return String.fromCharCode('X'.charCodeAt(0) + face / 2);
    }

    // Assemble the cube by positioning the pieces and adding stickers
    assembleCube() {
        for (let i = 0; i < 26; i++) {
            let id = 0; // Initialize piece ID
            const moveto = (face) => {
                id = id + (1 << face); // Update ID based on face
                this.pieces[i].children[face].appendChild(document.createElement('div'))
                    .setAttribute('class', 'sticker ' + this.colors[face]); // Add sticker
                return `translate${this.getAxis(face)}(${face % 2 * 4 - 2}em)`; // Positioning
            };
            const x = this.mx(i, i % 18); // Get transformed index
            this.pieces[i].style.transform = `rotateX(0deg)${moveto(i % 6)}${
                i > 5 ? moveto(x) + (i > 17 ? moveto(this.mx(x, x + 2)) : '') : ''
            }`;
            this.pieces[i].setAttribute('id', `piece${id}`); // Set piece ID
        }
    }

    // Get a specific piece based on the face and index
    getPieceBy(face, index, corner) {
        return document.getElementById(`piece${
            (1 << face) + (1 << this.mx(face, index)) + (1 << this.mx(face, index + 1)) * corner
        }`);
    }

    // Swap pieces on a face during a rotation
    swapPieces(face, times) {
        for (let i = 0; i < 6 * times; i++) {
            const piece1 = this.getPieceBy(face, i / 2, i % 2);
            const piece2 = this.getPieceBy(face, i / 2 + 1, i % 2);
            for (let j = 0; j < 5; j++) {
                const sticker1 = piece1.children[j < 4 ? this.mx(face, j) : face].firstChild;
                const sticker2 = piece2.children[j < 4 ? this.mx(face, j + 1) : face].firstChild;
                if (sticker1 && sticker2) {
                    // Swap the class names of the stickers
                    const className = sticker1.className;
                    sticker1.className = sticker2.className;
                    sticker2.className = className;
                }
            }
        }
        this.score.checkFaceCompletion(face); // Check if the face is completed
    }

    // Animate the rotation of the cube's face
    animateRotation(face, cw, currentTime) {
        const k = 0.3 * (face % 2 * 2 - 1) * (2 * cw - 1); // Calculate rotation factor
        const qubes = Array(9).fill(this.pieces[face]).map((value, index) =>
            index ? this.getPieceBy(face, index / 2, index % 2) : value
        );
        const rotatePieces = () => {
            const passed = Date.now() - currentTime; // Time passed since rotation started
            const style = `rotate${this.getAxis(face)}(${k * passed * (passed < 300)}deg)`; // Rotation style
            qubes.forEach(piece => {
                piece.style.transform = piece.style.transform.replace(/rotate.\(\S+\)/, style); // Apply rotation
            });
            if (passed >= 300) {
                this.swapPieces(face, 3 - 2 * cw); // Swap pieces after rotation
                return;
            }
            requestAnimationFrame(rotatePieces); // Continue animation
        };
        rotatePieces();
    }

    // Handle mouse down events for rotating the cube
    handleMouseDown(md_e) {
        const startXY = this.pivot.style.transform.match(/-?\d+\.?\d*/g).map(Number); // Get initial rotation
        const element = md_e.target.closest('.element'); // Find closest element
        const face = Array.from((element || this.cube).parentNode.children).indexOf(element); // Get face index
        const mousemove = (mm_e) => {
            if (element) {
                const gid = /\d/.exec(document.elementFromPoint(mm_e.pageX, mm_e.pageY).id);
                if (gid && gid.input.includes('anchor')) {
                    mouseup(); // End mouse interaction
                    const e = element.parentNode.children[this.mx(face, Number(gid) + 3)].hasChildNodes();
                    this.animateRotation(this.mx(face, Number(gid) + 1 + 2 * e), e, Date.now()); // Animate rotation
                }
            } else {
                // Update pivot rotation based on mouse movement
                this.pivot.style.transform =
                    `rotateX(${startXY[0] - (mm_e.pageY - md_e.pageY) / 2}deg)` +
                    `rotateY(${startXY[1] + (mm_e.pageX - md_e.pageX) / 2}deg)`;
            }
        };
        const mouseup = () => {
            document.body.appendChild(this.guide); // Show guide
            this.scene.removeEventListener('mousemove', mousemove); // Remove mousemove listener
            document.removeEventListener('mouseup', mouseup); // Remove mouseup listener
            this.scene.addEventListener('mousedown', (e) => this.handleMouseDown(e)); // Re-add mousedown listener
        };
        (element || document.body).appendChild(this.guide); // Append guide to the DOM
        this.scene.addEventListener('mousemove', mousemove); // Add mousemove listener
        document.addEventListener('mouseup', mouseup); // Add mouseup listener
        this.scene.removeEventListener('mousedown', (e) => this.handleMouseDown(e)); // Remove mousedown listener
    }

    // Get elements of a specific face
    getFaceElements(face) {
        return Array.from(this.pieces).filter(piece =>
            piece.children[face] && piece.children[face].firstChild !== null
        );
    }

    // Handle game over state
    gameOver(isWin) {
        this.isGameOver = true; // Set game over flag
        this.timer.stop(); // Stop the timer
        if (isWin) {
            alert(`Congratulations! You've solved the Rubik's Cube! Your score: ${this.score.score}`);
        } else {
            alert(`Game Over! Your score: ${this.score.score}`);
        }
        // You might want to disable controls or show a "Play Again" button here
    }
}

// Class representing the timer functionality
class Timer {
    constructor() {
        this.timerElement = document.getElementById('clock-counter'); // Timer display element
        this.totalSeconds = 0; // Total elapsed seconds
        this.intervalId = null; // Timer interval ID
    }

    // Start the timer
    start() {
        this.reset(); // Reset timer
        this.intervalId = setInterval(() => this.updateTimer(), 1000); // Update timer every second
    }

    // Stop the timer
    stop() {
        clearInterval(this.intervalId); // Clear interval
    }

    // Resume the timer
    resume() {
        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.updateTimer(), 1000); // Resume updating
        }
    }

    // Reset the timer
    reset() {
        this.stop(); // Stop the timer
        this.totalSeconds = 0; // Reset seconds
        this.updateDisplay(); // Update display
    }

    // Update the timer every second
    updateTimer() {
        this.totalSeconds++; // Increment total seconds
        this.updateDisplay(); // Update the display
    }

    // Update the timer display
    updateDisplay() {
        const hours = Math.floor(this.totalSeconds / 3600);
        const minutes = Math.floor((this.totalSeconds % 3600) / 60);
        const seconds = this.totalSeconds % 60;
        const formatTime = (time) => String(time).padStart(2, '0'); // Format time to two digits
        this.timerElement.innerText = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`; // Set display text
    }

    // Get total elapsed seconds
    getTotalSeconds() {
        return this.totalSeconds; // Return total seconds
    }
}

// Class representing the score functionality
class Score {
    constructor(rubiksCube) {
        this.scoreElement = document.getElementById('score-counter'); // Score display element
        this.score = 0; // Initialize score
        this.rubiksCube = rubiksCube; // Reference to the Rubik's Cube instance
        this.facesCompleted = new Set(); // Set to track completed faces
    }

    // Check if a face is completed
    checkFaceCompletion(face) {
        const faceElements = this.rubiksCube.getFaceElements(face);
        const firstColor = faceElements[0].firstChild.className.split(' ')[1]; // Get the color of the first sticker
        const isComplete = faceElements.every(element =>
            element.firstChild.className.split(' ')[1] === firstColor // Check if all stickers match the first color
        );
        if (isComplete && !this.facesCompleted.has(face)) {
            this.facesCompleted.add(face); // Mark face as completed
            this.addPoints(3); // Add points for completing the face
            this.checkGameCompletion(); // Check if the game is completed
        }
    }

    // Add points to the score
    addPoints(points) {
        this.score += points; // Increment score
        this.updateDisplay(); // Update score display
    }

    // Add points based on elapsed time
    addTimeBasedPoints(elapsedSeconds) {
        const pointsToAdd = Math.floor(elapsedSeconds / 10); // Calculate points based on time
        this.addPoints(pointsToAdd); // Add points
    }

    // Check if the game is completed (all faces solved)
    checkGameCompletion() {
        if (this.facesCompleted.size === 6) {
            this.rubiksCube.gameOver(true); // End game with a win
        }
    }

    // Update the score display
    updateDisplay() {
        this.scoreElement.innerText = this.score; // Set score display text
    }

    // Reset the score and completed faces
    reset() {
        this.score = 0; // Reset score
        this.facesCompleted.clear(); // Clear completed faces
        this.updateDisplay(); // Update display
    }
}

// Initialize the game when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new RubiksCube(); // Create a new instance of the RubiksCube
});