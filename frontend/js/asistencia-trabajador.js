
/* MÓDULO DE MARCACIÓN DEL TRABAJADOR */

const documentoInput = document.querySelector("#documentoTrabajador");
const video = document.querySelector("#videoCamara");
const canvas = document.querySelector("#canvasFoto");
const imagen = document.querySelector("#fotoCapturada");

const btnActivar = document.querySelector("#btnActivarCamara");
const btnFoto = document.querySelector("#btnTomarFoto");
const btnRepetir = document.querySelector("#btnRepetirFoto");
const btnEntrada = document.querySelector("#btnEntrada");
const btnSalida = document.querySelector("#btnSalida");

const estadoCamara = document.querySelector("#estadoCamara");
const confirmacionFoto = document.querySelector("#confirmacionFoto");
const mensaje = document.querySelector("#mensajeMarcacion");

let flujoCamara = null;
let fotoBlob = null;
let enviando = false;
let urlFotoAnterior = null;

function mostrarMensaje(texto) {
    if (mensaje) {
        mensaje.textContent = texto;
    }
}

function detenerCamara() {
    if (flujoCamara) {
        flujoCamara.getTracks().forEach(track => track.stop());
        flujoCamara = null;
    }

    if (video) {
        video.srcObject = null;
    }
}

function limpiarFotoAnterior() {
    if (urlFotoAnterior) {
        URL.revokeObjectURL(urlFotoAnterior);
        urlFotoAnterior = null;
    }
}

async function activarCamara() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error(
                "La cámara requiere HTTPS o localhost y un navegador compatible."
            );
        }

        detenerCamara();

        flujoCamara = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = flujoCamara;
        video.hidden = false;
        imagen.hidden = true;

        await video.play();

        fotoBlob = null;

        btnFoto.disabled = false;
        btnActivar.disabled = true;
        btnRepetir.hidden = true;
        btnEntrada.disabled = true;
        btnSalida.disabled = true;
        confirmacionFoto.hidden = true;

        estadoCamara.textContent =
            "Colócate frente a la cámara y toma tu fotografía.";

        mostrarMensaje("");

    } catch (error) {
        console.error("Error al activar la cámara:", error);

        detenerCamara();

        mostrarMensaje(
            error.message ||
            "No se pudo activar la cámara. Revisa los permisos del navegador."
        );

        btnActivar.disabled = false;
        btnFoto.disabled = true;
    }
}

function tomarFotografia() {
    if (!flujoCamara || !video.videoWidth) {
        mostrarMensaje("Primero debes activar la cámara.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
        mostrarMensaje("No se pudo preparar la captura de la fotografía.");
        return;
    }

    contexto.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.toBlob(function (blob) {
        if (!blob) {
            mostrarMensaje("No se pudo capturar la fotografía.");
            return;
        }

        if (blob.size > 2 * 1024 * 1024) {
            mostrarMensaje(
                "La foto supera los 2 MB. Intenta con una resolución menor."
            );
            return;
        }

        limpiarFotoAnterior();

        fotoBlob = blob;
        urlFotoAnterior = URL.createObjectURL(blob);
        imagen.src = urlFotoAnterior;
        imagen.hidden = false;
        video.hidden = true;

        detenerCamara();

        btnFoto.disabled = true;
        btnActivar.disabled = false;
        btnRepetir.hidden = false;
        btnEntrada.disabled = false;
        btnSalida.disabled = false;
        confirmacionFoto.hidden = false;

        estadoCamara.textContent =
            "Fotografía capturada. Revisa la imagen antes de confirmar.";

        mostrarMensaje("");

    }, "image/jpeg", 0.75);
}

async function registrarMarcacion(tipo) {
    if (enviando) return;

    const documento = documentoInput?.value.trim();

    if (!documento) {
        mostrarMensaje("Ingresa tu documento de identidad.");
        documentoInput?.focus();
        return;
    }

    if (!fotoBlob) {
        mostrarMensaje("Primero debes tomar una fotografía.");
        return;
    }

    if (!["ENTRADA", "SALIDA"].includes(tipo)) {
        mostrarMensaje("El tipo de marcación no es válido.");
        return;
    }

    const datos = new FormData();

    datos.append("documentoIdentidad", documento);
    datos.append("tipo", tipo);
    datos.append("foto", fotoBlob, "marcacion.jpg");

    enviando = true;
    btnEntrada.disabled = true;
    btnSalida.disabled = true;
    btnRepetir.disabled = true;

    mostrarMensaje("Registrando marcación...");

    try {
        const respuesta = await fetchAutenticado(
            `${API_URL}/api/asistencia/marcar`,
            {
                method: "POST",
                body: datos
                // No establecer Content-Type manualmente.
                // El navegador agrega multipart/form-data y su boundary.
            }
        );

        const contenido = await respuesta.text();

        if (!respuesta.ok) {
            console.error(
                "Error HTTP al registrar marcación:",
                respuesta.status,
                contenido
            );

            if (respuesta.status === 401 || respuesta.status === 403) {
                throw new Error(
                    "Acceso rechazado. Verifica tu sesión, los permisos y la configuración del servidor."
                );
            }

            if (respuesta.status === 415) {
                throw new Error(
                    "El servidor no acepta el formato de la fotografía. El controlador Java debe admitir multipart/form-data."
                );
            }

            throw new Error(
                contenido || `No se pudo registrar la marcación (HTTP ${respuesta.status}).`
            );
        }

        let registro = {};

        if (contenido.trim()) {
            try {
                registro = JSON.parse(contenido);
            } catch {
                throw new Error(
                    "La marcación respondió correctamente, pero el servidor devolvió una respuesta JSON inválida."
                );
            }
        }

        const identificador = registro.id ?? registro.idMarcacion;

        mostrarMensaje(
            `Marcación de ${tipo.toLowerCase()} registrada correctamente.` +
            (identificador != null
                ? ` Registro N.º ${identificador}.`
                : "")
        );

        confirmacionFoto.hidden = true;
        btnFoto.disabled = true;
        btnRepetir.hidden = true;
        btnActivar.disabled = false;
        btnEntrada.disabled = true;
        btnSalida.disabled = true;

        fotoBlob = null;
        imagen.hidden = true;
        imagen.removeAttribute("src");
        limpiarFotoAnterior();

        estadoCamara.textContent =
            "Marcación completada. Puedes continuar cuando corresponda.";

    } catch (error) {
        console.error("Error al registrar marcación:", error);

        mostrarMensaje(
            error.message ||
            "Ocurrió un error al registrar la marcación."
        );

        // Permitir reintentar con la misma fotografía.
        btnEntrada.disabled = false;
        btnSalida.disabled = false;

    } finally {
        enviando = false;
        btnRepetir.disabled = false;
    }
}

btnActivar?.addEventListener("click", activarCamara);
btnFoto?.addEventListener("click", tomarFotografia);

btnRepetir?.addEventListener("click", function () {
    fotoBlob = null;
    confirmacionFoto.hidden = true;
    btnEntrada.disabled = true;
    btnSalida.disabled = true;
    activarCamara();
});

btnEntrada?.addEventListener("click", function () {
    registrarMarcacion("ENTRADA");
});

btnSalida?.addEventListener("click", function () {
    registrarMarcacion("SALIDA");
});

window.addEventListener("pagehide", function () {
    detenerCamara();
    limpiarFotoAnterior();
});
