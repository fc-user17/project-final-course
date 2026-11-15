
/* ==========================================
   MÓDULO DE PERMISOS Y VACACIONES - RR. HH.
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    cargarSolicitudesRRHH();
});

/* CONSULTAR TODAS LAS SOLICITUDES */
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
                <td colspan="6">Cargando solicitudes...</td>
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
                    <td colspan="6">
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
                solicitud.estado
            ];

            datos.forEach((dato, indice) => {

                const celda = document.createElement("td");

                celda.textContent = dato ?? "";

                if (indice === 5) {
                    celda.classList.add("estado-solicitud");
                }

                fila.appendChild(celda);

            });

            tabla.appendChild(fila);

        });

    } catch (error) {

        console.error("Error al cargar solicitudes:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    No se pudieron cargar las solicitudes.
                </td>
            </tr>
        `;

        if (mensaje) {
            mensaje.textContent = error.message;
        }
    }
}

/* FORMATEAR FECHAS */
function formatearFecha(fecha) {

    if (!fecha) return "";

    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
