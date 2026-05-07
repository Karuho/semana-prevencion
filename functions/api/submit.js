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

const MAX_SCORE = 50;
const MAX_LIVES = 3;

export async function onRequestPost(context) {
    const request = context.request;
    const origin = request.headers.get("Origin") || "";

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return jsonResponse(
            {
                ok: false,
                error: "Origen no autorizado."
            },
            403
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch (error) {
        return jsonResponse(
            {
                ok: false,
                error: "JSON inválido."
            },
            400
        );
    }

    const cleanPayload = normalizePayload(payload);
    const validationError = validatePayload(cleanPayload);

    if (validationError) {
        return jsonResponse(
            {
                ok: false,
                error: validationError
            },
            400
        );
    }

    const formData = new URLSearchParams();

    formData.append("fvv", "1");
    formData.append("pageHistory", "0");
    formData.append("submit", "Submit");

    formData.append(GOOGLE_FORM.entries.firstName, cleanPayload.firstName);
    formData.append(GOOGLE_FORM.entries.lastName, cleanPayload.lastName);
    formData.append(GOOGLE_FORM.entries.age, cleanPayload.age);
    formData.append(GOOGLE_FORM.entries.company, cleanPayload.company);
    formData.append(GOOGLE_FORM.entries.email, cleanPayload.email);
    formData.append(GOOGLE_FORM.entries.score, cleanPayload.score);
    formData.append(GOOGLE_FORM.entries.lives, cleanPayload.lives);
    formData.append(GOOGLE_FORM.entries.result, cleanPayload.result);
    formData.append(GOOGLE_FORM.entries.successRate, cleanPayload.successRate);
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

function normalizePayload(payload) {
    const scoreNumber = Number.parseInt(payload.score, 10);
    const livesNumber = Number.parseInt(payload.lives, 10);

    const safeScore = clamp(Number.isNaN(scoreNumber) ? 0 : scoreNumber, 0, MAX_SCORE);
    const safeLives = clamp(Number.isNaN(livesNumber) ? 0 : livesNumber, 0, MAX_LIVES);
    const safeSuccessRate = Math.round((safeScore / MAX_SCORE) * 100);

    return {
        firstName: cleanText(payload.firstName, 60),
        lastName: cleanText(payload.lastName, 60),
        age: cleanText(payload.age, 3),
        company: cleanText(payload.company, 100),
        email: cleanText(payload.email, 120),
        score: String(safeScore),
        lives: String(safeLives),
        result: cleanText(payload.result, 30),
        successRate: String(safeSuccessRate)
    };
}

function validatePayload(payload) {
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

    if (!["Aprobado", "No aprobado", "Finalizado", "Pendiente"].includes(payload.result)) {
        return "Resultado inválido.";
    }

    return null;
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

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Cache-Control": "no-store"
        }
    });
}