
/* =========================================
   CONFIGURACIÓN Y AUTENTICACIÓN
========================================= */

const API_URL = "http://localhost:8081";

function obtenerHeadersAutenticados(headersAdicionales = {}) {
    const headers = new Headers(headersAdicionales);
    const token = sessionStorage.getItem("autenticacion");

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
}


async function fetchAutenticado(url, opciones = {}) {
    const headers = obtenerHeadersAutenticados(opciones.headers || {});
    const token = sessionStorage.getItem("autenticacion");

    if (
        opciones.body &&
        !(opciones.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    console.log("URL solicitada:", url);
    console.log("Método:", opciones.method || "GET");
    console.log("Token disponible:", Boolean(token));
    console.log("Authorization enviado:", headers.has("Authorization"));

    const respuesta = await fetch(url, {
        ...opciones,
        headers
    });

    console.log("Estado de respuesta:", respuesta.status);

    if (respuesta.status === 401 || respuesta.status === 403) {
        const detalle = await respuesta.clone().text();
        console.error("Acceso rechazado:", respuesta.status, detalle);
    }

    return respuesta;
}



/* =========================================
   PERSONAL - LISTAR TRABAJADORES
========================================= */

async function cargarTrabajadores() {
    const lista = document.querySelector("#listaTrabajadores");

    if (!lista) return;

    try {
        const respuesta = await fetchAutenticado(`${API_URL}/api/personal`);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const trabajadores = await respuesta.json();

        if (!Array.isArray(trabajadores)) {
            throw new Error("La API no devolvió una lista de trabajadores.");
        }

        lista.innerHTML = "";

        if (trabajadores.length === 0) {
            lista.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No hay trabajadores registrados.
                    </td>
                </tr>
            `;

            actualizarCantidadListado(0);
            await actualizarConteoTrabajadores();
            return;
        }

        trabajadores.forEach(function (trabajador) {
            const fila = document.createElement("tr");

            // Las siete columnas de la tabla
            const valores = [
                trabajador.id,
                trabajador.nombres,
                trabajador.documentoIdentidad,
                trabajador.cargo,
                trabajador.area,
                trabajador.estado
            ];

            valores.forEach(function (valor) {
                const celda = document.createElement("td");
                celda.textContent = valor ?? "—";
                fila.appendChild(celda);
            });

            // Columna de acciones
            const acciones = document.createElement("td");

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "accion-editar";
            botonEditar.textContent = "Editar";
            botonEditar.addEventListener("click", function () {
                editarTrabajador(trabajador);
            });


            const botonEstado = document.createElement("button");
            botonEstado.type = "button";
            botonEstado.className = "accion-estado";

            const estadoActual = String(trabajador.estado || "").toUpperCase();
            const estaActivo = estadoActual === "ACTIVO";

            botonEstado.textContent = estaActivo ? "Dar de baja" : "Reactivar";

            botonEstado.addEventListener("click", function () {
                cambiarEstadoTrabajador(
                    trabajador.id,
                    estaActivo ? "CESADO" : "ACTIVO"
                );
            });

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "accion-eliminar";
            botonEliminar.textContent = "Eliminar";
            botonEliminar.addEventListener("click", function () {
                eliminarTrabajador(trabajador);
            });

            acciones.append(botonEditar, botonEstado, botonEliminar);
            fila.appendChild(acciones);
            lista.appendChild(fila);
        });

        // Aplicar los filtros después de cargar los datos
        filtrarTrabajadores();
        await actualizarConteoTrabajadores();

    } catch (error) {
        console.error("Error al cargar trabajadores:", error);

        lista.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No se pudieron cargar los trabajadores.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   PERSONAL - REGISTRAR TRABAJADOR
========================================= */

const formularioTrabajador = document.querySelector("#formTrabajador");

if (formularioTrabajador) {
    formularioTrabajador.addEventListener("submit", async function (event) {
        event.preventDefault();

        const nombres = document.querySelector("#nombres")?.value.trim();
        const documentoIdentidad =
            document.querySelector("#documentoIdentidad")?.value.trim();
        const cargo = document.querySelector("#cargo")?.value.trim();
        const area = document.querySelector("#areaTrabajador")?.value.trim();

        if (!nombres || !documentoIdentidad) {
            alert("El nombre y el documento de identidad son obligatorios.");
            return;
        }

        const trabajador = {
            nombres,
            documentoIdentidad,
            cargo,
            area,
            estado: "ACTIVO"
        };

        try {
            const respuesta = await fetchAutenticado(
                `${API_URL}/api/personal`,
                {
                    method: "POST",
                    body: JSON.stringify(trabajador)
                }
            );

            if (!respuesta.ok) {
                const mensaje = await respuesta.text();
                throw new Error(mensaje || `Error HTTP ${respuesta.status}`);
            }

            const trabajadorCreado = await respuesta.json();

            alert("Trabajador registrado correctamente.");
            formularioTrabajador.reset();

            await cargarTrabajadores();

            console.log("Trabajador creado:", trabajadorCreado);

        } catch (error) {
            console.error("Error al registrar:", error);
            alert("No se pudo registrar el trabajador: " + error.message);
        }
    });
}


/* =========================================
   PERSONAL - EDITAR TRABAJADOR
========================================= */

async function editarTrabajador(trabajador) {
    const nombres = prompt("Nombres y apellidos:", trabajador.nombres);
    if (nombres === null) return;

    const documentoIdentidad = prompt(
        "Documento de identidad:",
        trabajador.documentoIdentidad || ""
    );
    if (documentoIdentidad === null) return;

    const cargo = prompt("Cargo:", trabajador.cargo || "");
    if (cargo === null) return;

    const area = prompt("Área:", trabajador.area || "");
    if (area === null) return;

    if (!nombres.trim() || !documentoIdentidad.trim()) {
        alert("El nombre y el documento son obligatorios.");
        return;
    }

    try {
        const respuesta = await fetchAutenticado(
            `${API_URL}/api/personal/${trabajador.id}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    nombres: nombres.trim(),
                    documentoIdentidad: documentoIdentidad.trim(),
                    cargo: cargo.trim(),
                    area: area.trim()
                })
            }
        );

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            throw new Error(mensaje || `Error HTTP ${respuesta.status}`);
        }

        alert("Trabajador actualizado correctamente.");
        await cargarTrabajadores();

    } catch (error) {
        console.error("Error al editar:", error);
        alert("No se pudo editar el trabajador: " + error.message);
    }
}


/* =========================================
   PERSONAL - CESAR O REACTIVAR
========================================= */

async function cambiarEstadoTrabajador(id, estado) {
    const accion = estado === "CESADO" ? "dar de baja" : "reactivar";

    if (!confirm(`¿Deseas ${accion} a este trabajador?`)) {
        return;
    }

    try {
        const respuesta = await fetchAutenticado(
            `${API_URL}/api/personal/${id}/estado`,
            {
                method: "PUT",
                body: JSON.stringify({ estado })
            }
        );

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            throw new Error(mensaje || `Error HTTP ${respuesta.status}`);
        }

        alert(
            estado === "CESADO"
                ? "El trabajador ha sido cesado correctamente."
                : "El trabajador ha sido reactivado correctamente."
        );

        await cargarTrabajadores();

    } catch (error) {
        console.error("Error al cambiar el estado:", error);
        alert("No se pudo cambiar el estado: " + error.message);
    }
}


/* =========================================
   PERSONAL - ELIMINAR TRABAJADOR
========================================= */

async function eliminarTrabajador(trabajador) {
    const confirmar = confirm(
        `¿Seguro que deseas eliminar a ${trabajador.nombres}? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
        const respuesta = await fetchAutenticado(
            `${API_URL}/api/personal/${trabajador.id}`,
            { method: "DELETE" }
        );

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            throw new Error(mensaje || `Error HTTP ${respuesta.status}`);
        }

        alert("Trabajador eliminado correctamente.");
        await cargarTrabajadores();

    } catch (error) {
        console.error("Error al eliminar:", error);
        alert(
            "No se pudo eliminar el trabajador. Puede tener registros relacionados. " +
            error.message
        );
    }
}


/* =========================================
   BUSCADOR Y FILTRO POR ÁREA
========================================= */

function inicializarBusquedaTrabajadores() {
    const buscador = document.getElementById("buscarTrabajador");
    const filtroArea = document.getElementById("filtroArea");

    if (buscador) {
        buscador.addEventListener("input", filtrarTrabajadores);
    }

    if (filtroArea) {
        filtroArea.addEventListener("change", filtrarTrabajadores);
    }
}

function filtrarTrabajadores() {
    const lista = document.getElementById("listaTrabajadores");
    const buscador = document.getElementById("buscarTrabajador");
    const filtroArea = document.getElementById("filtroArea");

    if (!lista) return;

    const texto = (buscador?.value || "").trim().toLowerCase();
    const areaSeleccionada =
        (filtroArea?.value || "").trim().toLowerCase();

    const filas = lista.querySelectorAll("tr");
    let cantidad = 0;

    filas.forEach(function (fila) {
        const celdas = fila.querySelectorAll("td");

        // Ignorar filas de mensajes
        if (celdas.length !== 7) {
            return;
        }

        const nombre = celdas[1].textContent.toLowerCase();
        const documento = celdas[2].textContent.toLowerCase();
        const area = celdas[4].textContent.trim().toLowerCase();

        const coincideTexto =
            nombre.includes(texto) || documento.includes(texto);

        const coincideArea =
            !areaSeleccionada || area === areaSeleccionada;

        const mostrar = coincideTexto && coincideArea;

        fila.style.display = mostrar ? "" : "none";

        if (mostrar) cantidad++;
    });

    // Mostrar mensaje cuando no hay coincidencias
    let filaVacia = lista.querySelector(".fila-sin-resultados");

    if (cantidad === 0) {
        if (!filaVacia) {
            filaVacia = document.createElement("tr");
            filaVacia.className = "fila-sin-resultados";

            const celda = document.createElement("td");
            celda.colSpan = 7;
            celda.className = "empty-state";
            celda.textContent = "No se encontraron trabajadores con esos filtros.";

            filaVacia.appendChild(celda);
            lista.appendChild(filaVacia);
        }
    } else if (filaVacia) {
        filaVacia.remove();
    }

    actualizarCantidadListado(cantidad);
}

function actualizarCantidadListado(cantidad) {
    const contador = document.getElementById("cantidadTrabajadoresListado");

    if (contador) {
        contador.textContent =
            `${cantidad} ${cantidad === 1 ? "trabajador encontrado" : "trabajadores encontrados"}`;
    }
}


/* =========================================
   TARJETAS DE RESUMEN
========================================= */

async function actualizarConteoTrabajadores() {
    const elementoTotal = document.getElementById("totalTrabajadores");
    const elementoActivos = document.getElementById("trabajadoresActivos");

    // Algunas páginas podrían no tener estas tarjetas
    if (!elementoTotal && !elementoActivos) return;

    try {
        const respuesta = await fetchAutenticado(`${API_URL}/api/personal`);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const trabajadores = await respuesta.json();

        if (!Array.isArray(trabajadores)) {
            throw new Error("La API no devolvió una lista de trabajadores.");
        }

        if (elementoTotal) {
            elementoTotal.textContent = trabajadores.length;
        }

        const activos = trabajadores.filter(function (trabajador) {
            return String(trabajador.estado || "")
                .trim()
                .toUpperCase() === "ACTIVO";
        }).length;

        if (elementoActivos) {
            elementoActivos.textContent = activos;
        }

    } catch (error) {
        console.error("Error al actualizar las tarjetas:", error);

        if (elementoTotal) elementoTotal.textContent = "—";
        if (elementoActivos) elementoActivos.textContent = "—";
    }
}


/* =========================================
   INICIAR FUNCIONES AL CARGAR LA PÁGINA
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    inicializarBusquedaTrabajadores();
    cargarTrabajadores();
    actualizarConteoTrabajadores();
});



/* ASISTENCIA - CONSULTA Y FILTROS DE RR. HH. */

const filtroTrabajador = document.querySelector(
    "#filtroTrabajadorAsistencia"
);

const filtroTipo = document.querySelector(
    "#filtroTipoAsistencia"
);

const filtroFechaDesde = document.querySelector(
    "#filtroFechaDesde"
);

const filtroFechaHasta = document.querySelector(
    "#filtroFechaHasta"
);

const formularioFiltros = document.querySelector(
    "#formFiltrosAsistencia"
);

const listaAsistencias = document.querySelector(
    "#listaAsistencias"
);

const totalAsistencias = document.querySelector(
    "#totalAsistencias"
);

const totalEntradas = document.querySelector(
    "#totalEntradas"
);

const totalSalidas = document.querySelector(
    "#totalSalidas"
);

const cantidadAsistencias = document.querySelector(
    "#cantidadAsistencias"
);

let todasLasAsistencias = [];


/* CARGAR TODAS LAS ASISTENCIAS */

async function cargarTodasLasAsistencias() {

    if (!listaAsistencias) return;

    listaAsistencias.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                Cargando asistencias...
            </td>
        </tr>
    `;

    try {

        /*
         * IMPORTANTE:
         * Este endpoint debe existir en tu backend.
         * Si tienes otro endpoint para listar todas las
         * asistencias, reemplaza esta URL.
         */
        const respuesta = await fetchAutenticado(
            `${API_URL}/api/asistencia`
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron cargar las asistencias."
            );
        }
        const datos = await respuesta.json();

        const asistencias = Array.isArray(datos)
            ? datos
            : Array.isArray(datos.content)
                ? datos.content
                : [];

        const respuestaPersonal = await fetchAutenticado(
            `${API_URL}/api/personal`
        );

        if (!respuestaPersonal.ok) {
            throw new Error("No se pudo obtener la información del personal.");
        }

        const trabajadores = await respuestaPersonal.json();

        todasLasAsistencias = asistencias.map(asistencia => {
            const trabajador = trabajadores.find(
                t => Number(t.id) === Number(asistencia.trabajadorId)
            );

            return {
                ...asistencia,
                trabajadorNombre: trabajador?.nombres || "No disponible",
                documentoIdentidad:
                    trabajador?.documentoIdentidad || "No disponible"
            };
        });

        aplicarFiltrosAsistencia();

    } catch (error) {

        console.error(error);

        listaAsistencias.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No se pudieron cargar las asistencias.
                    Verifica el endpoint del backend.
                </td>
            </tr>
        `;

        actualizarResumenAsistencia([]);

    }
}


/* APLICAR FILTROS */

function aplicarFiltrosAsistencia() {

    const busqueda = (
        filtroTrabajador?.value || ""
    ).trim().toLowerCase();

    const tipo = filtroTipo?.value || "";
    const fechaDesde = filtroFechaDesde?.value || "";
    const fechaHasta = filtroFechaHasta?.value || "";

    const filtradas = todasLasAsistencias.filter(
        function (asistencia) {

            /*
             * Ajusta estas propiedades si tu DTO utiliza
             * otros nombres para el trabajador.
             */
            const trabajador = asistencia.trabajador || {};

            const nombre = String(
                asistencia.trabajadorNombre ||
                trabajador.nombres ||
                trabajador.nombreCompleto ||
                trabajador.nombre ||
                ""
            ).toLowerCase();

            const documento = String(
                asistencia.documentoIdentidad ||
                trabajador.documentoIdentidad ||
                trabajador.documento ||
                ""
            ).toLowerCase();

            const movimiento = String(
                asistencia.tipo || ""
            ).toUpperCase();

            const fechaHora = asistencia.fechaHora;

            const fecha = fechaHora
                ? String(fechaHora).slice(0, 10)
                : "";

            const coincideTrabajador =
                !busqueda ||
                nombre.includes(busqueda) ||
                documento.includes(busqueda);

            const coincideTipo =
                !tipo || movimiento === tipo;

            const coincideDesde =
                !fechaDesde ||
                (fecha && fecha >= fechaDesde);

            const coincideHasta =
                !fechaHasta ||
                (fecha && fecha <= fechaHasta);

            return (
                coincideTrabajador &&
                coincideTipo &&
                coincideDesde &&
                coincideHasta
            );
        }
    );

    mostrarAsistencias(filtradas);
    actualizarResumenAsistencia(filtradas);
}


/* MOSTRAR RESULTADOS */

function mostrarAsistencias(asistencias) {

    if (!listaAsistencias) return;

    if (asistencias.length === 0) {

        listaAsistencias.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No se encontraron asistencias
                    con los filtros seleccionados.
                </td>
            </tr>
        `;

        return;
    }

    listaAsistencias.innerHTML = asistencias.map(
        function (asistencia) {

            const trabajador = asistencia.trabajador || {};

            const nombre =
                asistencia.trabajadorNombre ||
                trabajador.nombres ||
                trabajador.nombreCompleto ||
                trabajador.nombre ||
                "No disponible";

            const documento =
                asistencia.documentoIdentidad ||
                trabajador.documentoIdentidad ||
                trabajador.documento ||
                "No disponible";

            const fechaHora = asistencia.fechaHora
                ? new Date(asistencia.fechaHora)
                : null;

            const fechaValida =
                fechaHora &&
                !Number.isNaN(fechaHora.getTime());

            const fecha = fechaValida
                ? fechaHora.toLocaleDateString("es-PE")
                : "No disponible";

            const hora = fechaValida
                ? fechaHora.toLocaleTimeString(
                    "es-PE",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )
                : "No disponible";

            const tipo = String(
                asistencia.tipo || "No disponible"
            ).toUpperCase();

            return `
                <tr>
                    <td>${escaparHTML(asistencia.id ?? "")}</td>
                    <td>${escaparHTML(nombre)}</td>
                    <td>${escaparHTML(documento)}</td>
                    <td>${escaparHTML(fecha)}</td>
                    <td>${escaparHTML(hora)}</td>
                    <td>${escaparHTML(tipo)}</td>
                </tr>
            `;

        }
    ).join("");
}


/* ACTUALIZAR CONTADORES */

function actualizarResumenAsistencia(asistencias) {

    if (totalAsistencias) {
        totalAsistencias.textContent = asistencias.length;
    }

    if (totalEntradas) {
        totalEntradas.textContent =
            asistencias.filter(
                a => String(a.tipo).toUpperCase() === "ENTRADA"
            ).length;
    }

    if (totalSalidas) {
        totalSalidas.textContent =
            asistencias.filter(
                a => String(a.tipo).toUpperCase() === "SALIDA"
            ).length;
    }

    if (cantidadAsistencias) {
        cantidadAsistencias.textContent =
            `${asistencias.length} registros`;
    }
}


/* PROTEGER TEXTO MOSTRADO EN LA TABLA */

function escaparHTML(valor) {

    return String(valor).replace(/[&<>"']/g, function (caracter) {

        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caracter];
    });
}


/* =========================================
   EVENTOS DE FILTRADO DE ASISTENCIA
========================================= */

if (formularioFiltros) {

    // Consultar únicamente al pulsar el botón
    formularioFiltros.addEventListener("submit", async function (event) {
        event.preventDefault();

        await cargarTodasLasAsistencias();
    });

    // Limpiar filtros y ocultar los resultados
    formularioFiltros.addEventListener("reset", function () {

        setTimeout(function () {

            todasLasAsistencias = [];

            if (listaAsistencias) {
                listaAsistencias.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            Ingresa los filtros y pulsa
                            "Consultar asistencias".
                        </td>
                    </tr>
                `;
            }

            actualizarResumenAsistencia([]);

        }, 0);
    });

}




/* =========================================
   DOCUMENTOS - REGISTRAR
========================================= */

const formularioDocumento =
    document.querySelector("#formDocumento");

let dniDocumentosBuscado = "";

if (formularioDocumento) {
    formularioDocumento.addEventListener("submit", async function (event) {
        event.preventDefault();

        const mensaje = document.querySelector("#mensajeDocumento");
        const boton = document.querySelector("#btnRegistrarDocumento");

        const dni = document.querySelector(
            "#documentoIdentidadDocumento"
        ).value.trim();

        const tipo = document.querySelector("#tipoDocumento").value;

        const fecha = document.querySelector(
            "#fechaVencimientoDocumento"
        ).value;

        const archivo = document.querySelector(
            "#archivoDocumento"
        ).files[0];

        if (!dni) {
            alert("Ingresa el DNI del trabajador.");
            return;
        }

        if (!tipo) {
            alert("Selecciona el tipo de documento.");
            return;
        }

        if (!archivo) {
            alert("Selecciona el archivo del documento.");
            return;
        }

        const datos = new FormData();
        datos.append("documentoIdentidad", dni);
        datos.append("tipo", tipo);

        // La fecha es opcional.
        if (fecha) {
            datos.append("fechaVencimiento", fecha);
        }

        datos.append("archivoDocumento", archivo);

        try {
            if (boton) {
                boton.disabled = true;
                boton.textContent = "Registrando...";
            }

            if (mensaje) {
                mensaje.textContent = "Registrando documento...";
            }

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/documentos`,
                {
                    method: "POST",
                    body: datos
                }
            );

            if (!respuesta.ok) {
                const detalle = await respuesta.text();
                throw new Error(
                    detalle || "No se pudo registrar el documento."
                );
            }

            await respuesta.json();

            alert("Documento registrado correctamente.");

            formularioDocumento.reset();

            // Mostrar los documentos del DNI registrado.
            const campoDniBusqueda = document.querySelector(
                "#dniBuscarDocumentos"
            );

            if (campoDniBusqueda) {
                campoDniBusqueda.value = dni;
            }

            await buscarDocumentosPorDNI(dni);

            // Actualizar el resumen de documentos próximos a vencer.
            await cargarDocumentosPorVencer();

            if (mensaje) {
                mensaje.textContent =
                    "Documento registrado correctamente.";
            }

        } catch (error) {
            console.error("Error al registrar documento:", error);

            if (mensaje) {
                mensaje.textContent = error.message;
            }

            alert("No se pudo registrar el documento: " + error.message);

        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = "Registrar documento";
            }
        }
    });
}


/* =========================================
   DOCUMENTOS - BUSCAR POR DNI
========================================= */

async function buscarDocumentosPorDNI(dni) {
    const lista = document.querySelector("#listaDocumentos");

    if (!lista) {
        console.error("No se encontró la tabla #listaDocumentos");
        return;
    }

    dni = dni.trim();

    if (!dni) {
        lista.innerHTML = `
            <tr>
                <td colspan="6">Ingresa el DNI del trabajador.</td>
            </tr>`;
        return;
    }

    lista.innerHTML = `
        <tr>
            <td colspan="6">Buscando documentos...</td>
        </tr>`;

    try {
        const url = `${API_URL}/api/documentos/buscar?documentoIdentidad=${encodeURIComponent(dni)}`;

        console.log("Buscando documentos en:", url);

        const respuesta = await fetchAutenticado(url);
        const documentos = await respuesta.json();

        console.log("Documentos recibidos:", documentos);

        if (!respuesta.ok) {
            throw new Error(documentos.message || "Error al buscar documentos");
        }

        if (!Array.isArray(documentos) || documentos.length === 0) {
            lista.innerHTML = `
                <tr>
                    <td colspan="6">
                        No se encontraron documentos para el DNI ${escaparHTML(dni)}.
                    </td>
                </tr>`;
            return;
        }

        lista.innerHTML = documentos.map(doc => `
            <tr>
                <td>${doc.id ?? ""}</td>
                <td>${escaparHTML(doc.tipo ?? "")}</td>
                <td>${doc.trabajadorId ?? doc.trabajador?.id ?? ""}</td>
                <td>${formatearFecha(doc.fechaVencimiento)}</td>
                <td>${obtenerEstadoDocumento(doc.fechaVencimiento)}</td>
                <td>
                    <button
                        type="button"
                        class="btn-ver-documento"
                        onclick="abrirArchivoDocumento(${doc.id})">
                        Ver archivo
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Error al buscar documentos:", error);
        lista.innerHTML = `
            <tr>
                <td colspan="6">No se pudieron cargar los documentos.</td>
            </tr>`;
    }
}
/* =========================================
   DOCUMENTOS - EVENTOS DE BÚSQUEDA
========================================= */

const botonBuscarDocumentos = document.querySelector(
    "#btnBuscarDocumentos"
);

if (botonBuscarDocumentos) {
    botonBuscarDocumentos.addEventListener("click", function () {
        const campoDni = document.querySelector("#dniBuscarDocumentos");
        const dni = campoDni ? campoDni.value.trim() : "";

        console.log("DNI ingresado:", dni);

        buscarDocumentosPorDNI(dni);
    });
}

const botonLimpiarBusquedaDocumentos = document.querySelector(
    "#btnLimpiarBusquedaDocumentos"
);

if (botonLimpiarBusquedaDocumentos) {
    botonLimpiarBusquedaDocumentos.addEventListener("click", function () {
        const campoDni = document.querySelector("#dniBuscarDocumentos");
        const lista = document.querySelector("#listaDocumentos");

        if (campoDni) {
            campoDni.value = "";
        }

        if (lista) {
            lista.innerHTML = `
                <tr>
                    <td colspan="6">
                        Ingresa el DNI para consultar los documentos del trabajador.
                    </td>
                </tr>
            `;
        }
    });
}
/* =========================================
   DOCUMENTOS - ABRIR ARCHIVO
========================================= */


async function abrirArchivoDocumento(id) {
    // Abrir la ventana inmediatamente para evitar bloqueos del navegador.
    const ventana = window.open("about:blank", "_blank");

    try {
        const respuesta = await fetchAutenticado(
            `${API_URL}/api/documentos/${id}/archivo`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo abrir el archivo.");
        }

        const archivo = await respuesta.blob();
        const urlTemporal = URL.createObjectURL(archivo);

        if (ventana) {
            ventana.location.href = urlTemporal;
        } else {
            const enlace = document.createElement("a");
            enlace.href = urlTemporal;
            enlace.download = `documento-${id}`;
            enlace.click();
        }

        setTimeout(() => URL.revokeObjectURL(urlTemporal), 60000);

    } catch (error) {
        if (ventana) {
            ventana.close();
        }

        console.error("Error al abrir el archivo:", error);
        alert(error.message);
    }
}



/* =========================================
   DOCUMENTOS - ESTADO Y FORMATO
========================================= */

function obtenerEstadoDocumento(fechaVencimiento) {
    if (!fechaVencimiento) {
        return "Sin fecha de vencimiento";
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fecha = new Date(`${fechaVencimiento}T00:00:00`);

    if (Number.isNaN(fecha.getTime())) {
        return "Fecha no válida";
    }

    if (fecha < hoy) {
        return "Vencido";
    }

    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 30);

    if (fecha <= limite) {
        return "Próximo a vencer";
    }

    return "Vigente";
}

function formatearFecha(fecha) {
    const valor = new Date(`${fecha}T00:00:00`);

    if (Number.isNaN(valor.getTime())) {
        return "Fecha no válida";
    }

    return valor.toLocaleDateString("es-PE");
}

function escaparHTML(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   DOCUMENTOS - PRÓXIMOS A VENCER
========================================= */

async function cargarDocumentosPorVencer() {
    const lista = document.querySelector(
        "#listaDocumentosPorVencer"
    );

    if (!lista) return;

    try {
        const respuesta = await fetchAutenticado(
            `${API_URL}/api/documentos/proximos-a-vencer?dias=30`
        );

        if (!respuesta.ok) {
            throw new Error("Error al obtener documentos por vencer.");
        }

        const documentos = await respuesta.json();

        lista.innerHTML = "";

        if (!documentos.length) {
            lista.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay documentos próximos a vencer.
                    </td>
                </tr>
            `;
            return;
        }

        documentos.forEach(documento => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${documento.id}</td>
                <td>${escaparHTML(documento.tipo || "")}</td>
                <td>${escaparHTML(String(documento.trabajadorId ?? ""))}</td>
                <td>${formatearFecha(documento.fechaVencimiento)}</td>
                <td>Próximo a vencer</td>
            `;

            lista.appendChild(fila);
        });

    } catch (error) {
        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudieron cargar los documentos por vencer.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   DOCUMENTOS - INICIALIZACIÓN
========================================= */

// Al abrir la página, no listar todos los documentos.
const listaInicialDocumentos = document.querySelector("#listaDocumentos");

if (listaInicialDocumentos) {
    listaInicialDocumentos.innerHTML = `
        <tr>
            <td colspan="6">
                Ingresa el DNI para consultar los documentos del trabajador.
            </td>
        </tr>
    `;
}

// Se mantiene el resumen general de próximos a vencer.

cargarTrabajadores();

