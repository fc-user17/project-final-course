
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

    if (
        opciones.body &&
        !(opciones.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const respuesta = await fetch(url, {
        ...opciones,
        headers
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
        console.error("Acceso rechazado:", respuesta.status, url);
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



/* ASISTENCIA - CONSULTAR */

const formularioConsultaAsistencia =
    document.querySelector("#formConsultaAsistencia");

if (formularioConsultaAsistencia) {

    formularioConsultaAsistencia.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const trabajadorId =
                document.querySelector(
                    "#consultaTrabajadorId"
                ).value;

            const resultado =
                document.querySelector(
                    "#resultadoConsultaAsistencia"
                );

            try {

                const respuesta = await fetchAutenticado(
                    `${API_URL}/api/asistencia/trabajador/${trabajadorId}`
                );

                if (!respuesta.ok) {

                    throw new Error(
                        "Error al consultar la asistencia"
                    );
                }

                const asistencias =
                    await respuesta.json();

                if (asistencias.length === 0) {

                    resultado.innerHTML = `
                        <article>
                            <p>
                                No hay registros de asistencia
                                para este trabajador.
                            </p>
                        </article>
                    `;

                    return;
                }

                let contenido = `
                    <article>

                        <h3>
                            Registros de asistencia
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>Tipo</th>
                                    <th>Fecha y hora</th>
                                </tr>

                            </thead>

                            <tbody>
                `;

                asistencias.forEach(function (asistencia) {

                    contenido += `
                        <tr>
                            <td>${asistencia.id}</td>

                            <td>
                                ${asistencia.tipo}
                            </td>

                            <td>
                                ${new Date(
                                    asistencia.fechaHora
                                ).toLocaleString("es-PE")}
                            </td>
                        </tr>
                    `;

                });

                contenido += `
                            </tbody>

                        </table>

                    </article>
                `;

                resultado.innerHTML = contenido;

            } catch (error) {

                console.error(error);

                resultado.innerHTML = `
                    <article>
                        <p>
                            No se pudo consultar
                            la asistencia.
                        </p>
                    </article>
                `;
            }

        }
    );
}

/* DOCUMENTOS - REGISTRAR */

const formularioDocumento =
    document.querySelector("#formDocumento");

if (formularioDocumento) {

    formularioDocumento.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const mensaje =
                document.querySelector("#mensajeDocumento");

            const boton =
                document.querySelector("#btnRegistrarDocumento");

            const archivo =
                document.querySelector("#archivoDocumento").files[0];

            if (!archivo) {
                alert("Selecciona el archivo del documento.");
                return;
            }

            const datos = new FormData();

            datos.append(
                "documentoIdentidad",
                document.querySelector(
                    "#documentoIdentidadDocumento"
                ).value.trim()
            );

            datos.append(
                "tipo",
                document.querySelector("#tipoDocumento").value
            );

            datos.append(
                "fechaVencimiento",
                document.querySelector(
                    "#fechaVencimientoDocumento"
                ).value
            );

            datos.append("archivoDocumento", archivo);

            try {

                if (boton) {
                    boton.disabled = true;
                    boton.textContent = "Registrando...";
                }

                if (mensaje) {
                    mensaje.textContent =
                        "Registrando documento...";
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

                    console.error("Error de API:", detalle);

                    throw new Error(
                        detalle || "No se pudo registrar el documento."
                    );
                }

                const documentoCreado =
                    await respuesta.json();

                console.log(
                    "Documento creado:",
                    documentoCreado
                );

                alert("Documento y archivo registrados correctamente.");

                formularioDocumento.reset();

                await cargarDocumentos();
                await cargarDocumentosPorVencer();

                if (mensaje) {
                    mensaje.textContent =
                        "Documento registrado correctamente.";
                }

            } catch (error) {

                console.error(error);

                if (mensaje) {
                    mensaje.textContent =
                        "Error: no se pudo registrar el documento.";
                }

                alert(
                    "No se pudo registrar el documento. " +
                    "Revisa la consola para conocer el error."
                );

            } finally {

                if (boton) {
                    boton.disabled = false;
                    boton.textContent = "Registrar documento";
                }
            }
        }
    );
}


/*  DOCUMENTOS - LISTAR */

async function cargarDocumentos() {

    const lista =
        document.querySelector("#listaDocumentos");

    if (!lista) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(
                `${API_URL}/api/documentos`
            );

        if (!respuesta.ok) {

            throw new Error(
                "Error al obtener los documentos"
            );
        }

        const documentos =
            await respuesta.json();

        lista.innerHTML = "";

        if (documentos.length === 0) {

            lista.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay documentos registrados.
                    </td>
                </tr>
            `;

            return;
        }

        documentos.forEach(function (documento) {

            const fila =
                document.createElement("tr");

            const fechaVencimiento =
                new Date(
                    documento.fechaVencimiento +
                    "T00:00:00"
                );

            const fechaActual =
                new Date();

            let estado = "Vigente";

            if (fechaVencimiento < fechaActual) {

                estado = "Vencido";

            } else {

                const diferencia =
                    fechaVencimiento - fechaActual;

                const dias =
                    Math.ceil(
                        diferencia /
                        (1000 * 60 * 60 * 24)
                    );

                if (dias <= 30) {
                    estado = "Próximo a vencer";
                }
            }

            const fechaFormateada =
                fechaVencimiento.toLocaleDateString(
                    "es-PE"
                );

            fila.innerHTML = `
                <td>${documento.id}</td>
                <td>${documento.tipo}</td>
                <td>${documento.trabajadorId}</td>
                <td>${fechaFormateada}</td>
                <td>${estado}</td>
            `;

            lista.appendChild(fila);
        });

    } catch (error) {

        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudieron cargar
                    los documentos.
                </td>
            </tr>
        `;
    }
}
/* OCUMENTOS - PRÓXIMOS A VENCER*/

async function cargarDocumentosPorVencer() {

    const lista =
        document.querySelector("#listaDocumentosPorVencer");

    if (!lista) return;

    try {

        const respuesta = await fetchAutenticado(
            `${API_URL}/api/documentos/proximos-a-vencer?dias=30`
        );

        if (!respuesta.ok) {
            throw new Error(
                "Error al obtener documentos por vencer"
            );
        }

        const documentos = await respuesta.json();

        lista.innerHTML = "";

        if (documentos.length === 0) {

            lista.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay documentos próximos a vencer.
                    </td>
                </tr>
            `;

            return;
        }

        documentos.forEach(function (documento) {

            const fila =
                document.createElement("tr");

            const fecha =
                new Date(
                    documento.fechaVencimiento + "T00:00:00"
                );

            fila.innerHTML = `
                <td>${documento.id}</td>
                <td>${documento.tipo}</td>
                <td>${documento.trabajadorId}</td>
                <td>
                    ${fecha.toLocaleDateString("es-PE")}
                </td>
                <td>Próximo a vencer</td>
            `;

            lista.appendChild(fila);
        });

    } catch (error) {

        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudieron cargar los documentos
                    por vencer.
                </td>
            </tr>
        `;
    }
}

/* =========================================
   COMPRAS - SELECT DE PROVEEDORES
   ========================================= */

const rucCompraSelect =
    document.querySelector("#rucCompra");

function llenarSelectProveedores(proveedores) {

    if (!rucCompraSelect) {
        return;
    }

    rucCompraSelect.innerHTML = `
        <option value="">Selecciona un proveedor...</option>
    `;

    if (proveedores.length === 0) {
        rucCompraSelect.innerHTML = `
            <option value="">No hay proveedores registrados</option>
        `;
        return;
    }

    proveedores.forEach(function (proveedor) {

        const opcion =
            document.createElement("option");

        opcion.value = proveedor.ruc;
        opcion.textContent =
            `${proveedor.razonSocial} (${proveedor.ruc})`;

        rucCompraSelect.appendChild(opcion);
    });
}

async function cargarProveedoresParaCompras() {

    if (!rucCompraSelect) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(`${API_URL}/api/proveedores`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener proveedores");
        }

        const proveedores =
            await respuesta.json();

        llenarSelectProveedores(proveedores);

    } catch (error) {

        console.error(error);

        rucCompraSelect.innerHTML = `
            <option value="">No se pudieron cargar proveedores. Revisa el backend.</option>
        `;
    }
}


/* =========================================
   COMPRAS - REGISTRAR
   ========================================= */

const formularioCompra =
    document.querySelector("#formCompra");

if (formularioCompra) {

    formularioCompra.addEventListener("submit", async function (event) {

        event.preventDefault();

        const compra = {
            ruc: document.querySelector("#rucCompra").value,
            numeroComprobante: document.querySelector("#numeroComprobante").value,
            montoSinIgv: parseFloat(document.querySelector("#montoSinIgv").value),
            fecha: document.querySelector("#fechaCompra").value
        };

        try {

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/compras`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(compra)
                }
            );

            if (!respuesta.ok) {

                const mensaje = await respuesta.text();

                console.error("Error de API:", mensaje);

                throw new Error("No se pudo registrar la compra");
            }

            const compraCreada = await respuesta.json();

            alert("Compra registrada correctamente");

            formularioCompra.reset();

            cargarCompras();

            console.log("Compra creada:", compraCreada);

        } catch (error) {

            console.error(error);

            alert(
                "No se pudo registrar la compra. " +
                "Verifica que el RUC del proveedor exista."
            );
        }
    });
}


/* =========================================
   COMPRAS - LISTAR
   ========================================= */

async function cargarCompras() {

    const lista =
        document.querySelector("#listaCompras");

    if (!lista) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(`${API_URL}/api/compras`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener las compras");
        }

        const compras =
            await respuesta.json();

        lista.innerHTML = "";

        if (compras.length === 0) {

            lista.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay compras registradas.
                    </td>
                </tr>
            `;

            return;
        }

        compras.forEach(function (compra) {

            const fila =
                document.createElement("tr");

            fila.innerHTML = `
                <td>${compra.id}</td>
                <td>${compra.proveedorId}</td>
                <td>${compra.numeroComprobante}</td>
                <td>S/ ${compra.montoSinIgv.toFixed(2)}</td>
                <td>S/ ${compra.igv.toFixed(2)}</td>
                <td>S/ ${compra.montoTotal.toFixed(2)}</td>
                <td>${compra.fecha}</td>
            `;

            lista.appendChild(fila);
        });

    } catch (error) {

        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="7">
                    No se pudieron cargar las compras.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   COMPRAS - RESUMEN DE IGV POR PERIODO
   ========================================= */

const formularioIgvPeriodo =
    document.querySelector("#formIgvPeriodo");

if (formularioIgvPeriodo) {

    formularioIgvPeriodo.addEventListener("submit", async function (event) {

        event.preventDefault();

        const desde = document.querySelector("#desdeIgv").value;
        const hasta = document.querySelector("#hastaIgv").value;

        const resultado =
            document.querySelector("#resultadoIgv");

        try {

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/compras/igv-periodo?desde=${desde}&hasta=${hasta}`
            );

            if (!respuesta.ok) {
                throw new Error("Error al calcular el IGV del periodo");
            }

            const totalIgv = await respuesta.json();

            resultado.innerHTML = `
                <article>
                    <h3>
                        Total de IGV pagado: S/ ${totalIgv.toFixed(2)}
                    </h3>
                </article>
            `;

        } catch (error) {

            console.error(error);

            resultado.innerHTML = `
                <article>
                    <p>No se pudo calcular el IGV del periodo.</p>
                </article>
            `;
        }
    });
}


/* =========================================
   VENTAS - REGISTRAR
   ========================================= */

const formularioVenta =
    document.querySelector("#formVenta");

if (formularioVenta) {

    formularioVenta.addEventListener("submit", async function (event) {

        event.preventDefault();

        const venta = {
            documentoCliente: document.querySelector("#documentoCliente").value,
            numeroComprobante: document.querySelector("#numeroComprobanteVenta").value,
            montoSinIgv: parseFloat(document.querySelector("#montoSinIgvVenta").value),
            fecha: document.querySelector("#fechaVenta").value
        };

        try {

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/ventas`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(venta)
                }
            );

            if (!respuesta.ok) {

                const mensaje = await respuesta.text();

                console.error("Error de API:", mensaje);

                throw new Error("No se pudo registrar la venta");
            }

            const ventaCreada = await respuesta.json();

            alert("Venta registrada correctamente");

            formularioVenta.reset();

            cargarVentas();

            console.log("Venta creada:", ventaCreada);

        } catch (error) {

            console.error(error);

            alert(
                "No se pudo registrar la venta. " +
                "Verifica que el documento del cliente exista."
            );
        }
    });
}


/* =========================================
   VENTAS - LISTAR
   ========================================= */

async function cargarVentas() {

    const lista =
        document.querySelector("#listaVentas");

    if (!lista) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(`${API_URL}/api/ventas`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener las ventas");
        }

        const ventas =
            await respuesta.json();

        lista.innerHTML = "";

        if (ventas.length === 0) {

            lista.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay ventas registradas.
                    </td>
                </tr>
            `;

            return;
        }

        ventas.forEach(function (venta) {

            const fila =
                document.createElement("tr");

            fila.innerHTML = `
                <td>${venta.id}</td>
                <td>${venta.clienteId}</td>
                <td>${venta.numeroComprobante}</td>
                <td>S/ ${venta.montoSinIgv.toFixed(2)}</td>
                <td>S/ ${venta.igv.toFixed(2)}</td>
                <td>S/ ${venta.montoTotal.toFixed(2)}</td>
                <td>${venta.fecha}</td>
            `;

            lista.appendChild(fila);
        });

    } catch (error) {

        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="7">
                    No se pudieron cargar las ventas.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   VENTAS - RESUMEN DE IGV POR PERIODO
   ========================================= */

const formularioIgvPeriodoVenta =
    document.querySelector("#formIgvPeriodoVenta");

if (formularioIgvPeriodoVenta) {

    formularioIgvPeriodoVenta.addEventListener("submit", async function (event) {

        event.preventDefault();

        const desde = document.querySelector("#desdeIgvVenta").value;
        const hasta = document.querySelector("#hastaIgvVenta").value;

        const resultado =
            document.querySelector("#resultadoIgvVenta");

        try {

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/ventas/igv-periodo?desde=${desde}&hasta=${hasta}`
            );

            if (!respuesta.ok) {
                throw new Error("Error al calcular el IGV del periodo");
            }

            const totalIgv = await respuesta.json();

            resultado.innerHTML = `
                <article>
                    <h3>
                        Total de IGV cobrado: S/ ${totalIgv.toFixed(2)}
                    </h3>
                </article>
            `;

        } catch (error) {

            console.error(error);

            resultado.innerHTML = `
                <article>
                    <p>No se pudo calcular el IGV del periodo.</p>
                </article>
            `;
        }
    });
}


/* =========================================
   PROVEEDORES - REGISTRAR
   ========================================= */

const formularioProveedor =
    document.querySelector("#formProveedor");

if (formularioProveedor) {

    formularioProveedor.addEventListener("submit", async function (event) {

        event.preventDefault();

        const proveedor = {
            ruc: document.querySelector("#rucProveedor").value,
            razonSocial: document.querySelector("#razonSocial").value
        };

        try {

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/proveedores`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(proveedor)
                }
            );

            if (!respuesta.ok) {

                const mensaje = await respuesta.text();

                console.error("Error de API:", mensaje);

                throw new Error("No se pudo registrar el proveedor");
            }

            const proveedorCreado = await respuesta.json();

            alert("Proveedor registrado correctamente");

            formularioProveedor.reset();

            cargarProveedores();
            cargarProveedoresParaCompras();

            console.log("Proveedor creado:", proveedorCreado);

        } catch (error) {

            console.error(error);

            alert(
                "No se pudo registrar el proveedor. " +
                "Verifica que el RUC no esté repetido."
            );
        }
    });
}


/* =========================================
   PROVEEDORES - LISTAR
   ========================================= */

async function cargarProveedores() {

    const lista =
        document.querySelector("#listaProveedores");

    if (!lista) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(`${API_URL}/api/proveedores`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener los proveedores");
        }

        const proveedores =
            await respuesta.json();

        lista.innerHTML = "";

        if (proveedores.length === 0) {

            lista.innerHTML = `
                <tr>
                    <td colspan="3">
                        No hay proveedores registrados.
                    </td>
                </tr>
            `;

            return;
        }

        proveedores.forEach(function (proveedor) {

            const fila =
                document.createElement("tr");

            fila.innerHTML = `
                <td>${proveedor.id}</td>
                <td>${proveedor.ruc}</td>
                <td>${proveedor.razonSocial}</td>
            `;

            lista.appendChild(fila);
        });

    } catch (error) {

        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="3">
                    No se pudieron cargar los proveedores.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   PAGOS
   ========================================= */

const formularioPago =
    document.querySelector("#pagoForm");

const trabajadorSelect =
    document.querySelector("#trabajadorSelect");

const tbodyPagos =
    document.querySelector("#tbody");

let pagosActuales = [];

function llenarSelectTrabajadores(trabajadores) {

    trabajadorSelect.innerHTML = `
        <option value="">Selecciona un trabajador...</option>
    `;

    if (trabajadores.length === 0) {
        trabajadorSelect.innerHTML = `
            <option value="">No hay trabajadores registrados</option>
        `;
        return;
    }

    trabajadores.forEach(function (trabajador) {

        const opcion =
            document.createElement("option");

        opcion.value = trabajador.documentoIdentidad;
        opcion.dataset.trabajadorId = trabajador.id;
        opcion.textContent =
            `${trabajador.nombres} (${trabajador.documentoIdentidad})`;

        trabajadorSelect.appendChild(opcion);
    });
}

async function cargarTrabajadoresParaPagos() {

    if (!trabajadorSelect) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(`${API_URL}/api/personal`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener trabajadores");
        }

        const trabajadores =
            await respuesta.json();


        llenarSelectTrabajadores(trabajadores);

    } catch (error) {

        console.error(error);

        const trabajadoresGuardados =
            JSON.parse(localStorage.getItem("trabajadores") || "[]");

        if (trabajadoresGuardados.length > 0) {
            llenarSelectTrabajadores(trabajadoresGuardados);
            return;
        }

        trabajadorSelect.innerHTML = `
            <option value="">No se pudieron cargar trabajadores. Revisa el backend.</option>
        `;
    }
}

async function cargarProveedoresParaPagos() {

    if (!tbodyPagos) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(`${API_URL}/api/proveedores`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener proveedores");
        }

        const proveedores =
            await respuesta.json();

        localStorage.setItem(
            "proveedores",
            JSON.stringify(proveedores)
        );

    } catch (error) {
        console.error(error);
    }
}

async function cargarPagos(url = `${API_URL}/api/pagos`) {

    if (!tbodyPagos) {
        return;
    }

    try {

        const respuesta =
            await fetchAutenticado(url);

        if (!respuesta.ok) {
            throw new Error("Error al obtener pagos");
        }

        const pagos =
            await respuesta.json();

        pagosActuales = pagos;
        mostrarPagos(pagos);
        actualizarResumenPagos();

    } catch (error) {

        console.error(error);

        tbodyPagos.innerHTML = `
            <tr>
                <td colspan="6">
                    No se pudieron cargar los pagos.
                </td>
            </tr>
        `;
    }
}

function obtenerNombreBeneficiario(pago) {

    if (pago.tipoBeneficiario === "PROVEEDOR") {

        const proveedores =
            JSON.parse(localStorage.getItem("proveedores") || "[]");

        const proveedor =
            proveedores.find(p => p.id === pago.proveedorId);

        return proveedor
            ? `${proveedor.razonSocial} (Proveedor)`
            : `Proveedor #${pago.proveedorId}`;
    }

    const trabajadores =
        JSON.parse(localStorage.getItem("trabajadores") || "[]");

    const trabajador =
        trabajadores.find(t => t.id === pago.trabajadorId);

    return trabajador
        ? trabajador.nombres
        : `Trabajador #${pago.trabajadorId}`;
}

function mostrarPagos(pagos) {

    if (!tbodyPagos) {
        return;
    }

    const emptyState =
        document.querySelector("#emptyState");

    tbodyPagos.innerHTML = "";

    if (emptyState) {
        emptyState.style.display =
            pagos.length === 0 ? "block" : "none";
    }

    pagos.forEach(function (pago) {

        const fila =
            document.createElement("tr");

        const botonPagar =
            pago.estado === "PAGADO"
                ? ""
                : `<button type="button" data-pago-id="${pago.id}">Pagar</button>`;

        fila.innerHTML = `
            <td>${obtenerNombreBeneficiario(pago)}</td>
            <td>${pago.concepto}</td>
            <td>S/ ${Number(pago.monto).toFixed(2)}</td>
            <td>${pago.fechaProgramada}</td>
            <td>${pago.estado}</td>
            <td>${botonPagar}</td>
        `;

        tbodyPagos.appendChild(fila);
    });
}

function actualizarResumenPagos() {

    const totalPendiente =
        document.querySelector("#totalPendiente");
    const totalPagado =
        document.querySelector("#totalPagado");
    const countPendiente =
        document.querySelector("#countPendiente");

    if (!totalPendiente || !totalPagado || !countPendiente) {
        return;
    }

    const pendientes =
        pagosActuales.filter(pago => pago.estado === "PENDIENTE");
    const pagados =
        pagosActuales.filter(pago => pago.estado === "PAGADO");

    const montoPendiente =
        pendientes.reduce((total, pago) => total + Number(pago.monto), 0);
    const montoPagado =
        pagados.reduce((total, pago) => total + Number(pago.monto), 0);

    totalPendiente.textContent =
        `S/ ${montoPendiente.toFixed(2)}`;
    totalPagado.textContent =
        `S/ ${montoPagado.toFixed(2)}`;
    countPendiente.textContent =
        pendientes.length;
}

if (formularioPago) {

    formularioPago.addEventListener("submit", async function (event) {

        event.preventDefault();

        const pago = {
            documentoIdentidad: document.querySelector("#trabajadorSelect").value,
            concepto: document.querySelector("#concepto").value,
            monto: parseFloat(document.querySelector("#monto").value),
            fechaProgramada: document.querySelector("#fecha").value
        };

        try {

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/pagos`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(pago)
                }
            );

            if (!respuesta.ok) {
                const mensaje = await respuesta.text();
                throw new Error(mensaje);
            }

            formularioPago.reset();
            cargarPagos();

            const formError =
                document.querySelector("#formError");

            if (formError) {
                formError.textContent = "";
            }

            alert("Pago registrado correctamente");

        } catch (error) {

            console.error(error);

            const formError =
                document.querySelector("#formError");

            if (formError) {
                formError.textContent =
                    "No se pudo registrar el pago.";
            }
        }
    });
}

if (tbodyPagos) {

    tbodyPagos.addEventListener("click", async function (event) {

        const boton =
            event.target.closest("button[data-pago-id]");

        if (!boton) {
            return;
        }

        try {

            const respuesta = await fetchAutenticado(
                `${API_URL}/api/pagos/${boton.dataset.pagoId}/pagar`,
                {
                    method: "PUT"
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudo marcar como pagado");
            }

            cargarPagos();

        } catch (error) {
            console.error(error);
            alert("No se pudo marcar el pago como pagado.");
        }
    });
}

const tabTodos =
    document.querySelector("#tabTodos");
const tabPendientes =
    document.querySelector("#tabPendientes");
const tabTrabajador =
    document.querySelector("#tabTrabajador");
const btnBuscarPorId =
    document.querySelector("#btnBuscarPorId");

if (tabTodos) {
    tabTodos.addEventListener("click", function () {
        document.querySelector("#trabajadorFilterBox").style.display = "none";
        cargarPagos();
    });
}

if (tabPendientes) {
    tabPendientes.addEventListener("click", function () {
        document.querySelector("#trabajadorFilterBox").style.display = "none";
        cargarPagos(`${API_URL}/api/pagos/pendientes`);
    });
}

if (tabTrabajador) {
    tabTrabajador.addEventListener("click", function () {
        document.querySelector("#trabajadorFilterBox").style.display = "block";
    });
}

if (btnBuscarPorId) {
    btnBuscarPorId.addEventListener("click", function () {

        const trabajadorId =
            document.querySelector("#trabajadorIdInput").value;

        if (!trabajadorId) {
            return;
        }

        cargarPagos(`${API_URL}/api/pagos/trabajador/${trabajadorId}`);
    });
}


/* =========================================
   INICIAR APLICACIÓN
   ========================================= */

cargarTrabajadores();
cargarDocumentos();
cargarDocumentosPorVencer();
cargarCompras();
cargarVentas();
cargarProveedores();
cargarProveedoresParaCompras();
cargarTrabajadoresParaPagos();
cargarProveedoresParaPagos();
cargarPagos();


