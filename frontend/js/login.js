
const API_URL = "http://localhost:8081";

const formulario = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");
const boton = formulario.querySelector("button");

formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const email = document.getElementById("usuario").value.trim();
    const password = document.getElementById("contrasena").value;

    mensaje.textContent = "";
    boton.disabled = true;
    boton.textContent = "Verificando...";

    try {
        const respuesta = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!respuesta.ok) {
            throw new Error(
                respuesta.status === 401
                    ? "Correo o contraseña incorrectos."
                    : `No se pudo iniciar sesión. Error HTTP ${respuesta.status}.`
            );
        }

        const datos = await respuesta.json();

        if (!datos.token) {
            throw new Error("El servidor no devolvió el token de acceso.");
        }

        sessionStorage.setItem("autenticacion", datos.token);
        sessionStorage.setItem("usuario", datos.email);
        sessionStorage.setItem("rol", datos.rol);

        window.location.href = "index.html";

    } catch (error) {
        mensaje.textContent =
            error.message === "Failed to fetch"
                ? "No se pudo conectar con el servidor."
                : error.message;
    } finally {
        boton.disabled = false;
        boton.textContent = "Iniciar sesión";
    }
});

