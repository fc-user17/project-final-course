const API_ALMACEN_URL = "http://localhost:8080";

const formularioProducto = document.querySelector("#formProducto");
const tituloFormularioProducto = document.querySelector("#tituloFormularioProducto");
const botonGuardarProducto = document.querySelector("#guardarProducto");
const botonCancelarEdicion = document.querySelector("#cancelarEdicion");
const estadoFormularioProducto = document.querySelector("#estadoFormularioProducto");
const listaProductos = document.querySelector("#listaProductos");
const estadoProductos = document.querySelector("#estadoProductos");

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
        mostrarMensajeTabla(error.message || "Ocurrió un error al cargar los productos.");
        estadoProductos.textContent = error.message || "Ocurrió un error al cargar los productos.";
        estadoProductos.classList.add("almacen-mensaje-error");
        return false;
    } finally {
        listaProductos.setAttribute("aria-busy", "false");
    }
}

function establecerEstadoFormulario(mensaje, esError = false) {
    estadoFormularioProducto.textContent = mensaje;
    estadoFormularioProducto.classList.toggle("almacen-mensaje-error", esError);
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
        const productosCargados = await cargarProductos();
        establecerEstadoFormulario(
            id
                ? productosCargados ? "Producto actualizado correctamente." : "Producto actualizado, pero no se pudo refrescar la lista."
                : productosCargados ? "Producto registrado correctamente." : "Producto registrado, pero no se pudo refrescar la lista."
        );
    } catch (error) {
        console.error("Error al guardar el producto:", error);
        establecerEstadoFormulario(error.message || "No se pudo guardar el producto.", true);
    } finally {
        botonGuardarProducto.disabled = false;
    }
});

cargarProductos();
