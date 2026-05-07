const STARTING_LIVES = 3;
const POINTS_PER_CORRECT = 10;
const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 4;

const GOOGLE_FORM = {
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
};

const ALLOWED_ORIGINS = [
    "https://semana-prevencion.pages.dev"
];

const QUESTIONS = [
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

const MAX_SCORE = QUESTIONS.length * POINTS_PER_CORRECT;

export async function onRequestPost(context) {
    const { request, env } = context;
    const origin = request.headers.get("Origin") || "";

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return jsonResponse({ ok: false, error: "Origen no autorizado." }, 403);
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ ok: false, error: "JSON inválido." }, 400);
    }

    try {
        if (payload.action === "start") {
            return await handleStart(env);
        }

        if (payload.action === "answer") {
            return await handleAnswer(payload, env);
        }

        if (payload.action === "submit") {
            return await handleSubmit(payload, env);
        }

        return jsonResponse({ ok: false, error: "Acción inválida." }, 400);
    } catch (error) {
        return jsonResponse(
            {
                ok: false,
                error: error.message || "Error interno."
            },
            400
        );
    }
}

export async function onRequestGet() {
    return methodNotAllowed();
}

export async function onRequestPut() {
    return methodNotAllowed();
}

export async function onRequestDelete() {
    return methodNotAllowed();
}

export async function onRequestPatch() {
    return methodNotAllowed();
}

function methodNotAllowed() {
    return jsonResponse(
        {
            ok: false,
            error: "Método no permitido. Esta ruta solo acepta POST."
        },
        405
    );
}

async function handleStart(env) {
    const state = {
        questionIndex: 0,
        score: 0,
        lives: STARTING_LIVES,
        result: "Pendiente",
        completed: false,
        iat: Date.now()
    };

    const token = await signState(state, env);

    return jsonResponse({
        ok: true,
        token,
        state: publicState(state),
        question: publicQuestion(state.questionIndex)
    });
}

async function handleAnswer(payload, env) {
    const state = await verifyToken(payload.token, env);

    if (state.completed) {
        throw new Error("La partida ya finalizó.");
    }

    const selectedIndex = Number.parseInt(payload.selectedIndex, 10);
    const currentQuestion = QUESTIONS[state.questionIndex];

    if (
        Number.isNaN(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= currentQuestion.options.length
    ) {
        throw new Error("Respuesta inválida.");
    }

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const nextState = { ...state };

    if (isCorrect) {
        nextState.score = clamp(nextState.score + POINTS_PER_CORRECT, 0, MAX_SCORE);
    } else {
        nextState.lives = clamp(nextState.lives - 1, 0, STARTING_LIVES);
    }

    let nextQuestion = null;

    if (nextState.lives <= 0) {
        nextState.completed = true;
        nextState.result = "No aprobado";
    } else if (nextState.questionIndex >= QUESTIONS.length - 1) {
        nextState.completed = true;
        nextState.result = "Aprobado";
    } else {
        nextState.questionIndex += 1;
        nextQuestion = publicQuestion(nextState.questionIndex);
    }

    const token = await signState(nextState, env);

    return jsonResponse({
        ok: true,
        token,
        state: publicState(nextState),
        answer: {
            selectedIndex,
            correctIndex: currentQuestion.correctIndex,
            isCorrect,
            type: isCorrect ? "success" : "error",
            feedbackMessage: isCorrect
                ? currentQuestion.successMessage
                : currentQuestion.errorMessage
        },
        nextQuestion
    });
}

async function handleSubmit(payload, env) {
    const state = await verifyToken(payload.token, env);

    if (!state.completed || state.result !== "Aprobado") {
        throw new Error("La partida no está aprobada o no ha finalizado.");
    }

    const participant = normalizeParticipant(payload.participant || {});
    const validationError = validateParticipant(participant);

    if (validationError) {
        throw new Error(validationError);
    }

    const formData = new URLSearchParams();

    formData.append("fvv", "1");
    formData.append("pageHistory", "0");
    formData.append("submit", "Submit");

    formData.append(GOOGLE_FORM.entries.firstName, participant.firstName);
    formData.append(GOOGLE_FORM.entries.lastName, participant.lastName);
    formData.append(GOOGLE_FORM.entries.age, participant.age);
    formData.append(GOOGLE_FORM.entries.company, participant.company);
    formData.append(GOOGLE_FORM.entries.email, participant.email);
    formData.append(GOOGLE_FORM.entries.score, String(state.score));
    formData.append(GOOGLE_FORM.entries.lives, String(state.lives));
    formData.append(GOOGLE_FORM.entries.result, state.result);
    formData.append(GOOGLE_FORM.entries.successRate, String(calculateSuccessRate(state.score)));
    formData.append(GOOGLE_FORM.entries.submittedAt, getReadableDateTimeChile());

    const googleResponse = await fetch(GOOGLE_FORM.postUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: formData.toString()
    });

    if (googleResponse.status >= 400) {
        return jsonResponse(
            {
                ok: false,
                error: "Google Forms rechazó el envío.",
                googleStatus: googleResponse.status
            },
            502
        );
    }

    return jsonResponse({
        ok: true,
        message: "Participación registrada."
    });
}

function publicQuestion(index) {
    const question = QUESTIONS[index];

    return {
        index,
        total: QUESTIONS.length,
        question: question.question,
        options: question.options
    };
}

function publicState(state) {
    return {
        score: state.score,
        lives: state.lives,
        result: state.result,
        completed: state.completed,
        progress: {
            current: Math.min(state.questionIndex + 1, QUESTIONS.length),
            total: QUESTIONS.length
        }
    };
}

function normalizeParticipant(payload) {
    return {
        firstName: cleanText(payload.firstName, 60),
        lastName: cleanText(payload.lastName, 60),
        age: cleanText(payload.age, 3),
        company: cleanText(payload.company, 100),
        email: cleanText(payload.email, 120)
    };
}

function validateParticipant(payload) {
    if (!payload.firstName) return "Falta nombre.";
    if (!payload.lastName) return "Falta apellido.";
    if (!payload.age) return "Falta edad.";
    if (!payload.company) return "Falta empresa.";
    if (!payload.email) return "Falta correo.";

    const ageNumber = Number.parseInt(payload.age, 10);

    if (Number.isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
        return "Edad inválida.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        return "Correo inválido.";
    }

    return null;
}

function calculateSuccessRate(score) {
    return Math.round((score / MAX_SCORE) * 100);
}

function cleanText(value, maxLength) {
    return String(value || "")
        .trim()
        .replace(/[<>]/g, "")
        .slice(0, maxLength);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getReadableDateTimeChile() {
    const now = new Date();

    const parts = new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).formatToParts(now);

    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${map.day}-${map.month}-${map.year} ${map.hour}:${map.minute}:${map.second}`;
}

async function signState(state, env) {
    const payload = base64UrlEncodeString(JSON.stringify(state));
    const signature = await hmacSign(payload, env);

    return `${payload}.${signature}`;
}

async function verifyToken(token, env) {
    if (!token || typeof token !== "string" || !token.includes(".")) {
        throw new Error("Token inválido.");
    }

    const [payload, signature] = token.split(".");
    const expectedSignature = await hmacSign(payload, env);

    if (!safeEqual(signature, expectedSignature)) {
        throw new Error("Token alterado o inválido.");
    }

    const state = JSON.parse(base64UrlDecodeString(payload));

    if (!state.iat || Date.now() - state.iat > TOKEN_MAX_AGE_MS) {
        throw new Error("La partida expiró.");
    }

    return state;
}

async function hmacSign(value, env) {
    const secret = env.GAME_SECRET || "dev-secret-change-this-value";

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        {
            name: "HMAC",
            hash: "SHA-256"
        },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(value)
    );

    return base64UrlEncodeBytes(new Uint8Array(signature));
}

function safeEqual(a, b) {
    if (a.length !== b.length) return false;

    let result = 0;

    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

function base64UrlEncodeString(value) {
    return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes) {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function base64UrlDecodeString(value) {
    let base64 = value
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    while (base64.length % 4) {
        base64 += "=";
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder().decode(bytes);
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Cache-Control": "no-store"
        }
    });
}