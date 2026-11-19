
/* ==========================================
   MÓDULO DE PERMISOS Y VACACIONES - RR. HH.
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    cargarSolicitudesRRHH();
});

/* ==========================================
   CONSULTAR TODAS LAS SOLICITUDES
   ========================================== */

async function cargarSolicitudesRRHH() {

    const tabla = document.getElementById("tablaSolicitudes");
    const mensaje = document.getElementById("mensajeSolicitudes");

    if (!tabla) {
        console.error("No se encontró la tabla de solicitudes.");
        return;
    }

    try {

        tabla.innerHTML = `
            <tr>
                <td colspan="8">Cargando solicitudes...</td>
            </tr>
        `;

        const respuesta = await fetchAutenticado(
            `${API_URL}/api/solicitudes`
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error al consultar solicitudes. Código: ${respuesta.status}`
            );
        }

        const solicitudes = await respuesta.json();

        tabla.innerHTML = "";

        if (!Array.isArray(solicitudes) || solicitudes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="8">
                        No hay solicitudes registradas.
                    </td>
                </tr>
            `;

            return;
        }

        solicitudes.forEach(solicitud => {

            const fila = document.createElement("tr");

            const trabajador =
                solicitud.trabajador?.nombres || "Sin nombre";

            const datos = [
                trabajador,
                solicitud.tipo,
                formatearFecha(solicitud.fechaInicio),
                formatearFecha(solicitud.fechaFin),
                solicitud.motivo,
                solicitud.estado,
                solicitud.observacion || "-"
            ];

            datos.forEach((dato, indice) => {

                const celda = document.createElement("td");

                celda.textContent = dato ?? "";

                if (indice === 5) {
                    celda.classList.add("estado-solicitud");
                    celda.classList.add(
                        `estado-${String(solicitud.estado).toLowerCase()}`
                    );
                }

                fila.appendChild(celda);

            });

            // COLUMNA DE ACCIONES

            const celdaAcciones = document.createElement("td");

            if (solicitud.estado === "PENDIENTE") {

                const botonAprobar = document.createElement("button");
                botonAprobar.textContent = "Aprobar";
                botonAprobar.type = "button";
                botonAprobar.classList.add("btn-aprobar");

                botonAprobar.addEventListener("click", () => {
                    aprobarSolicitud(solicitud.id);
                });

                const botonRechazar = document.createElement("button");
                botonRechazar.textContent = "Rechazar";
                botonRechazar.type = "button";
                botonRechazar.classList.add("btn-rechazar");

                botonRechazar.addEventListener("click", () => {
                    rechazarSolicitud(solicitud.id);
                });

                celdaAcciones.appendChild(botonAprobar);
                celdaAcciones.appendChild(botonRechazar);

            } else {

                celdaAcciones.textContent = "Solicitud atendida";

            }

            fila.appendChild(celdaAcciones);
            tabla.appendChild(fila);

        });

        if (mensaje) {
            mensaje.textContent = "";
        }

    } catch (error) {

        console.error("Error al cargar solicitudes:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="8">
                    No se pudieron cargar las solicitudes.
                </td>
            </tr>
        `;

        if (mensaje) {
            mensaje.textContent = error.message;
        }
    }
}

/* ==========================================
   APROBAR SOLICITUD
   ========================================== */

async function aprobarSolicitud(id) {

    const observacion = prompt(
        "Escribe una observación para la aprobación (opcional):"
    );

    if (observacion === null) {
        return;
    }

    const confirmar = confirm(
        "¿Estás seguro de aprobar esta solicitud?"
    );

    if (!confirmar) {
        return;
    }

    await actualizarEstadoSolicitud(
        id,
        "aprobar",
        observacion
    );
}

/* ==========================================
   RECHAZAR SOLICITUD
   ========================================== */

async function rechazarSolicitud(id) {

    const observacion = prompt(
        "Indica el motivo por el cual se rechaza la solicitud:"
    );

    if (observacion === null) {
        return;
    }

    if (!observacion.trim()) {
        alert("Debes indicar el motivo del rechazo.");
        return;
    }

    const confirmar = confirm(
        "¿Estás seguro de rechazar esta solicitud?"
    );

    if (!confirmar) {
        return;
    }

    await actualizarEstadoSolicitud(
        id,
        "rechazar",
        observacion
    );
}

/* ==========================================
   ACTUALIZAR ESTADO EN EL BACKEND
   ========================================== */

async function actualizarEstadoSolicitud(id, accion, observacion) {

    const mensaje = document.getElementById("mensajeSolicitudes");

    try {

        const respuesta = await fetchAutenticado(
            `${API_URL}/api/solicitudes/${id}/${accion}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    observacion: observacion
                })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje || "No se pudo actualizar la solicitud."
            );
        }

        alert(
            accion === "aprobar"
                ? "Solicitud aprobada correctamente."
                : "Solicitud rechazada correctamente."
        );

        await cargarSolicitudesRRHH();

    } catch (error) {

        console.error("Error al actualizar solicitud:", error);

        if (mensaje) {
            mensaje.textContent = error.message;
        } else {
            alert(error.message);
        }
    }
}

/* ==========================================
   FORMATEAR FECHAS
   ========================================== */

function formatearFecha(fecha) {

    if (!fecha) return "";

    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

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