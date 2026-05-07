const CONFIG = {
  startingLives: 3,
  pointsPerCorrect: 10,
  formUrl: "https://forms.gle/REEMPLAZA_ESTO"
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

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const nextBtn = document.getElementById("nextBtn");
const formBtn = document.getElementById("formBtn");

const livesDisplay = document.getElementById("livesDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const progressDisplay = document.getElementById("progressDisplay");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const feedbackBox = document.getElementById("feedbackBox");
const feedbackText = document.getElementById("feedbackText");

const workerAvatar = document.getElementById("workerAvatar");
const eventEffect = document.getElementById("eventEffect");

const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const finalScore = document.getElementById("finalScore");
const finalLives = document.getElementById("finalLives");

formBtn.href = CONFIG.formUrl;

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
nextBtn.addEventListener("click", goToNextQuestion);

function startGame() {
  currentQuestionIndex = 0;
  score = 0;
  lives = CONFIG.startingLives;

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
    workerAvatar.classList.add("win");
    showEffect("✅");
    showFeedback(currentQuestion.successMessage, "success");
  } else {
    lives -= 1;
    workerAvatar.classList.add("hit");
    showEffect("⚡");
    showFeedback(currentQuestion.errorMessage, "error");
  }

  updateHud();
}

function showFeedback(message, type) {
  feedbackText.textContent = message;
  feedbackBox.classList.remove("hidden", "success", "error");
  feedbackBox.classList.add(type);

  if (lives <= 0) {
    nextBtn.textContent = "Ver resultado";
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
  workerAvatar.classList.remove("hit", "win");
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

  if (lives <= 0) {
    endTitle.textContent = "💀 No fuiste preventivo";
    endMessage.textContent = "Perdiste tus 3 vidas. Revisa el procedimiento y vuelve a intentarlo.";
  } else if (completedAllQuestions) {
    endTitle.textContent = "🏆 ¡Fuiste preventivo!";
    endMessage.textContent = "Completaste la misión de forma segura.";
  } else {
    endTitle.textContent = "Fin del juego";
    endMessage.textContent = "Gracias por participar.";
  }

  if (CONFIG.formUrl.includes("REEMPLAZA_ESTO")) {
    formBtn.style.display = "none";
  } else {
    formBtn.style.display = "inline-flex";
  }
}