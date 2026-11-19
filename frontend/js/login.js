
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

        localStorage.setItem("auth_token", datos.token);
        localStorage.setItem("auth_email", datos.email);
        localStorage.setItem("auth_role", datos.rol);

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

// Facilitar llenado al hacer clic en las credenciales de prueba
document.querySelectorAll(".demo-credentials li").forEach(li => {
    li.style.cursor = "pointer";
    li.title = "Haz clic para autocompletar";
    li.addEventListener("click", () => {
        const codes = li.querySelectorAll("code");
        if (codes.length >= 2) {
            document.getElementById("usuario").value = codes[0].textContent.trim();
            document.getElementById("contrasena").value = codes[1].textContent.trim();
        }
    });
});

