
/* ==========================================
   MÓDULO DE SOLICITUDES DEL TRABAJADOR
========================================== */

// ELEMENTOS DEL FORMULARIO
const formSolicitud = document.querySelector("#formSolicitud");
const tipoSolicitud = document.querySelector("#tipoSolicitud");
const fechaInicio = document.querySelector("#fechaInicio");
const fechaFin = document.querySelector("#fechaFin");
const motivoSolicitud = document.querySelector("#motivoSolicitud");
const btnEnviarSolicitud = document.querySelector("#btnEnviarSolicitud");

// ELEMENTOS DEL HISTORIAL
const tablaMisSolicitudes = document.querySelector("#tablaMisSolicitudes");
const mensajeSolicitud = document.querySelector("#mensajeSolicitud");
const mensajeHistorialSolicitudes = document.querySelector("#mensajeHistorialSolicitudes");

let enviandoSolicitud = false;


/* ==========================================
   MENSAJES
========================================== */

function mostrarMensajeSolicitud(texto) {
    if (mensajeSolicitud) {
        mensajeSolicitud.textContent = texto;
    }
}

function mostrarMensajeHistorialSolicitudes(texto) {
    if (mensajeHistorialSolicitudes) {
        mensajeHistorialSolicitudes.textContent = texto;
    }
}


/* ==========================================
   COLORES DEL ESTADO DE SOLICITUD
========================================== */

function obtenerEstadoHTML(estado) {

    const estados = {
        PENDIENTE: "estado-pendiente",
        APROBADA: "estado-aprobada",
        RECHAZADA: "estado-rechazada"
    };

    const estadoNormalizado = (estado || "")
        .toUpperCase()
        .trim();

    const clase = estados[estadoNormalizado] || "";

    return `
        <span class="estado-solicitud ${clase}">
            ${estadoNormalizado || "SIN ESTADO"}
        </span>
    `;
}



/* ==========================================
   FORMATEAR FECHAS
========================================== */

function formatearFechaSolicitud(fecha) {

    if (!fecha) return "No disponible";

    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/* ==========================================
   REGISTRAR SOLICITUD
========================================== */

async function registrarSolicitud(evento) {

    evento.preventDefault();

    if (enviandoSolicitud) return;

    const tipo = tipoSolicitud.value;
    const inicio = fechaInicio.value;
    const fin = fechaFin.value;
    const motivo = motivoSolicitud.value.trim();

    // VALIDAR CAMPOS
    if (!tipo || !inicio || !fin || !motivo) {
        mostrarMensajeSolicitud(
            "Completa todos los campos obligatorios."
        );
        return;
    }

    // VALIDAR FECHAS
    if (fin < inicio) {
        mostrarMensajeSolicitud(
            "La fecha de fin no puede ser anterior a la fecha de inicio."
        );
        return;
    }

    const datos = {
        tipo: tipo,
        fechaInicio: inicio,
        fechaFin: fin,
        motivo: motivo
    };

    enviandoSolicitud = true;
    btnEnviarSolicitud.disabled = true;

    mostrarMensajeSolicitud("Enviando solicitud...");

    try {

        const respuesta = await fetchAutenticado(
            `${API_URL}/api/solicitudes`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            }
        );

        const contenido = await respuesta.text();

        let resultado = {};

        if (contenido.trim()) {
            try {
                resultado = JSON.parse(contenido);
            } catch {
                throw new Error(
                    "El servidor devolvió una respuesta inválida."
                );
            }
        }

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje ||
                `No se pudo registrar la solicitud (HTTP ${respuesta.status}).`
            );
        }

        mostrarMensajeSolicitud(
            "Tu solicitud fue registrada correctamente."
        );

        formSolicitud.reset();

        await cargarMisSolicitudes();

    } catch (error) {

        console.error(
            "Error al registrar solicitud:",
            error
        );

        mostrarMensajeSolicitud(
            error.message ||
            "Ocurrió un error al registrar la solicitud."
        );

    } finally {

        enviandoSolicitud = false;
        btnEnviarSolicitud.disabled = false;
    }
}


/* ==========================================
   CONSULTAR MIS SOLICITUDES
========================================== */

async function cargarMisSolicitudes() {

    if (!tablaMisSolicitudes) return;

    tablaMisSolicitudes.innerHTML = `
        <tr>
            <td colspan="5">Cargando solicitudes...</td>
        </tr>
    `;

    mostrarMensajeHistorialSolicitudes("");

    try {

        const respuesta = await fetchAutenticado(
            `${API_URL}/api/solicitudes/mis-solicitudes`,
            {
                method: "GET"
            }
        );

        const contenido = await respuesta.text();

        if (!respuesta.ok) {

            let resultado = {};

            try {
                resultado = contenido ? JSON.parse(contenido) : {};
            } catch {
                resultado = {};
            }

            throw new Error(
                resultado.mensaje ||
                `No se pudo cargar el historial (HTTP ${respuesta.status}).`
            );
        }

        const solicitudes = contenido
            ? JSON.parse(contenido)
            : [];

        if (!Array.isArray(solicitudes)) {
            throw new Error(
                "El servidor devolvió un historial incorrecto."
            );
        }

        tablaMisSolicitudes.innerHTML = "";

        if (solicitudes.length === 0) {

            tablaMisSolicitudes.innerHTML = `
                <tr>
                    <td colspan="5">
                        Todavía no tienes solicitudes registradas.
                    </td>
                </tr>
            `;

            return;
        }

        solicitudes.forEach(solicitud => {

            const fila = document.createElement("tr");

            const tipo = document.createElement("td");
            const inicio = document.createElement("td");
            const fin = document.createElement("td");
            const motivo = document.createElement("td");
            const estado = document.createElement("td");

            tipo.textContent =
                solicitud.tipo === "VACACIONES"
                    ? "Vacaciones"
                    : solicitud.tipo === "PERMISO"
                        ? "Permiso"
                        : solicitud.tipo || "No especificado";

            inicio.textContent =
                formatearFechaSolicitud(solicitud.fechaInicio);

            fin.textContent =
                formatearFechaSolicitud(solicitud.fechaFin);

            motivo.textContent =
                solicitud.motivo || "Sin motivo";

            estado.textContent =
                solicitud.estado || "PENDIENTE";

            fila.appendChild(tipo);
            fila.appendChild(inicio);
            fila.appendChild(fin);
            fila.appendChild(motivo);
            fila.appendChild(estado);

            tablaMisSolicitudes.appendChild(fila);
        });

    } catch (error) {

        console.error(
            "Error al consultar solicitudes:",
            error
        );

        tablaMisSolicitudes.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudo cargar el historial.
                </td>
            </tr>
        `;

        mostrarMensajeHistorialSolicitudes(
            error.message ||
            "Ocurrió un error al consultar tus solicitudes."
        );
    }
}


/* ==========================================
   EVENTOS
========================================== */

formSolicitud?.addEventListener(
    "submit",
    registrarSolicitud
);


/* ==========================================
   INICIALIZACIÓN
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    // EVITAR FECHAS ANTERIORES A HOY
    const hoy = new Date();
    const fechaLocal = new Date(
        hoy.getTime() - hoy.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    fechaInicio.min = fechaLocal;
    fechaFin.min = fechaLocal;

    fechaInicio.addEventListener("change", function () {
        fechaFin.min = fechaInicio.value || fechaLocal;

        if (fechaFin.value && fechaFin.value < fechaInicio.value) {
            fechaFin.value = "";
        }
    });

    cargarMisSolicitudes();

});
