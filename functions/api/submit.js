export async function onRequest() {
    return new Response(
        JSON.stringify({
            ok: false,
            error: "Endpoint descontinuado. Usa el flujo protegido del juego."
        }),
        {
            status: 410,
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Cache-Control": "no-store"
            }
        }
    );
}