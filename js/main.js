const CONFIG = {
    images: {
        normal: "assets/electricista-normal.png",
        shock: "assets/electricista-shock.png",
        burned: "assets/electricista-chamuscado.png"
    }
};

const DISPLAY_TOTAL_LIVES = 3;

let gameToken = null;
let currentQuestion = null;
let pendingNextQuestion = null;
let lastAnswerResult = null;

let score = 0;
let lives = DISPLAY_TOTAL_LIVES;
let gameResult = "Pendiente";
let audioContext = null;

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");
const dataScreen = document.getElementById("dataScreen");
const thanksScreen = document.getElementById("thanksScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const nextBtn = document.getElementById("nextBtn");
const goToDataBtn = document.getElementById("goToDataBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const successActions = document.getElementById("successActions");
const failActions = document.getElementById("failActions");

const livesDisplay = document.getElementById("livesDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const progressDisplay = document.getElementById("progressDisplay");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const feedbackBox = document.getElementById("feedbackBox");
const feedbackText = document.getElementById("feedbackText");

const gameCard = document.getElementById("gameCard");
const screenFlash = document.getElementById("screenFlash");
const electricOverlay = document.getElementById("electricOverlay");
const workerImage = document.getElementById("workerImage");
const workerFallback = document.getElementById("workerFallback");
const eventEffect = document.getElementById("eventEffect");

const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const finalScore = document.getElementById("finalScore");
const finalLives = document.getElementById("finalLives");
const celebrationEmoji = document.getElementById("celebrationEmoji");
const finalLivesLine = document.getElementById("finalLivesLine");
const endWorkerImage = document.getElementById("endWorkerImage");

const participantForm = document.getElementById("participantForm");
const dataScore = document.getElementById("dataScore");
const dataResult = document.getElementById("dataResult");

startBtn.addEventListener("click", () => {
    initAudio();
    startGame();
});
restartBtn.addEventListener("click", () => {
    initAudio();
    startGame();
});

playAgainBtn.addEventListener("click", () => {
    initAudio();
    startGame();
});
nextBtn.addEventListener("click", goToNextQuestion);
goToDataBtn.addEventListener("click", showDataScreen);
participantForm.addEventListener("submit", handleParticipantSubmit);

workerImage.addEventListener("error", () => {
    workerImage.style.display = "none";
    workerFallback.style.display = "block";
});

async function startGame() {
    try {
        const data = await apiPost("/api/game", {
            action: "start"
        });

        gameToken = data.token;
        currentQuestion = data.question;
        pendingNextQuestion = null;
        lastAnswerResult = null;

        syncGameState(data.state);

        setWorkerState("normal");
        updateHud();
        hideAllScreens();
        showScreen(gameScreen);
        hideFeedback();
        renderQuestion(data.question);
    } catch (error) {
        console.error("No se pudo iniciar la partida:", error);
        alert("No se pudo iniciar el juego. Intenta nuevamente.");
    }
}

function hideAllScreens() {
    startScreen.classList.remove("active");
    gameScreen.classList.remove("active");
    endScreen.classList.remove("active");
    dataScreen.classList.remove("active");
    thanksScreen.classList.remove("active");
}

function showScreen(screenElement) {
    screenElement.classList.add("active");
}

function updateHud() {
    livesDisplay.innerHTML = buildLivesHtml(lives, DISPLAY_TOTAL_LIVES);
    scoreDisplay.textContent = score;

    if (currentQuestion) {
        progressDisplay.textContent = `${currentQuestion.index + 1} / ${currentQuestion.total}`;
    } else {
        progressDisplay.textContent = `1 / 5`;
    }
}

function buildLivesHtml(currentLives, totalLives) {
    let html = "";
    for (let i = 0; i < totalLives; i++) {
        html += i < currentLives ? "❤️" : "🖤";
    }
    return html;
}

function renderQuestion(questionData) {
    hideFeedback();
    clearEffect();
    setWorkerState("normal");

    currentQuestion = questionData;
    questionText.textContent = currentQuestion.question;
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.textContent = option;
        button.addEventListener("click", () => handleAnswer(index));
        optionsContainer.appendChild(button);
    });

    updateHud();
}

async function handleAnswer(selectedIndex) {
    const optionButtons = document.querySelectorAll(".option-btn");

    optionButtons.forEach((btn) => {
        btn.disabled = true;
    });

    let data;

    try {
        data = await apiPost("/api/game", {
            action: "answer",
            token: gameToken,
            selectedIndex
        });
    } catch (error) {
        console.error("Error validando respuesta:", error);
        alert("No se pudo validar la respuesta. Intenta nuevamente.");
        return;
    }

    gameToken = data.token;
    pendingNextQuestion = data.nextQuestion;
    lastAnswerResult = data;

    syncGameState(data.state);

    const answer = data.answer;

    optionButtons.forEach((btn, index) => {
        if (index === answer.correctIndex) {
            btn.classList.add("correct");
        }

        if (index === answer.selectedIndex && !answer.isCorrect) {
            btn.classList.add("wrong");
        }
    });

    if (answer.isCorrect) {
        setWorkerState("win");
        showEffect("✅");
        playSuccessSound();
        showFeedback(answer.feedbackMessage, "success");
        updateHud();
        return;
    }

    triggerShock();
    showFeedback(answer.feedbackMessage, "error");
    updateHud();

    if (lives <= 0) {
        setTimeout(() => {
            setWorkerState("burned");
        }, 450);

        setTimeout(() => {
            finishGame(false);
        }, 1100);
    }
}

function showFeedback(message, type) {
    feedbackText.textContent = message;
    feedbackBox.classList.remove("hidden", "success", "error");
    feedbackBox.classList.add(type);
    nextBtn.classList.remove("hidden");

    if (lives <= 0) {
        nextBtn.textContent = "Ver resultado";
        nextBtn.classList.add("hidden");
    } else if (lastAnswerResult?.state?.completed) {
        nextBtn.textContent = "Finalizar";
    } else {
        nextBtn.textContent = "Siguiente";
    }
}

function hideFeedback() {
    feedbackBox.classList.add("hidden");
    feedbackBox.classList.remove("success", "error");
}

function showEffect(symbol) {
    eventEffect.textContent = symbol;
    eventEffect.classList.add("show");
}

function clearEffect() {
    eventEffect.textContent = "";
    eventEffect.classList.remove("show");
    electricOverlay.classList.remove("active");
    gameCard.classList.remove("shake");
    screenFlash.classList.remove("active");
    workerImage.classList.remove("hit", "burned", "win");
    workerFallback.classList.remove("hit", "burned", "win");
}

function triggerShock() {
    playElectricSound();
    setWorkerState("shock");
    showEffect("FLASH ⚡");

    electricOverlay.classList.add("active");
    gameCard.classList.add("shake");
    screenFlash.classList.add("active");

    setTimeout(() => {
        electricOverlay.classList.remove("active");
        gameCard.classList.remove("shake");
        screenFlash.classList.remove("active");

        if (lives > 0) {
            setWorkerState("normal");
        }
    }, 650);
}

function setWorkerState(state) {
    workerImage.classList.remove("hit", "burned", "win");
    workerFallback.classList.remove("hit", "burned", "win");

    if (state === "normal") {
        workerImage.src = CONFIG.images.normal;
        workerFallback.textContent = "🧑‍🔧";
        return;
    }

    if (state === "shock") {
        workerImage.src = CONFIG.images.shock;
        workerImage.classList.add("hit");
        workerFallback.textContent = "😵‍💫";
        workerFallback.classList.add("hit");
        return;
    }

    if (state === "burned") {
        workerImage.src = CONFIG.images.burned;
        workerImage.classList.add("burned");
        workerFallback.textContent = "💀";
        workerFallback.classList.add("burned");
        return;
    }

    if (state === "win") {
        workerImage.src = CONFIG.images.normal;
        workerImage.classList.add("win");
        workerFallback.textContent = "🧑‍🔧";
        workerFallback.classList.add("win");
    }
}

function goToNextQuestion() {
    if (lastAnswerResult?.state?.completed) {
        finishGame(lastAnswerResult.state.result === "Aprobado");
        return;
    }

    if (pendingNextQuestion) {
        renderQuestion(pendingNextQuestion);
        pendingNextQuestion = null;
        lastAnswerResult = null;
        return;
    }
}

function finishGame(completedAllQuestions) {
    hideAllScreens();
    showScreen(endScreen);

    finalScore.textContent = score;
    finalLives.textContent = lives;

    successActions.classList.add("hidden");
    failActions.classList.add("hidden");

    if (celebrationEmoji) {
        celebrationEmoji.classList.add("hidden");
    }

    if (endWorkerImage) {
        endWorkerImage.classList.add("hidden");
    }

    if (finalLivesLine) {
        finalLivesLine.classList.remove("danger");
    }

    if (lives <= 0) {
        playFailSound();

        gameResult = "No aprobado";
        endTitle.textContent = "💀 No fuiste preventivo";
        endMessage.textContent = "Perdiste tus 3 vidas. Revisa el procedimiento y vuelve a intentarlo.";

        if (endWorkerImage) {
            endWorkerImage.src = CONFIG.images.burned;
            endWorkerImage.classList.remove("hidden");
        }

        if (finalLivesLine) {
            finalLivesLine.classList.add("danger");
        }

        failActions.classList.remove("hidden");
    } else if (completedAllQuestions) {
        playVictorySound();
        launchConfetti();

        if (celebrationEmoji) {
            celebrationEmoji.classList.remove("hidden");
        }

        gameResult = "Aprobado";
        endTitle.textContent = "🏆 ¡Fuiste preventivo!";
        endMessage.textContent = "Completaste la misión de forma segura. Ahora registra tus datos para finalizar la participación.";

        successActions.classList.remove("hidden");
    } else {
        gameResult = "Finalizado";
        endTitle.textContent = "Fin del juego";
        endMessage.textContent = "Gracias por participar.";

        failActions.classList.remove("hidden");
    }
}

function showDataScreen() {
    dataScore.textContent = score;
    dataResult.textContent = gameResult;

    hideAllScreens();
    showScreen(dataScreen);
}

function handleParticipantSubmit(event) {
    event.preventDefault();

    const participant = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        age: document.getElementById("age").value.trim(),
        company: document.getElementById("company").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    submitToGoogleForm({
        token: gameToken,
        participant
    });
}

function submitToGoogleForm(payload) {
    console.log("Enviando participación protegida:", payload);

    fetch("/api/game", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "submit",
            token: payload.token,
            participant: payload.participant
        })
    })
        .then(async (response) => {
            const data = await response.json().catch(() => null);

            if (!response.ok || !data || !data.ok) {
                throw new Error(data?.error || "No se pudo registrar la participación.");
            }

            console.log("Respuesta del backend:", data);
            showThanksScreen();
        })
        .catch((error) => {
            console.error("Error enviando participación:", error);
            alert("No se pudo enviar la participación. Intenta nuevamente.");
        });
}

function showThanksScreen() {
    hideAllScreens();
    showScreen(thanksScreen);
}

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playTone(frequency, duration, type = "sine", volume = 0.12, delay = 0) {
    if (!audioContext) return;

    const startTime = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
}

function playSuccessSound() {
    initAudio();

    playTone(523.25, 0.12, "sine", 0.12, 0);
    playTone(659.25, 0.12, "sine", 0.12, 0.11);
    playTone(783.99, 0.18, "sine", 0.14, 0.22);
}

function playVictorySound() {
    initAudio();

    playTone(523.25, 0.12, "triangle", 0.12, 0);
    playTone(659.25, 0.12, "triangle", 0.12, 0.10);
    playTone(783.99, 0.12, "triangle", 0.12, 0.20);
    playTone(1046.5, 0.32, "triangle", 0.15, 0.32);
}

function playFailSound() {
    initAudio();

    playTone(392, 0.18, "sawtooth", 0.11, 0);
    playTone(349.23, 0.18, "sawtooth", 0.11, 0.18);
    playTone(311.13, 0.22, "sawtooth", 0.11, 0.36);
    playTone(261.63, 0.45, "sawtooth", 0.13, 0.58);
}

function playElectricSound() {
    initAudio();

    if (!audioContext) return;

    const duration = 0.55;
    const sampleRate = audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    noise.buffer = buffer;

    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 8;

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    noise.start();
    noise.stop(audioContext.currentTime + duration);
}

function launchConfetti() {
    const colors = ["#facc15", "#22c55e", "#38bdf8", "#f97316", "#ec4899", "#a855f7"];

    for (let i = 0; i < 55; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti-piece";
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = `${Math.random() * 0.4}s`;
        piece.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;

        document.body.appendChild(piece);

        setTimeout(() => {
            piece.remove();
        }, 3000);
    }
}

async function apiPost(url, payload) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !data.ok) {
        throw new Error(data?.error || "Error de comunicación con el backend.");
    }

    return data;
}

function syncGameState(state) {
    score = state.score;
    lives = state.lives;
    gameResult = state.result;

    if (dataScore) {
        dataScore.textContent = score;
    }

    if (dataResult) {
        dataResult.textContent = gameResult;
    }
}