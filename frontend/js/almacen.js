const API_ALMACEN_URL = "http://localhost:8081";

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
const tabButtons = document.querySelectorAll(".almacen-pestana");
const tabPanels = document.querySelectorAll(".almacen-panel");
const filtroBuscarProducto = document.querySelector("#filtroBuscarProducto");
const filtroEstadoProducto = document.querySelector("#filtroEstadoProducto");
const filtroStockProducto = document.querySelector("#filtroStockProducto");
const filtroTipoMovimiento = document.querySelector("#filtroTipoMovimiento");
const filtroProductoMovimiento = document.querySelector("#filtroProductoMovimiento");
const filtroDesdeMovimiento = document.querySelector("#filtroDesdeMovimiento");
const filtroHastaMovimiento = document.querySelector("#filtroHastaMovimiento");
const filtroBuscarAlerta = document.querySelector("#filtroBuscarAlerta");
const filtroBuscarEquipo = document.querySelector("#filtroBuscarEquipo");
const filtroEstadoEquipo = document.querySelector("#filtroEstadoEquipo");
const contenedorFormProducto = document.querySelector("#contenedorFormProducto");
const btnToggleFormProducto = document.querySelector("#btnToggleFormProducto");
const contenedorFormMovimiento = document.querySelector("#contenedorFormMovimiento");
const btnToggleFormMovimiento = document.querySelector("#btnToggleFormMovimiento");
const contenedorFormEquipo = document.querySelector("#contenedorFormEquipo");
const btnToggleFormEquipo = document.querySelector("#btnToggleFormEquipo");

let productosAlmacen = [];
let movimientosAlmacen = [];
let alertasStockAlmacen = [];
let equiposAlmacen = [];

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
    const token = sessionStorage.getItem("autenticacion");
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (opciones.body) {
        headers["Content-Type"] = "application/json";
    }

    const respuesta = await fetch(`${API_ALMACEN_URL}${ruta}`, {
        ...opciones,
        headers
    });

    if (respuesta.status === 401) {
        throw new Error("Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.");
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

function actualizarDashboard() {
    document.querySelector("#kpiProductos").textContent = productosAlmacen.length.toLocaleString("es-PE");
    document.querySelector("#kpiStockBajo").textContent = alertasStockAlmacen.length.toLocaleString("es-PE");
    document.querySelector("#kpiMovimientos").textContent = movimientosAlmacen.length.toLocaleString("es-PE");
    document.querySelector("#kpiEquipos").textContent = equiposAlmacen.length.toLocaleString("es-PE");
}

function activarPestana(boton) {
    const panelActivo = document.getElementById(boton.dataset.panel);
    if (!panelActivo) {
        return;
    }

    tabButtons.forEach((pestana) => {
        const seleccionada = pestana === boton;
        pestana.classList.toggle("active", seleccionada);
        pestana.setAttribute("aria-selected", String(seleccionada));
        pestana.tabIndex = seleccionada ? 0 : -1;
    });

    tabPanels.forEach((panel) => {
        const activo = panel === panelActivo;
        panel.classList.toggle("active", activo);
        panel.hidden = !activo;
    });
}

function configurarPestanas() {
    tabButtons.forEach((boton, indice) => {
        boton.addEventListener("click", () => activarPestana(boton));
        boton.addEventListener("keydown", (evento) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) {
                return;
            }

            evento.preventDefault();
            let siguienteIndice = indice;
            if (evento.key === "ArrowRight") {
                siguienteIndice = (indice + 1) % tabButtons.length;
            } else if (evento.key === "ArrowLeft") {
                siguienteIndice = (indice - 1 + tabButtons.length) % tabButtons.length;
            } else if (evento.key === "Home") {
                siguienteIndice = 0;
            } else if (evento.key === "End") {
                siguienteIndice = tabButtons.length - 1;
            }

            tabButtons[siguienteIndice].focus();
            activarPestana(tabButtons[siguienteIndice]);
        });
    });
}

function configurarFormularioPlegable(boton, contenedor, formulario, cancelar, resetear) {
    const etiquetaInicial = boton.textContent.trim();
    boton.addEventListener("click", () => {
        const mostrar = contenedor.hidden;
        if (mostrar && formulario) {
            resetear();
        }
        contenedor.hidden = !mostrar;
        boton.setAttribute("aria-expanded", String(mostrar));
        boton.textContent = mostrar ? "✕ Cerrar formulario" : etiquetaInicial;
        if (mostrar) {
            contenedor.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    if (cancelar) {
        cancelar.addEventListener("click", () => {
            resetear();
            contenedor.hidden = true;
            boton.setAttribute("aria-expanded", "false");
            boton.textContent = etiquetaInicial;
        });
    }
}

function abrirFormularioPlegable(boton, contenedor) {
    contenedor.hidden = false;
    boton.setAttribute("aria-expanded", "true");
    boton.textContent = "✕ Cerrar formulario";
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
    actualizarOpcionesFiltroProducto();
    actualizarDashboard();

    filtrarProductos();
}

function filtrarProductos() {
    const busqueda = filtroBuscarProducto.value.trim().toLocaleLowerCase("es-PE");
    const estadoSeleccionado = filtroEstadoProducto.value;
    const stockSeleccionado = filtroStockProducto.value;
    const productos = productosAlmacen.filter((producto) => {
        const coincideBusqueda = `${producto.codigo ?? ""} ${producto.nombre ?? ""}`
            .toLocaleLowerCase("es-PE")
            .includes(busqueda);
        const coincideEstado = !estadoSeleccionado
            || (estadoSeleccionado === "activo" ? producto.estado === true : producto.estado === false);
        const stockActual = Number(producto.stockActual);
        const stockMinimo = Number(producto.stockMinimo);
        const tieneStockValido = Number.isFinite(stockActual) && Number.isFinite(stockMinimo);
        const stockBajo = tieneStockValido && stockActual <= stockMinimo;
        const coincideStock = !stockSeleccionado
            || (stockSeleccionado === "bajo" ? stockBajo : tieneStockValido && !stockBajo);

        return coincideBusqueda && coincideEstado && coincideStock;
    });

    if (productos.length === 0) {
        mostrarMensajeTabla(productosAlmacen.length === 0
            ? "No hay productos registrados."
            : "No hay productos que coincidan con los filtros.");
        estadoProductos.textContent = productosAlmacen.length === 0
            ? "No se encontraron productos en el inventario."
            : "No se encontraron productos con los filtros seleccionados.";
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
    estadoProductos.textContent = `Mostrando ${productos.length.toLocaleString("es-PE")} de ${productosAlmacen.length.toLocaleString("es-PE")} producto(s).`;
}

function actualizarOpcionesFiltroProducto() {
    const seleccionActual = filtroProductoMovimiento.value;
    const opciones = [new Option("Todos los productos", "")];

    productosAlmacen.forEach((producto) => {
        opciones.push(new Option(
            `${producto.codigo ?? ""} - ${producto.nombre ?? ""}`.trim(),
            String(producto.id)
        ));
    });

    filtroProductoMovimiento.replaceChildren(...opciones);
    if (productosAlmacen.some((producto) => String(producto.id) === seleccionActual)) {
        filtroProductoMovimiento.value = seleccionActual;
    }
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
        actualizarOpcionesFiltroProducto();
        actualizarDashboard();
        filtrarProductos();
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
    movimientosAlmacen = movimientos;
    actualizarDashboard();
    filtrarMovimientos();
}

function filtrarMovimientos() {
    const tipo = filtroTipoMovimiento.value;
    const productoId = filtroProductoMovimiento.value;
    const desde = filtroDesdeMovimiento.value;
    const hasta = filtroHastaMovimiento.value;
    const movimientos = movimientosAlmacen.filter((movimiento) => {
        const fecha = movimiento.fechaMovimiento ? movimiento.fechaMovimiento.slice(0, 10) : "";
        return (!tipo || movimiento.tipoMovimiento === tipo)
            && (!productoId || String(movimiento.producto?.id) === productoId)
            && (!desde || (fecha && fecha >= desde))
            && (!hasta || (fecha && fecha <= hasta));
    });

    if (movimientos.length === 0) {
        mostrarMensajeMovimientos(movimientosAlmacen.length === 0
            ? "Todavía no hay movimientos registrados."
            : "No hay movimientos que coincidan con los filtros.");
        estadoMovimientos.textContent = movimientosAlmacen.length === 0
            ? "No se encontraron movimientos de inventario."
            : "No se encontraron movimientos con los filtros seleccionados.";
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
    estadoMovimientos.textContent = `Mostrando ${movimientos.length.toLocaleString("es-PE")} de ${movimientosAlmacen.length.toLocaleString("es-PE")} movimiento(s).`;
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
        movimientosAlmacen = [];
        actualizarDashboard();
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
    alertasStockAlmacen = alertas;
    actualizarDashboard();
    filtrarAlertasStock();
}

function filtrarAlertasStock() {
    const busqueda = filtroBuscarAlerta.value.trim().toLocaleLowerCase("es-PE");
    const alertas = alertasStockAlmacen.filter((alerta) =>
        `${alerta.codigo ?? ""} ${alerta.nombre ?? ""}`.toLocaleLowerCase("es-PE").includes(busqueda)
    );

    if (alertas.length === 0) {
        mostrarMensajeAlertas(alertasStockAlmacen.length === 0
            ? "No hay productos con stock bajo."
            : "No hay alertas que coincidan con la búsqueda.");
        estadoAlertasStock.textContent = alertasStockAlmacen.length === 0
            ? "No hay alertas de stock bajo."
            : "No hay alertas que coincidan con la búsqueda.";
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
    estadoAlertasStock.textContent = `Mostrando ${alertas.length.toLocaleString("es-PE")} de ${alertasStockAlmacen.length.toLocaleString("es-PE")} producto(s) que requieren reposición.`;
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
        alertasStockAlmacen = [];
        actualizarDashboard();
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
    equiposAlmacen = equipos;
    actualizarDashboard();
    filtrarEquipos();
}

function filtrarEquipos() {
    const busqueda = filtroBuscarEquipo.value.trim().toLocaleLowerCase("es-PE");
    const estadoSeleccionado = filtroEstadoEquipo.value;
    const equipos = equiposAlmacen.filter((equipo) => {
        const textoEquipo = [
            equipo.codigoPatrimonial,
            equipo.marca,
            equipo.modelo,
            equipo.numeroSerie,
            equipo.ubicacion,
            equipo.responsable
        ].join(" ").toLocaleLowerCase("es-PE");
        return textoEquipo.includes(busqueda)
            && (!estadoSeleccionado || equipo.estado === estadoSeleccionado);
    });

    if (equipos.length === 0) {
        mostrarMensajeEquipos(equiposAlmacen.length === 0
            ? "No hay equipos registrados."
            : "No hay equipos que coincidan con los filtros.");
        estadoEquipos.textContent = equiposAlmacen.length === 0
            ? "No se encontraron equipos."
            : "No se encontraron equipos con los filtros seleccionados.";
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
    estadoEquipos.textContent = `Mostrando ${equipos.length.toLocaleString("es-PE")} de ${equiposAlmacen.length.toLocaleString("es-PE")} equipo(s).`;
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
        equiposAlmacen = [];
        actualizarDashboard();
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
    abrirFormularioPlegable(btnToggleFormEquipo, contenedorFormEquipo);
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
    abrirFormularioPlegable(btnToggleFormProducto, contenedorFormProducto);
    formularioProducto.scrollIntoView({ behavior: "smooth", block: "start" });
}

configurarPestanas();
configurarFormularioPlegable(
    btnToggleFormProducto,
    contenedorFormProducto,
    formularioProducto,
    null,
    restablecerFormularioProducto
);
configurarFormularioPlegable(
    btnToggleFormMovimiento,
    contenedorFormMovimiento,
    formularioMovimiento,
    null,
    () => formularioMovimiento.reset()
);
configurarFormularioPlegable(
    btnToggleFormEquipo,
    contenedorFormEquipo,
    formularioEquipo,
    null,
    restablecerFormularioEquipo
);

botonCancelarEdicion.addEventListener("click", () => {
    restablecerFormularioProducto();
    contenedorFormProducto.hidden = true;
    btnToggleFormProducto.setAttribute("aria-expanded", "false");
    btnToggleFormProducto.textContent = "➕ Nuevo producto";
});

botonCancelarEdicionEquipo.addEventListener("click", () => {
    restablecerFormularioEquipo();
    contenedorFormEquipo.hidden = true;
    btnToggleFormEquipo.setAttribute("aria-expanded", "false");
    btnToggleFormEquipo.textContent = "➕ Nuevo equipo";
});

filtroBuscarProducto.addEventListener("input", filtrarProductos);
filtroEstadoProducto.addEventListener("change", filtrarProductos);
filtroStockProducto.addEventListener("change", filtrarProductos);
filtroTipoMovimiento.addEventListener("change", filtrarMovimientos);
filtroProductoMovimiento.addEventListener("change", filtrarMovimientos);
filtroDesdeMovimiento.addEventListener("change", filtrarMovimientos);
filtroHastaMovimiento.addEventListener("change", filtrarMovimientos);
filtroBuscarAlerta.addEventListener("input", filtrarAlertasStock);
filtroBuscarEquipo.addEventListener("input", filtrarEquipos);
filtroEstadoEquipo.addEventListener("change", filtrarEquipos);

document.querySelector("#btnRefrescarProductos").addEventListener("click", cargarProductos);
document.querySelector("#btnRefrescarMovimientos").addEventListener("click", cargarMovimientos);
document.querySelector("#btnRefrescarAlertas").addEventListener("click", cargarAlertasStock);
document.querySelector("#btnRefrescarEquipos").addEventListener("click", cargarEquipos);

filtroHastaMovimiento.addEventListener("change", () => {
    if (filtroDesdeMovimiento.value && filtroHastaMovimiento.value < filtroDesdeMovimiento.value) {
        filtroHastaMovimiento.setCustomValidity("La fecha final debe ser igual o posterior a la fecha inicial.");
        filtroHastaMovimiento.reportValidity();
        return;
    }
    filtroHastaMovimiento.setCustomValidity("");
});

filtroDesdeMovimiento.addEventListener("change", () => {
    if (filtroHastaMovimiento.value && filtroHastaMovimiento.value < filtroDesdeMovimiento.value) {
        filtroDesdeMovimiento.setCustomValidity("La fecha inicial debe ser igual o anterior a la fecha final.");
        filtroDesdeMovimiento.reportValidity();
        return;
    }
    filtroDesdeMovimiento.setCustomValidity("");
});

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
        contenedorFormProducto.hidden = true;
        btnToggleFormProducto.setAttribute("aria-expanded", "false");
        btnToggleFormProducto.textContent = "➕ Nuevo producto";
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
        contenedorFormMovimiento.hidden = true;
        btnToggleFormMovimiento.setAttribute("aria-expanded", "false");
        btnToggleFormMovimiento.textContent = "➕ Registrar movimiento";
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
        contenedorFormEquipo.hidden = true;
        btnToggleFormEquipo.setAttribute("aria-expanded", "false");
        btnToggleFormEquipo.textContent = "➕ Nuevo equipo";
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
