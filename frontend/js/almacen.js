const API_ALMACEN_URL = "http://localhost:8080";

const listaProductos = document.querySelector("#listaProductos");
const estadoProductos = document.querySelector("#estadoProductos");

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

    celda.colSpan = 7;
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
                tieneStockValido
                    ? stockBajo ? "Stock bajo" : "Disponible"
                    : "Sin información",
                tieneStockValido
                    ? stockBajo
                        ? "almacen-etiqueta-stock-bajo"
                        : "almacen-etiqueta-stock-disponible"
                    : "almacen-etiqueta-inactivo"
            )
        );
        fila.append(situacionStock);

        return fila;
    });

    listaProductos.replaceChildren(...filas);
    estadoProductos.textContent = `${productos.length.toLocaleString("es-PE")} producto(s) en el inventario.`;
}

async function cargarProductos() {
    listaProductos.setAttribute("aria-busy", "true");

    try {
        const respuesta = await fetch(`${API_ALMACEN_URL}/api/productos`, {
            headers: {
                Accept: "application/json"
            }
        });

        if (!respuesta.ok) {
            if (respuesta.status === 401 || respuesta.status === 403) {
                throw new Error("El backend requiere autenticación para consultar los productos.");
            }

            throw new Error(`No se pudieron cargar los productos (HTTP ${respuesta.status}).`);
        }

        const productos = await respuesta.json();
        if (!Array.isArray(productos)) {
            throw new Error("La respuesta del backend no tiene el formato esperado.");
        }

        mostrarProductos(productos);
    } catch (error) {
        console.error("Error al cargar los productos del almacén:", error);
        mostrarMensajeTabla(error.message || "Ocurrió un error al cargar los productos.");
        estadoProductos.textContent = error.message || "Ocurrió un error al cargar los productos.";
        estadoProductos.classList.add("almacen-mensaje-error");
    } finally {
        listaProductos.setAttribute("aria-busy", "false");
    }
}

cargarProductos();
