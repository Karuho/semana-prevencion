const CONFIG = {
    startingLives: 3,
    pointsPerCorrect: 10,

    images: {
        normal: "assets/electricista-normal.png",
        shock: "assets/electricista-shock.png",
        burned: "assets/electricista-chamuscado.png"
    },

    googleForm: {
        postUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeUxD3MqmC66ySogzIMdiFogl-n6G2rqF8XKcJY-kpPYog6UA/formResponse",

        entries: {
            firstName: "entry.1867086155",
            lastName: "entry.1819640284",
            age: "entry.133390239",
            company: "entry.1177464113",
            email: "entry.722734976",
            score: "entry.847699678",
            lives: "entry.1712921415",
            result: "entry.246727910",
            successRate: "entry.1613079791",
            submittedAt: "entry.1189718321"
        }
    }
};

const questions = [
    {
        question: "Antes de intervenir un tablero eléctrico, ¿qué debes hacer primero?",
        options: [
            "Usar guantes solamente",
            "Cortar energía, bloquear y señalizar",
            "Trabajar rápido para terminar antes",
            "Pedir ayuda cuando ya esté abierto"
        ],
        correctIndex: 1,
        successMessage: "Correcto. Aplicaste control de energía y trabajo seguro.",
        errorMessage: "Incorrecto. El electricista sufrió un accidente por no aplicar el procedimiento seguro."
    },
    {
        question: "¿Qué elemento es clave antes de trabajar con electricidad?",
        options: [
            "EPP adecuado e inspeccionado",
            "Solo casco",
            "Solo lentes oscuros",
            "Ninguno si el trabajo es breve"
        ],
        correctIndex: 0,
        successMessage: "Bien hecho. El uso de EPP adecuado reduce el riesgo.",
        errorMessage: "Incorrecto. Sin protección adecuada aumentó el riesgo de accidente."
    },
    {
        question: "Si encuentras cables dañados o expuestos, ¿qué corresponde hacer?",
        options: [
            "Cubrirlos con cualquier cinta y seguir",
            "Reportar, aislar el área y corregir antes de continuar",
            "Ignorarlos si no están chispando",
            "Moverlos con la mano rápidamente"
        ],
        correctIndex: 1,
        successMessage: "Correcto. Identificaste la condición insegura y actuaste de forma preventiva.",
        errorMessage: "Incorrecto. La condición insegura generó un accidente."
    },
    {
        question: "¿Qué debes revisar antes de usar una herramienta eléctrica?",
        options: [
            "Solo que encienda",
            "Que esté limpia",
            "Su estado, aislación y condiciones seguras de uso",
            "Nada, si alguien más ya la ocupó"
        ],
        correctIndex: 2,
        successMessage: "Correcto. Inspeccionar herramientas evita incidentes.",
        errorMessage: "Incorrecto. La herramienta defectuosa provocó un accidente."
    },
    {
        question: "Si ocurre una emergencia eléctrica, ¿qué es lo más preventivo?",
        options: [
            "Tocar a la persona de inmediato",
            "Cortar la energía y activar el protocolo de emergencia",
            "Grabar lo sucedido",
            "Esperar a ver si se recupera sola"
        ],
        correctIndex: 1,
        successMessage: "Muy bien. Priorizaste una respuesta segura y ordenada.",
        errorMessage: "Incorrecto. Una mala reacción empeoró la emergencia."
    }
];

let currentQuestionIndex = 0;
let score = 0;
let lives = CONFIG.startingLives;
let gameResult = "Pendiente";

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
const finalLivesLine = document.getElementById("finalLivesLine");
const endWorkerImage = document.getElementById("endWorkerImage");

const participantForm = document.getElementById("participantForm");
const dataScore = document.getElementById("dataScore");
const dataResult = document.getElementById("dataResult");

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
nextBtn.addEventListener("click", goToNextQuestion);
goToDataBtn.addEventListener("click", showDataScreen);
participantForm.addEventListener("submit", handleParticipantSubmit);

workerImage.addEventListener("error", () => {
    workerImage.style.display = "none";
    workerFallback.style.display = "block";
});

function startGame() {
    currentQuestionIndex = 0;
    score = 0;
    lives = CONFIG.startingLives;
    gameResult = "Pendiente";

    setWorkerState("normal");
    updateHud();
    hideAllScreens();
    showScreen(gameScreen);
    hideFeedback();
    renderQuestion();
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
    livesDisplay.innerHTML = buildLivesHtml(lives, CONFIG.startingLives);
    scoreDisplay.textContent = score;
    progressDisplay.textContent = `${Math.min(currentQuestionIndex + 1, questions.length)} / ${questions.length}`;
}

function buildLivesHtml(currentLives, totalLives) {
    let html = "";
    for (let i = 0; i < totalLives; i++) {
        html += i < currentLives ? "❤️" : "🖤";
    }
    return html;
}

function renderQuestion() {
    hideFeedback();
    clearEffect();
    setWorkerState("normal");

    const currentQuestion = questions[currentQuestionIndex];
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

function handleAnswer(selectedIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const optionButtons = document.querySelectorAll(".option-btn");
    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    optionButtons.forEach((btn, index) => {
        btn.disabled = true;

        if (index === currentQuestion.correctIndex) {
            btn.classList.add("correct");
        }

        if (index === selectedIndex && !isCorrect) {
            btn.classList.add("wrong");
        }
    });

    if (isCorrect) {
        score += CONFIG.pointsPerCorrect;
        setWorkerState("win");
        showEffect("✅");
        showFeedback(currentQuestion.successMessage, "success");
        updateHud();
        return;
    }

    lives -= 1;
    triggerShock();
    showFeedback(currentQuestion.errorMessage, "error");
    updateHud();

    if (lives <= 0) {
        setTimeout(() => {
            setWorkerState("burned");
        }, 450);

        setTimeout(() => {
            finishGame(false);
        }, 1100);

        return;
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
    } else if (currentQuestionIndex >= questions.length - 1) {
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
    if (lives <= 0) {
        finishGame(false);
        return;
    }

    if (currentQuestionIndex >= questions.length - 1) {
        finishGame(true);
        return;
    }

    currentQuestionIndex += 1;
    renderQuestion();
}

function finishGame(completedAllQuestions) {
    hideAllScreens();
    showScreen(endScreen);

    finalScore.textContent = score;
    finalLives.textContent = lives;

    successActions.classList.add("hidden");
    failActions.classList.add("hidden");

    if (endWorkerImage) {
        endWorkerImage.classList.add("hidden");
    }

    if (finalLivesLine) {
        finalLivesLine.classList.remove("danger");
    }

    if (lives <= 0) {
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

    const payload = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        age: document.getElementById("age").value.trim(),
        company: document.getElementById("company").value.trim(),
        email: document.getElementById("email").value.trim(),
        score: String(score),
        lives: String(lives),
        result: gameResult,
        successRate: calculateSuccessRate(),
        submittedAt: new Date().toISOString()
    };

    submitToGoogleForm(payload);
}

function calculateSuccessRate() {
    const maxScore = questions.length * CONFIG.pointsPerCorrect;
    if (maxScore <= 0) return "0";
    return Math.round((score / maxScore) * 100).toString();
}

function submitToGoogleForm(payload) {
    const formConfig = CONFIG.googleForm;

    const isConfigured =
        formConfig.postUrl &&
        !formConfig.postUrl.includes("REEMPLAZA_ESTO") &&
        Object.values(formConfig.entries).every((entry) => !entry.includes("REEMPLAZA"));

    if (!isConfigured) {
        console.log("Google Form aún no configurado. Payload listo:", payload);
        showThanksScreen();
        return;
    }

    const formData = new URLSearchParams();

    formData.append(formConfig.entries.firstName, payload.firstName);
    formData.append(formConfig.entries.lastName, payload.lastName);
    formData.append(formConfig.entries.age, payload.age);
    formData.append(formConfig.entries.company, payload.company);
    formData.append(formConfig.entries.email, payload.email);
    formData.append(formConfig.entries.score, payload.score);
    formData.append(formConfig.entries.lives, payload.lives);
    formData.append(formConfig.entries.result, payload.result);
    formData.append(formConfig.entries.successRate, payload.successRate);
    formData.append(formConfig.entries.submittedAt, payload.submittedAt);

    console.log("Enviando a Google Forms:", Object.fromEntries(formData));

    fetch(formConfig.postUrl, {
        method: "POST",
        mode: "no-cors",
        body: formData
    })
        .then(() => {
            console.log("Solicitud enviada a Google Forms.");
            showThanksScreen();
        })
        .catch((error) => {
            console.error("Error enviando a Google Forms:", error);
            alert("No se pudo enviar la participación. Intenta nuevamente.");
        });
}

function appendHiddenInput(form, name, value) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
}

function showThanksScreen() {
    hideAllScreens();
    showScreen(thanksScreen);
}