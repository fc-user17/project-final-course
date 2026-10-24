const API_ALMACEN_URL = "http://localhost:8080";

const formularioProducto = document.querySelector("#formProducto");
const tituloFormularioProducto = document.querySelector("#tituloFormularioProducto");
const botonGuardarProducto = document.querySelector("#guardarProducto");
const botonCancelarEdicion = document.querySelector("#cancelarEdicion");
const estadoFormularioProducto = document.querySelector("#estadoFormularioProducto");
const listaProductos = document.querySelector("#listaProductos");
const estadoProductos = document.querySelector("#estadoProductos");
const formularioMovimiento = document.querySelector("#formMovimiento");
const productoMovimiento = document.querySelector("#productoMovimiento");
const botonGuardarMovimiento = document.querySelector("#guardarMovimiento");
const estadoFormularioMovimiento = document.querySelector("#estadoFormularioMovimiento");
const listaMovimientos = document.querySelector("#listaMovimientos");
const estadoMovimientos = document.querySelector("#estadoMovimientos");
const listaAlertasStock = document.querySelector("#listaAlertasStock");
const estadoAlertasStock = document.querySelector("#estadoAlertasStock");
const formularioEquipo = document.querySelector("#formEquipo");
const tituloFormularioEquipo = document.querySelector("#tituloFormularioEquipo");
const botonGuardarEquipo = document.querySelector("#guardarEquipo");
const botonCancelarEdicionEquipo = document.querySelector("#cancelarEdicionEquipo");
const estadoFormularioEquipo = document.querySelector("#estadoFormularioEquipo");
const listaEquipos = document.querySelector("#listaEquipos");
const estadoEquipos = document.querySelector("#estadoEquipos");
const seccionHistorialEquipo = document.querySelector("#historialEquipo");
const tituloHistorialEquipo = document.querySelector("#tituloHistorialEquipo");
const estadoHistorialEquipo = document.querySelector("#estadoHistorialEquipo");
const listaHistorialEquipo = document.querySelector("#listaHistorialEquipo");

let productosAlmacen = [];

async function obtenerMensajeError(respuesta, mensajePredeterminado) {
    try {
        const detalle = await respuesta.json();
        return detalle.message || detalle.error || detalle.detail || mensajePredeterminado;
    } catch {
        return mensajePredeterminado;
    }
}

async function solicitarApi(ruta, opciones = {}) {
    const headers = {
        Accept: "application/json",
        ...opciones.headers
    };
    if (opciones.body) {
        headers["Content-Type"] = "application/json";
    }

    const respuesta = await fetch(`${API_ALMACEN_URL}${ruta}`, {
        ...opciones,
        headers
    });

    if (respuesta.status === 401) {
        throw new Error("El backend requiere autenticación para esta operación. El acceso se integrará con el login principal.");
    }
    if (respuesta.status === 403) {
        throw new Error("No tienes permisos para realizar esta operación.");
    }

    if (!respuesta.ok) {
        throw new Error(await obtenerMensajeError(
            respuesta,
            `La solicitud no se pudo completar (HTTP ${respuesta.status}).`
        ));
    }

    return respuesta;
}

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}

function crearEtiqueta(texto, clase) {
    const etiqueta = document.createElement("span");
    etiqueta.className = `almacen-etiqueta-estado ${clase}`;
    etiqueta.textContent = texto;
    return etiqueta;
}

function mostrarMensajeTabla(mensaje) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 8;
    celda.className = "almacen-vacio";
    celda.textContent = mensaje;
    fila.append(celda);
    listaProductos.replaceChildren(fila);
}

function mostrarProductos(productos) {
    productosAlmacen = productos;
    actualizarOpcionesProductosMovimiento();

    if (productos.length === 0) {
        mostrarMensajeTabla("No hay productos registrados.");
        estadoProductos.textContent = "No se encontraron productos en el inventario.";
        return;
    }

    const filas = productos.map((producto) => {
        const fila = document.createElement("tr");
        const stockActual = Number(producto.stockActual);
        const stockMinimo = Number(producto.stockMinimo);
        const tieneStockValido = Number.isFinite(stockActual) && Number.isFinite(stockMinimo);
        const stockBajo = tieneStockValido && stockActual <= stockMinimo;

        fila.append(
            crearCelda(producto.codigo ?? "—"),
            crearCelda(producto.nombre ?? "—"),
            crearCelda(producto.unidadMedida ?? "—"),
            crearCelda(tieneStockValido ? stockActual.toLocaleString("es-PE") : "—"),
            crearCelda(tieneStockValido ? stockMinimo.toLocaleString("es-PE") : "—")
        );

        const estado = document.createElement("td");
        const productoActivo = producto.estado === true;
        estado.append(
            crearEtiqueta(
                productoActivo ? "Activo" : producto.estado === false ? "Inactivo" : "Sin información",
                productoActivo ? "almacen-etiqueta-activo" : "almacen-etiqueta-inactivo"
            )
        );
        fila.append(estado);

        const situacionStock = document.createElement("td");
        situacionStock.append(
            crearEtiqueta(
                tieneStockValido ? stockBajo ? "Stock bajo" : "Disponible" : "Sin información",
                tieneStockValido
                    ? stockBajo
                        ? "almacen-etiqueta-stock-bajo"
                        : "almacen-etiqueta-stock-disponible"
                    : "almacen-etiqueta-inactivo"
            )
        );
        fila.append(situacionStock);

        const acciones = document.createElement("td");
        const botonEditar = document.createElement("button");
        botonEditar.className = "almacen-boton-editar";
        botonEditar.type = "button";
        botonEditar.dataset.productoId = producto.id;
        botonEditar.textContent = "Editar";
        botonEditar.setAttribute("aria-label", `Editar ${producto.nombre ?? "producto"}`);
        acciones.append(botonEditar);
        fila.append(acciones);

        return fila;
    });

    listaProductos.replaceChildren(...filas);
    estadoProductos.textContent = `${productos.length.toLocaleString("es-PE")} producto(s) en el inventario.`;
}

function actualizarOpcionesProductosMovimiento() {
    const seleccionActual = productoMovimiento.value;
    const productosActivos = productosAlmacen.filter((producto) => producto.estado === true);
    const opciones = [new Option("Selecciona un producto...", "")];

    productosActivos.forEach((producto) => {
        opciones.push(new Option(
            `${producto.codigo} - ${producto.nombre} (stock: ${producto.stockActual})`,
            String(producto.id)
        ));
    });

    productoMovimiento.replaceChildren(...opciones);
    if (productosActivos.some((producto) => String(producto.id) === seleccionActual)) {
        productoMovimiento.value = seleccionActual;
    }

    botonGuardarMovimiento.disabled = productosActivos.length === 0;
    if (productosActivos.length === 0) {
        opciones[0].textContent = "No hay productos activos disponibles.";
    }
}

async function cargarProductos() {
    listaProductos.setAttribute("aria-busy", "true");

    try {
        const respuesta = await solicitarApi("/api/productos");
        const productos = await respuesta.json();
        if (!Array.isArray(productos)) {
            throw new Error("La respuesta del backend no tiene el formato esperado.");
        }

        mostrarProductos(productos);
        estadoProductos.classList.remove("almacen-mensaje-error");
        return true;
    } catch (error) {
        console.error("Error al cargar los productos del almacén:", error);
        productosAlmacen = [];
        actualizarOpcionesProductosMovimiento();
        mostrarMensajeTabla(error.message || "Ocurrió un error al cargar los productos.");
        estadoProductos.textContent = error.message || "Ocurrió un error al cargar los productos.";
        estadoProductos.classList.add("almacen-mensaje-error");
        return false;
    } finally {
        listaProductos.setAttribute("aria-busy", "false");
    }
}

function mostrarMensajeMovimientos(mensaje) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 6;
    celda.className = "almacen-vacio";
    celda.textContent = mensaje;
    fila.append(celda);
    listaMovimientos.replaceChildren(fila);
}

function formatearFechaMovimiento(fecha) {
    if (!fecha) {
        return "—";
    }

    const fechaParseada = new Date(fecha);
    return Number.isNaN(fechaParseada.getTime())
        ? fecha
        : fechaParseada.toLocaleString("es-PE");
}

function mostrarMovimientos(movimientos) {
    if (movimientos.length === 0) {
        mostrarMensajeMovimientos("Todavía no hay movimientos registrados.");
        estadoMovimientos.textContent = "No se encontraron movimientos de inventario.";
        return;
    }

    const filas = movimientos.map((movimiento) => {
        const producto = movimiento.producto;
        const nombreProducto = producto
            ? `${producto.codigo ?? ""}${producto.codigo && producto.nombre ? " - " : ""}${producto.nombre ?? ""}`
            : "Producto no disponible";

        return [
            formatearFechaMovimiento(movimiento.fechaMovimiento),
            nombreProducto || "Producto no disponible",
            movimiento.tipoMovimiento === "ENTRADA" ? "Entrada" : "Salida",
            Number.isFinite(Number(movimiento.cantidad))
                ? Number(movimiento.cantidad).toLocaleString("es-PE")
                : "—",
            movimiento.motivo ?? "—",
            Number.isFinite(Number(movimiento.stockResultante))
                ? Number(movimiento.stockResultante).toLocaleString("es-PE")
                : "—"
        ].map(crearCelda);
    }).map((celdas) => {
        const fila = document.createElement("tr");
        fila.append(...celdas);
        return fila;
    });

    listaMovimientos.replaceChildren(...filas);
    estadoMovimientos.textContent = `${movimientos.length.toLocaleString("es-PE")} movimiento(s) registrados.`;
}

async function cargarMovimientos() {
    listaMovimientos.setAttribute("aria-busy", "true");

    try {
        const respuesta = await solicitarApi("/api/movimientos-inventario");
        const movimientos = await respuesta.json();
        if (!Array.isArray(movimientos)) {
            throw new Error("La respuesta del backend para los movimientos no tiene el formato esperado.");
        }

        mostrarMovimientos(movimientos);
        estadoMovimientos.classList.remove("almacen-mensaje-error");
        return true;
    } catch (error) {
        console.error("Error al cargar los movimientos de inventario:", error);
        mostrarMensajeMovimientos(error.message || "Ocurrió un error al cargar los movimientos.");
        estadoMovimientos.textContent = error.message || "Ocurrió un error al cargar los movimientos.";
        estadoMovimientos.classList.add("almacen-mensaje-error");
        return false;
    } finally {
        listaMovimientos.setAttribute("aria-busy", "false");
    }
}

function mostrarMensajeAlertas(mensaje) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 5;
    celda.className = "almacen-vacio";
    celda.textContent = mensaje;
    fila.append(celda);
    listaAlertasStock.replaceChildren(fila);
}

function mostrarAlertasStock(alertas) {
    if (alertas.length === 0) {
        mostrarMensajeAlertas("No hay productos con stock bajo.");
        estadoAlertasStock.textContent = "No hay alertas de stock bajo.";
        return;
    }

    const filas = alertas.map((alerta) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(alerta.codigo ?? "—"),
            crearCelda(alerta.nombre ?? "—"),
            crearCelda(Number.isFinite(Number(alerta.stockActual))
                ? Number(alerta.stockActual).toLocaleString("es-PE")
                : "—"),
            crearCelda(Number.isFinite(Number(alerta.stockMinimo))
                ? Number(alerta.stockMinimo).toLocaleString("es-PE")
                : "—"),
            crearCelda(Number.isFinite(Number(alerta.cantidadFaltante))
                ? Number(alerta.cantidadFaltante).toLocaleString("es-PE")
                : "—")
        );
        return fila;
    });

    listaAlertasStock.replaceChildren(...filas);
    estadoAlertasStock.textContent = `${alertas.length.toLocaleString("es-PE")} producto(s) requieren reposición.`;
}

async function cargarAlertasStock() {
    listaAlertasStock.setAttribute("aria-busy", "true");

    try {
        const respuesta = await solicitarApi("/api/productos/stock-bajo");
        const alertas = await respuesta.json();
        if (!Array.isArray(alertas)) {
            throw new Error("La respuesta del backend para las alertas no tiene el formato esperado.");
        }

        mostrarAlertasStock(alertas);
        estadoAlertasStock.classList.remove("almacen-mensaje-error");
        return true;
    } catch (error) {
        console.error("Error al cargar las alertas de stock bajo:", error);
        mostrarMensajeAlertas(error.message || "Ocurrió un error al cargar las alertas.");
        estadoAlertasStock.textContent = error.message || "Ocurrió un error al cargar las alertas.";
        estadoAlertasStock.classList.add("almacen-mensaje-error");
        return false;
    } finally {
        listaAlertasStock.setAttribute("aria-busy", "false");
    }
}

function mostrarMensajeEquipos(mensaje) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 8;
    celda.className = "almacen-vacio";
    celda.textContent = mensaje;
    fila.append(celda);
    listaEquipos.replaceChildren(fila);
}

function traducirEstadoEquipo(estado) {
    const etiquetas = {
        OPERATIVO: "Operativo",
        EN_MANTENIMIENTO: "En mantenimiento",
        FUERA_DE_SERVICIO: "Fuera de servicio",
        BAJA: "Baja"
    };
    return etiquetas[estado] ?? estado ?? "Sin información";
}

function mostrarEquipos(equipos) {
    if (equipos.length === 0) {
        mostrarMensajeEquipos("No hay equipos registrados.");
        estadoEquipos.textContent = "No se encontraron equipos.";
        return;
    }

    const filas = equipos.map((equipo) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(equipo.codigoPatrimonial ?? "—"),
            crearCelda(equipo.marca ?? "—"),
            crearCelda(equipo.modelo ?? "—"),
            crearCelda(equipo.numeroSerie ?? "—"),
            crearCelda(traducirEstadoEquipo(equipo.estado)),
            crearCelda(equipo.ubicacion ?? "—"),
            crearCelda(equipo.responsable ?? "—")
        );

        const acciones = document.createElement("td");
        const botonEditar = document.createElement("button");
        botonEditar.className = "almacen-boton-editar";
        botonEditar.type = "button";
        botonEditar.dataset.equipoId = equipo.id;
        botonEditar.dataset.accionEquipo = "editar";
        botonEditar.textContent = "Editar";
        botonEditar.setAttribute("aria-label", `Editar equipo ${equipo.codigoPatrimonial}`);

        const botonHistorial = document.createElement("button");
        botonHistorial.className = "almacen-boton-historial";
        botonHistorial.type = "button";
        botonHistorial.dataset.equipoId = equipo.id;
        botonHistorial.dataset.accionEquipo = "historial";
        botonHistorial.textContent = "Historial";
        botonHistorial.setAttribute("aria-label", `Ver historial de ${equipo.codigoPatrimonial}`);

        acciones.append(botonEditar, botonHistorial);
        fila.append(acciones);
        return fila;
    });

    listaEquipos.replaceChildren(...filas);
    estadoEquipos.textContent = `${equipos.length.toLocaleString("es-PE")} equipo(s) registrados.`;
}

async function cargarEquipos() {
    listaEquipos.setAttribute("aria-busy", "true");

    try {
        const respuesta = await solicitarApi("/api/v1/equipos");
        const equipos = await respuesta.json();
        if (!Array.isArray(equipos)) {
            throw new Error("La respuesta del backend para los equipos no tiene el formato esperado.");
        }

        mostrarEquipos(equipos);
        estadoEquipos.classList.remove("almacen-mensaje-error");
        return true;
    } catch (error) {
        console.error("Error al cargar los equipos:", error);
        mostrarMensajeEquipos(error.message || "Ocurrió un error al cargar los equipos.");
        estadoEquipos.textContent = error.message || "Ocurrió un error al cargar los equipos.";
        estadoEquipos.classList.add("almacen-mensaje-error");
        return false;
    } finally {
        listaEquipos.setAttribute("aria-busy", "false");
    }
}

function establecerEstadoFormularioEquipo(mensaje, esError = false) {
    estadoFormularioEquipo.textContent = mensaje;
    estadoFormularioEquipo.classList.toggle("almacen-mensaje-error", esError);
}

function restablecerFormularioEquipo() {
    formularioEquipo.reset();
    document.querySelector("#equipoId").value = "";
    tituloFormularioEquipo.textContent = "Registrar equipo";
    botonGuardarEquipo.textContent = "Registrar equipo";
    botonCancelarEdicionEquipo.hidden = true;
    establecerEstadoFormularioEquipo("");
}

function iniciarEdicionEquipo(equipo) {
    document.querySelector("#equipoId").value = equipo.id;
    document.querySelector("#codigoPatrimonial").value = equipo.codigoPatrimonial ?? "";
    document.querySelector("#marcaEquipo").value = equipo.marca ?? "";
    document.querySelector("#modeloEquipo").value = equipo.modelo ?? "";
    document.querySelector("#numeroSerieEquipo").value = equipo.numeroSerie ?? "";
    document.querySelector("#estadoEquipo").value = equipo.estado ?? "OPERATIVO";
    document.querySelector("#ubicacionEquipo").value = equipo.ubicacion ?? "";
    document.querySelector("#responsableEquipo").value = equipo.responsable ?? "";
    tituloFormularioEquipo.textContent = `Editar equipo: ${equipo.codigoPatrimonial ?? equipo.id}`;
    botonGuardarEquipo.textContent = "Guardar cambios";
    botonCancelarEdicionEquipo.hidden = false;
    establecerEstadoFormularioEquipo("Edita los datos y guarda los cambios.");
    formularioEquipo.scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrarMensajeHistorialEquipo(mensaje) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 6;
    celda.className = "almacen-vacio";
    celda.textContent = mensaje;
    fila.append(celda);
    listaHistorialEquipo.replaceChildren(fila);
}

function formatearFechaProgramada(fecha) {
    if (!fecha) {
        return "—";
    }

    const partes = fecha.split("-");
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

function traducirPrioridadOrden(prioridad) {
    const etiquetas = {
        BAJA: "Baja",
        MEDIA: "Media",
        ALTA: "Alta",
        URGENTE: "Urgente"
    };
    return etiquetas[prioridad] ?? prioridad ?? "—";
}

function traducirEstadoOrden(estado) {
    const etiquetas = {
        PENDIENTE: "Pendiente",
        PROGRAMADA: "Programada",
        EN_PROCESO: "En proceso",
        OBSERVADA: "Observada",
        FINALIZADA: "Finalizada",
        CANCELADA: "Cancelada"
    };
    return etiquetas[estado] ?? estado ?? "—";
}

function mostrarHistorialEquipo(ordenes) {
    if (ordenes.length === 0) {
        mostrarMensajeHistorialEquipo("Este equipo no tiene órdenes de mantenimiento registradas.");
        estadoHistorialEquipo.textContent = "No hay historial de mantenimiento para este equipo.";
        return;
    }

    const filas = ordenes.map((orden) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(orden.codigo ?? `OT-${orden.id ?? "—"}`),
            crearCelda(orden.tipoMantenimientoNombre ?? "—"),
            crearCelda(formatearFechaProgramada(orden.fechaProgramada)),
            crearCelda(traducirPrioridadOrden(orden.prioridad)),
            crearCelda(traducirEstadoOrden(orden.estado)),
            crearCelda(orden.descripcion ?? "—")
        );
        return fila;
    });

    listaHistorialEquipo.replaceChildren(...filas);
    estadoHistorialEquipo.textContent = `${ordenes.length.toLocaleString("es-PE")} orden(es) de mantenimiento.`;
}

async function cargarHistorialEquipo(equipoId, codigoPatrimonial) {
    seccionHistorialEquipo.hidden = false;
    tituloHistorialEquipo.textContent = `Historial de mantenimiento: ${codigoPatrimonial}`;
    estadoHistorialEquipo.textContent = "Cargando historial...";
    estadoHistorialEquipo.classList.remove("almacen-mensaje-error");
    listaHistorialEquipo.setAttribute("aria-busy", "true");

    try {
        const respuesta = await solicitarApi(
            `/api/v1/equipos/${encodeURIComponent(equipoId)}/historial-mantenimiento`
        );
        const ordenes = await respuesta.json();
        if (!Array.isArray(ordenes)) {
            throw new Error("La respuesta del backend para el historial no tiene el formato esperado.");
        }

        mostrarHistorialEquipo(ordenes);
    } catch (error) {
        console.error("Error al cargar el historial de mantenimiento:", error);
        mostrarMensajeHistorialEquipo(error.message || "Ocurrió un error al cargar el historial.");
        estadoHistorialEquipo.textContent = error.message || "Ocurrió un error al cargar el historial.";
        estadoHistorialEquipo.classList.add("almacen-mensaje-error");
    } finally {
        listaHistorialEquipo.setAttribute("aria-busy", "false");
        seccionHistorialEquipo.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function establecerEstadoFormulario(mensaje, esError = false) {
    estadoFormularioProducto.textContent = mensaje;
    estadoFormularioProducto.classList.toggle("almacen-mensaje-error", esError);
}

function establecerEstadoFormularioMovimiento(mensaje, esError = false) {
    estadoFormularioMovimiento.textContent = mensaje;
    estadoFormularioMovimiento.classList.toggle("almacen-mensaje-error", esError);
}

function restablecerFormularioProducto() {
    formularioProducto.reset();
    document.querySelector("#productoId").value = "";
    tituloFormularioProducto.textContent = "Registrar producto";
    botonGuardarProducto.textContent = "Registrar producto";
    botonCancelarEdicion.hidden = true;
    establecerEstadoFormulario("");
}

function iniciarEdicion(producto) {
    document.querySelector("#productoId").value = producto.id;
    document.querySelector("#codigoProducto").value = producto.codigo ?? "";
    document.querySelector("#nombreProducto").value = producto.nombre ?? "";
    document.querySelector("#descripcionProducto").value = producto.descripcion ?? "";
    document.querySelector("#unidadProducto").value = producto.unidadMedida ?? "";
    document.querySelector("#stockActualProducto").value = producto.stockActual ?? "";
    document.querySelector("#stockMinimoProducto").value = producto.stockMinimo ?? "";
    document.querySelector("#precioProducto").value = producto.precioUnitario ?? "";
    document.querySelector("#estadoProducto").value = String(producto.estado);
    tituloFormularioProducto.textContent = `Editar producto: ${producto.nombre ?? producto.codigo}`;
    botonGuardarProducto.textContent = "Guardar cambios";
    botonCancelarEdicion.hidden = false;
    establecerEstadoFormulario("Edita los datos y guarda los cambios.");
    formularioProducto.scrollIntoView({ behavior: "smooth", block: "start" });
}

botonCancelarEdicion.addEventListener("click", restablecerFormularioProducto);

listaProductos.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-producto-id]");
    if (!boton) {
        return;
    }

    try {
        const respuesta = await solicitarApi(`/api/productos/${encodeURIComponent(boton.dataset.productoId)}`);
        iniciarEdicion(await respuesta.json());
    } catch (error) {
        console.error("Error al obtener el producto para editar:", error);
        establecerEstadoFormulario(error.message || "No se pudo cargar el producto.", true);
    }
});

formularioProducto.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = document.querySelector("#productoId").value;
    const producto = {
        codigo: document.querySelector("#codigoProducto").value.trim(),
        nombre: document.querySelector("#nombreProducto").value.trim(),
        descripcion: document.querySelector("#descripcionProducto").value.trim(),
        unidadMedida: document.querySelector("#unidadProducto").value.trim(),
        stockActual: Number(document.querySelector("#stockActualProducto").value),
        stockMinimo: Number(document.querySelector("#stockMinimoProducto").value),
        precioUnitario: Number(document.querySelector("#precioProducto").value),
        estado: document.querySelector("#estadoProducto").value === "true"
    };

    botonGuardarProducto.disabled = true;
    establecerEstadoFormulario(id ? "Guardando cambios..." : "Registrando producto...");

    try {
        await solicitarApi(
            id ? `/api/productos/${encodeURIComponent(id)}` : "/api/productos",
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(producto)
            }
        );

        restablecerFormularioProducto();
        const [productosCargados, alertasCargadas] = await Promise.all([
            cargarProductos(),
            cargarAlertasStock()
        ]);
        establecerEstadoFormulario(
            id
                ? productosCargados && alertasCargadas
                    ? "Producto actualizado correctamente."
                    : "Producto actualizado, pero no se pudo actualizar el inventario o las alertas."
                : productosCargados && alertasCargadas
                    ? "Producto registrado correctamente."
                    : "Producto registrado, pero no se pudo actualizar el inventario o las alertas.",
            !(productosCargados && alertasCargadas)
        );
    } catch (error) {
        console.error("Error al guardar el producto:", error);
        establecerEstadoFormulario(error.message || "No se pudo guardar el producto.", true);
    } finally {
        botonGuardarProducto.disabled = false;
    }
});

formularioMovimiento.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const movimiento = {
        productoId: Number(productoMovimiento.value),
        tipoMovimiento: document.querySelector("#tipoMovimiento").value,
        cantidad: Number(document.querySelector("#cantidadMovimiento").value),
        motivo: document.querySelector("#motivoMovimiento").value.trim()
    };

    botonGuardarMovimiento.disabled = true;
    const tipoMovimiento = movimiento.tipoMovimiento;
    establecerEstadoFormularioMovimiento(
        tipoMovimiento === "ENTRADA" ? "Registrando entrada..." : "Registrando salida..."
    );

    try {
        await solicitarApi("/api/movimientos-inventario", {
            method: "POST",
            body: JSON.stringify(movimiento)
        });

        formularioMovimiento.reset();
        const [productosCargados, movimientosCargados, alertasCargadas] = await Promise.all([
            cargarProductos(),
            cargarMovimientos(),
            cargarAlertasStock()
        ]);
        const mensaje = tipoMovimiento === "ENTRADA"
            ? "Entrada registrada correctamente."
            : "Salida registrada correctamente.";
        establecerEstadoFormularioMovimiento(
            productosCargados && movimientosCargados && alertasCargadas
                ? mensaje
                : `${mensaje} No se pudo actualizar una de las vistas; vuelve a cargar la página.`,
            !(productosCargados && movimientosCargados && alertasCargadas)
        );
    } catch (error) {
        console.error("Error al registrar el movimiento de inventario:", error);
        establecerEstadoFormularioMovimiento(
            error.message || "No se pudo registrar el movimiento.",
            true
        );
    } finally {
        actualizarOpcionesProductosMovimiento();
        botonGuardarMovimiento.disabled = productosAlmacen.every((producto) => producto.estado !== true);
    }
});

botonCancelarEdicionEquipo.addEventListener("click", restablecerFormularioEquipo);

listaEquipos.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-accion-equipo]");
    if (!boton) {
        return;
    }

    const equipoId = boton.dataset.equipoId;
    if (boton.dataset.accionEquipo === "historial") {
        const fila = boton.closest("tr");
        const codigoPatrimonial = fila.cells[0].textContent;
        await cargarHistorialEquipo(equipoId, codigoPatrimonial);
        return;
    }

    try {
        const respuesta = await solicitarApi(`/api/v1/equipos/${encodeURIComponent(equipoId)}`);
        iniciarEdicionEquipo(await respuesta.json());
    } catch (error) {
        console.error("Error al obtener el equipo para editar:", error);
        establecerEstadoFormularioEquipo(error.message || "No se pudo cargar el equipo.", true);
    }
});

formularioEquipo.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = document.querySelector("#equipoId").value;
    const equipo = {
        codigoPatrimonial: document.querySelector("#codigoPatrimonial").value.trim(),
        marca: document.querySelector("#marcaEquipo").value.trim(),
        modelo: document.querySelector("#modeloEquipo").value.trim(),
        numeroSerie: document.querySelector("#numeroSerieEquipo").value.trim(),
        estado: document.querySelector("#estadoEquipo").value,
        ubicacion: document.querySelector("#ubicacionEquipo").value.trim(),
        responsable: document.querySelector("#responsableEquipo").value.trim()
    };

    botonGuardarEquipo.disabled = true;
    establecerEstadoFormularioEquipo(id ? "Guardando cambios..." : "Registrando equipo...");

    try {
        await solicitarApi(
            id ? `/api/v1/equipos/${encodeURIComponent(id)}` : "/api/v1/equipos",
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(equipo)
            }
        );

        restablecerFormularioEquipo();
        const equiposCargados = await cargarEquipos();
        establecerEstadoFormularioEquipo(
            id
                ? equiposCargados
                    ? "Equipo actualizado correctamente."
                    : "Equipo actualizado, pero no se pudo actualizar la lista."
                : equiposCargados
                    ? "Equipo registrado correctamente."
                    : "Equipo registrado, pero no se pudo actualizar la lista.",
            !equiposCargados
        );
    } catch (error) {
        console.error("Error al guardar el equipo:", error);
        establecerEstadoFormularioEquipo(error.message || "No se pudo guardar el equipo.", true);
    } finally {
        botonGuardarEquipo.disabled = false;
    }
});

cargarProductos();
cargarMovimientos();
cargarAlertasStock();
cargarEquipos();
