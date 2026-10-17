

const API_URL = "http://localhost:8080";


/* PERSONAL - REGISTRAR TRABAJADOR*/

const formularioTrabajador =
    document.querySelector("#formTrabajador");

if (formularioTrabajador) {

    formularioTrabajador.addEventListener("submit", async function (event) {

        event.preventDefault();

        const trabajador = {
            nombres: document.querySelector("#nombres").value,
            documentoIdentidad: document.querySelector("#documentoIdentidad").value,
            cargo: document.querySelector("#cargo").value,
            area: document.querySelector("#areaTrabajador").value,
            estado: "Activo"
        };

        try {

            const respuesta = await fetch(
                `${API_URL}/api/personal`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(trabajador)
                }
            );

            if (!respuesta.ok) {
                throw new Error(
                    "No se pudo registrar el trabajador"
                );
            }

            const trabajadorCreado =
                await respuesta.json();

            alert("Trabajador registrado correctamente");

            formularioTrabajador.reset();

            cargarTrabajadores();

            console.log(
                "Trabajador creado:",
                trabajadorCreado
            );

        } catch (error) {

            console.error(error);

            alert(
                "No se pudo registrar el trabajador."
            );
        }
    });
}


/*PERSONAL - LISTAR TRABAJADORES*/

async function cargarTrabajadores() {

    const lista =
        document.querySelector("#listaTrabajadores");

    if (!lista) {
        return;
    }

    try {

        const respuesta =
            await fetch(`${API_URL}/api/personal`);

        if (!respuesta.ok) {
            throw new Error(
                "Error al obtener los trabajadores"
            );
        }

        const trabajadores =
            await respuesta.json();


        lista.innerHTML = "";

        if (trabajadores.length === 0) {

            lista.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay trabajadores registrados.
                    </td>
                </tr>
            `;

            return;
        }

        trabajadores.forEach(function (trabajador) {

            const fila =
                document.createElement("tr");

            fila.innerHTML = `
                <td>${trabajador.id}</td>
                <td>${trabajador.nombres}</td>
                <td>${trabajador.area}</td>
                <td>${trabajador.cargo}</td>
                <td>${trabajador.estado}</td>
            `;

            lista.appendChild(fila);
        });

    } catch (error) {

        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudieron cargar los trabajadores.
                </td>
            </tr>
        `;
    }
}

/* ASISTENCIA - REGISTRAR Y CONSULTAR */

const formularioAsistencia =
    document.querySelector("#formAsistencia");

if (formularioAsistencia) {

    formularioAsistencia.addEventListener("submit", async function (event) {

        event.preventDefault();

        const documento =
            document.querySelector("#documentoAsistencia").value;

        const tipo =
            document.querySelector("#tipoAsistencia").value;

        const hora =
            document.querySelector("#horaAsistencia").value;

        const resultado =
            document.querySelector("#resultadoAsistencia");

        try {

            const ahora = new Date();

            const fecha =
                ahora.toISOString().split("T")[0];

            const fechaHora =
                `${fecha}T${hora}:00`;

            const respuesta = await fetch(
                `${API_URL}/api/asistencia/marcar`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        documentoIdentidad: documento,
                        tipo: tipo,
                        fechaHora: fechaHora
                    })
                }
            );

            if (!respuesta.ok) {

                const mensaje =
                    await respuesta.text();

                throw new Error(mensaje);
            }

            const asistencia =
                await respuesta.json();

            resultado.innerHTML = `
                <article>
                    <p>
                        Asistencia registrada correctamente.
                    </p>

                    <p>
                        Tipo: ${asistencia.tipo}
                    </p>

                    <p>
                        Hora: ${hora}
                    </p>
                </article>
            `;

            formularioAsistencia.reset();

        } catch (error) {

            console.error(error);

            resultado.innerHTML = `
                <article>
                    <p>
                        No se pudo registrar la asistencia.
                    </p>
                </article>
            `;
        }

    });
}


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

                const respuesta = await fetch(
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

/* DOCUMENTOS - REGISTRAR*/

const formularioDocumento =
    document.querySelector("#formDocumento");

if (formularioDocumento) {

    formularioDocumento.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const documento = {

                documentoIdentidad:
                    document.querySelector(
                        "#documentoIdentidadDocumento"
                    ).value,

                tipo:
                    document.querySelector(
                        "#tipoDocumento"
                    ).value,

                fechaVencimiento:
                    document.querySelector(
                        "#fechaVencimientoDocumento"
                    ).value
            };

            try {

                const respuesta = await fetch(
                    `${API_URL}/api/documentos`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(documento)
                    }
                );

                if (!respuesta.ok) {

                    const mensaje =
                        await respuesta.text();

                    console.error(
                        "Error de API:",
                        mensaje
                    );

                    throw new Error(
                        "No se pudo registrar el documento"
                    );
                }

                const documentoCreado =
                    await respuesta.json();

                console.log(
                    "Documento creado:",
                    documentoCreado
                );

                alert(
                    "Documento registrado correctamente"
                );

                formularioDocumento.reset();

                cargarDocumentos();
                cargarDocumentosPorVencer();

            } catch (error) {

                console.error(error);

                alert(
                    "No se pudo registrar el documento."
                );
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
            await fetch(
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

        const respuesta = await fetch(
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
            await fetch(`${API_URL}/api/proveedores`);

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

            const respuesta = await fetch(
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
            await fetch(`${API_URL}/api/compras`);

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

            const respuesta = await fetch(
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

            const respuesta = await fetch(
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
            await fetch(`${API_URL}/api/ventas`);

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

            const respuesta = await fetch(
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

            const respuesta = await fetch(
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
            await fetch(`${API_URL}/api/proveedores`);

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
            await fetch(`${API_URL}/api/personal`);

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
            await fetch(`${API_URL}/api/proveedores`);

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
            await fetch(url);

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

            const respuesta = await fetch(
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

            const respuesta = await fetch(
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


