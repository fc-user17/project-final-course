"use strict";

/* =========================================================
   ADMINISTRACIÓN - lógica de la página
   - Finanzas: /api/ingresos, /api/gastos, /api/pagos, /api/facturas,
     /api/cuentas-por-pagar, /api/costos y /api/reportes
   - Datos de otros módulos: RRHH (/api/personal), Almacén
     (/api/productos, /api/movimientos-inventario) y Operaciones
     (/api/v1/ordenes-trabajo)
   La sesión (token JWT) se toma de login.js (sessionStorage).
   ========================================================= */

const API_BASE = "http://localhost:8081";

const RUTAS = {
    resumen: "/api/reportes/resumen",
    rentabilidad: "/api/reportes/rentabilidad-por-servicio",
    personal: "/api/personal",
    productos: "/api/productos",
    stockBajo: "/api/productos/stock-bajo",
    movimientos: "/api/movimientos-inventario",
    ordenes: "/api/v1/ordenes-trabajo"
};

const ESTADOS = [
    { value: "PENDIENTE", label: "Pendiente", tono: "warn" },
    { value: "PAGADA", label: "Pagada", tono: "ok" },
    { value: "VENCIDA", label: "Vencida", tono: "bad" }
];

const METODOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta", "Yape / Plin", "Cheque"]
    .map(function (m) { return { value: m, label: m }; });

/* =========================================================
   UTILIDADES
========================================================= */

function $(selector, raiz) {
    return (raiz || document).querySelector(selector);
}

function esc(valor) {
    return String(valor == null ? "" : valor).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
}

const formatoMoneda = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

function money(valor) {
    return formatoMoneda.format(Number(valor) || 0);
}

function num(valor) {
    return Number(valor) || 0;
}

function fdate(iso) {
    if (!iso) return "—";
    const partes = String(iso).slice(0, 10).split("-");
    if (partes.length !== 3) return esc(iso);
    return esc(partes[2] + "/" + partes[1] + "/" + partes[0]);
}

function addDaysISO(dias) {
    const t = new Date();
    t.setDate(t.getDate() + dias);
    return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function todayISO() {
    return addDaysISO(0);
}

function numeroDia(iso) {
    const p = iso.split("-").map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2]) / 86400000;
}

function diasMora(fila) {
    if (!fila.fechaVencimiento || fila.estado === "PAGADA") return 0;
    const dif = numeroDia(todayISO()) - numeroDia(fila.fechaVencimiento);
    return dif > 0 ? dif : 0;
}

function comparar(a, b) {
    return String(a || "").localeCompare(String(b || ""), "es", { sensitivity: "base" });
}

/* =========================================================
   ESTADO GLOBAL
========================================================= */

const state = {
    servicios: new Set(),
    cruds: {}
};

const deps = {
    trabajadores: { ruta: RUTAS.personal, lista: null, error: "", cargado: false },
    ordenes: { ruta: RUTAS.ordenes, lista: null, error: "", cargado: false },
    productos: { ruta: RUTAS.productos, lista: null, error: "", cargado: false }
};

let routeToken = 0;

function recolectarServicios(filas) {
    filas.forEach(function (f) {
        if (f && f.servicio && String(f.servicio).trim()) {
            state.servicios.add(String(f.servicio).trim());
        }
    });
}

/* =========================================================
   API Y SESIÓN
========================================================= */

class ApiError extends Error {
    constructor(mensaje, estado) {
        super(mensaje);
        this.estado = estado;
    }
}

function obtenerToken() {
    return sessionStorage.getItem("autenticacion")
        || localStorage.getItem("auth_token")
        || sessionStorage.getItem("auth_token");
}

function mostrarSesion(visible) {
    const aviso = $("#admSesion");
    if (aviso) aviso.hidden = !visible;
}

async function api(ruta, opciones) {
    const headers = { Accept: "application/json" };
    const token = obtenerToken();
    if (token) headers.Authorization = "Bearer " + token;

    const config = Object.assign({}, opciones || {});
    if (config.body) headers["Content-Type"] = "application/json";
    config.headers = headers;

    let res;
    try {
        res = await fetch(API_BASE + ruta, config);
    } catch (e) {
        throw new ApiError("No se pudo conectar con el servidor (" + API_BASE + "). Verifica que el backend esté en ejecución.", 0);
    }

    if (res.status === 401) {
        mostrarSesion(true);
        throw new ApiError("Tu sesión no es válida o expiró. Inicia sesión nuevamente.", 401);
    }

    if (res.status === 403) {
        throw new ApiError("Tu rol no tiene permiso para acceder a esta información.", 403);
    }

    if (res.status === 404) {
        throw new ApiError("No se encontró el servicio " + ruta + ". Verifica que ese módulo esté incluido en el backend.", 404);
    }

    if (!res.ok) {
        let mensaje = "Error " + res.status + " al comunicarse con el servidor.";
        try {
            const texto = await res.text();
            if (texto) {
                try {
                    const json = JSON.parse(texto);
                    mensaje = json.message || json.error || mensaje;
                } catch (e) {
                    mensaje = texto.slice(0, 200);
                }
            }
        } catch (e) { /* se conserva el mensaje por defecto */ }
        throw new ApiError(mensaje, res.status);
    }

    const cuerpo = await res.text();
    return cuerpo ? JSON.parse(cuerpo) : null;
}

/* =========================================================
   NOTIFICACIONES Y VENTANAS
========================================================= */

function toast(mensaje, tipo) {
    const el = document.createElement("div");
    const error = tipo === "error";
    el.className = "adm-toast" + (error ? " adm-toast-error" : "");
    el.textContent = mensaje;
    $("#admToasts").appendChild(el);
    setTimeout(function () { el.classList.add("oculto"); }, error ? 5000 : 3000);
    setTimeout(function () { el.remove(); }, error ? 5400 : 3400);
}

let focoPrevio = null;
let alCerrarModal = null;

function abrirModal(html, alCerrar) {
    cerrarModal();
    focoPrevio = document.activeElement;
    alCerrarModal = alCerrar || null;

    const raiz = $("#admModal");
    raiz.innerHTML = '<div class="adm-modal-fondo"><div class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="admModalTitulo">' +
        html + "</div></div>";
    document.body.classList.add("adm-modal-abierto");

    raiz.firstChild.addEventListener("mousedown", function (e) {
        if (e.target === raiz.firstChild) cerrarModal();
    });
}

function cerrarModal() {
    const raiz = $("#admModal");
    if (!raiz.firstChild) return;

    const callback = alCerrarModal;
    alCerrarModal = null;
    raiz.innerHTML = "";
    document.body.classList.remove("adm-modal-abierto");

    if (focoPrevio && typeof focoPrevio.focus === "function") focoPrevio.focus();
    if (callback) callback();
}

document.addEventListener("keydown", function (e) {
    const modal = $("#admModal .adm-modal");
    if (!modal) return;

    if (e.key === "Escape") {
        cerrarModal();
        return;
    }

    if (e.key === "Tab") {
        const items = Array.prototype.filter.call(
            modal.querySelectorAll("button, input, select, textarea, a[href]"),
            function (el) { return !el.disabled && el.offsetParent !== null; }
        );
        if (!items.length) return;

        const primero = items[0];
        const ultimo = items[items.length - 1];

        if (e.shiftKey && document.activeElement === primero) {
            e.preventDefault();
            ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
            e.preventDefault();
            primero.focus();
        }
    }
});

function confirmar(mensaje, textoBoton) {
    return new Promise(function (resolve) {
        let listo = false;

        function terminar(respuesta) {
            if (listo) return;
            listo = true;
            cerrarModal();
            resolve(respuesta);
        }

        abrirModal(
            '<h2 id="admModalTitulo">Confirmar acción</h2>' +
            '<p class="adm-modal-texto">' + esc(mensaje) + "</p>" +
            '<div class="adm-modal-acciones">' +
            '<button type="button" class="adm-boton adm-boton-secundario" data-acc="cancelar">Cancelar</button>' +
            '<button type="button" class="adm-boton adm-boton-peligro-solido" data-acc="ok">' + esc(textoBoton || "Eliminar") + "</button>" +
            "</div>",
            function () {
                if (!listo) {
                    listo = true;
                    resolve(false);
                }
            }
        );

        $('[data-acc="cancelar"]').addEventListener("click", function () { terminar(false); });
        const ok = $('[data-acc="ok"]');
        ok.addEventListener("click", function () { terminar(true); });
        ok.focus();
    });
}

/* =========================================================
   DATOS DE OTROS MÓDULOS (RRHH, ALMACÉN, OPERACIONES)
========================================================= */

async function cargarDep(nombre, forzar) {
    const d = deps[nombre];
    if (d.cargado && !forzar) return d;

    try {
        const datos = await api(d.ruta);
        d.lista = Array.isArray(datos) ? datos : [];
        d.error = "";
    } catch (e) {
        d.lista = null;
        d.error = e.message;
    }

    d.cargado = true;
    return d;
}

function trabajadorPorId(id) {
    const lista = deps.trabajadores.lista;
    return lista ? lista.find(function (t) { return Number(t.id) === Number(id); }) || null : null;
}

function productoPorId(id) {
    const lista = deps.productos.lista;
    return lista ? lista.find(function (p) { return String(p.id) === String(id); }) || null : null;
}

function ordenPorId(id) {
    const lista = deps.ordenes.lista;
    return lista ? lista.find(function (o) { return String(o.id) === String(id); }) || null : null;
}

/*
 * Los pagos y facturas de trabajadores se guardan en los campos de texto
 * existentes (concepto / cliente) con una marca al inicio:
 *     [TRAB:12|Juan Pérez] Sueldo de octubre
 * Así se reconocen sin cambiar la base de datos del módulo.
 */
const MARCA_TRABAJADOR = /^\[TRAB:(\d+)\|([^\]]*)\]\s*(.*)$/;

function codificarTrabajador(id, nombre, texto) {
    const limpio = String(nombre || "").replace(/[\[\]|]/g, "").trim();
    return ("[TRAB:" + (Number(id) || 0) + "|" + limpio + "] " + (texto || "")).trim();
}

function decodificarTrabajador(texto) {
    const m = MARCA_TRABAJADOR.exec(String(texto || ""));
    return m ? { id: Number(m[1]), nombre: m[2], texto: m[3] } : null;
}

/* =========================================================
   COLUMNAS Y CAMPOS REUTILIZABLES
========================================================= */

function estadoBadge(valor) {
    const e = ESTADOS.find(function (x) { return x.value === valor; });
    if (!e) return valor ? '<span class="adm-badge adm-badge-info">' + esc(valor) + "</span>" : "—";
    return '<span class="adm-badge adm-badge-' + e.tono + '">' + esc(e.label) + "</span>";
}

function cTexto(key, label) {
    return { key: key, label: label };
}

function cMonto(key, label) {
    key = key || "monto";
    return { key: key, label: label || "Monto", align: "right", render: function (r) { return esc(money(r[key])); } };
}

function cFecha(key, label) {
    key = key || "fecha";
    return { key: key, label: label || "Fecha", render: function (r) { return fdate(r[key]); } };
}

const cEstado = {
    key: "estado", label: "Estado",
    render: function (r) { return estadoBadge(r.estado); }
};

const cMora = {
    key: "mora", label: "Mora", align: "right",
    render: function (r) {
        const d = diasMora(r);
        return d ? '<span class="adm-mora">' + d + (d === 1 ? " día" : " días") + "</span>" : "—";
    }
};

function cTrabajador(campo, etiqueta) {
    return {
        key: campo, label: etiqueta || "Trabajador",
        render: function (r) {
            const d = decodificarTrabajador(r[campo]);
            if (!d) return esc(r[campo] || "—");
            const t = trabajadorPorId(d.id);
            const nombre = t ? t.nombres : d.nombre;
            const cargo = t && t.cargo ? '<br><span class="adm-sec">' + esc(t.cargo) + "</span>" : "";
            return "<strong>" + esc(nombre || "—") + "</strong>" + cargo;
        }
    };
}

function fMonto(etiqueta) {
    return {
        name: "monto", label: etiqueta || "Monto (S/)", type: "number", required: true,
        min: 0, minExclusive: true, minMessage: "El monto debe ser mayor a cero.",
        step: "0.01", placeholder: "0.00"
    };
}

function fFecha(nombre, etiqueta, desfase) {
    return {
        name: nombre || "fecha", label: etiqueta || "Fecha", type: "date", required: true,
        default: function () { return addDaysISO(desfase || 0); }
    };
}

const fServicio = {
    name: "servicio", label: "Servicio", type: "text", datalist: "servicios",
    placeholder: "Ej. Mantenimiento"
};

const fEstado = {
    name: "estado", label: "Estado", type: "select", required: true,
    options: ESTADOS, default: "PENDIENTE"
};

const fMetodo = {
    name: "metodoPago", label: "Método de pago", type: "select", required: true,
    options: METODOS_PAGO, default: "Transferencia"
};

function validarFechas(d) {
    if (d.fechaEmision && d.fechaVencimiento && d.fechaVencimiento < d.fechaEmision) {
        return { fechaVencimiento: "El vencimiento no puede ser anterior a la emisión." };
    }
    return {};
}

const ACCION_PAGADA = {
    id: "pagada",
    etiqueta: function () { return "Marcar pagada"; },
    cuando: function (r) { return r.estado !== "PAGADA"; },
    cambios: function () { return { estado: "PAGADA" }; },
    mensaje: "Registro marcado como pagado."
};

function opcionesOrdenes() {
    const lista = deps.ordenes.lista || [];
    return lista.slice().sort(function (a, b) { return num(b.id) - num(a.id); }).map(function (o) {
        return {
            value: String(o.id),
            label: (o.codigo || "OT-" + o.id) + " · " + (o.tipoMantenimientoNombre || "Mantenimiento") +
                (o.equipoDescripcion ? " · " + o.equipoDescripcion : "") +
                (o.estado ? " (" + String(o.estado).replace("_", " ").toLowerCase() + ")" : "")
        };
    });
}

function opcionesProductos() {
    const lista = deps.productos.lista || [];
    return lista.filter(function (p) { return p.estado !== false; })
        .sort(function (a, b) { return comparar(a.nombre, b.nombre); })
        .map(function (p) {
            return {
                value: String(p.id),
                label: (p.codigo ? p.codigo + " – " : "") + p.nombre +
                    " (stock " + num(p.stockActual) + " " + (p.unidadMedida || "") + ")"
            };
        });
}

/* =========================================================
   DEFINICIÓN DE LAS SECCIONES
========================================================= */

const MODULOS = [
    { id: "reportes", etiqueta: "📊 Reportes financieros", tipo: "reportes" },

    {
        id: "ingresos", etiqueta: "💵 Ingresos", tipo: "crud", endpoint: "/api/ingresos",
        titulo: "Registros de ingreso", subtitulo: "Ingresos de la empresa por servicio y categoría.",
        singular: "ingreso", nuevo: "Nuevo",
        campos: [
            { name: "descripcion", label: "Descripción", type: "text", required: true, full: true },
            fMonto(), fFecha("fecha", "Fecha"),
            { name: "categoria", label: "Categoría", type: "text", placeholder: "Ej. Servicios" },
            fServicio
        ],
        columnas: [cFecha("fecha", "Fecha"), cTexto("descripcion", "Descripción"), cTexto("categoria", "Categoría"),
            cTexto("servicio", "Servicio"), cMonto()],
        totalKey: "monto", totalEtiqueta: "Total ingresos"
    },

    {
        id: "gastos", etiqueta: "🧾 Gastos", tipo: "crud", endpoint: "/api/gastos",
        titulo: "Registros de gasto", subtitulo: "Gastos generales de la empresa por categoría.",
        singular: "gasto", nuevo: "Nuevo",
        campos: [
            { name: "descripcion", label: "Descripción", type: "text", required: true, full: true },
            fMonto(), fFecha("fecha", "Fecha"),
            { name: "categoria", label: "Categoría", type: "text", placeholder: "Ej. Servicios básicos" },
            fServicio
        ],
        columnas: [cFecha("fecha", "Fecha"), cTexto("descripcion", "Descripción"), cTexto("categoria", "Categoría"),
            cTexto("servicio", "Servicio"), cMonto()],
        totalKey: "monto", totalEtiqueta: "Total gastos"
    },

    {
        id: "pagos", etiqueta: "💳 Registros de pagos", tipo: "crud", endpoint: "/api/pagos",
        titulo: "Registros de pagos", subtitulo: "Pagos realizados a proveedores y otros conceptos (los pagos a trabajadores están en su propia sección).",
        singular: "pago", nuevo: "Nuevo",
        alcance: function (fila) { return !decodificarTrabajador(fila.concepto); },
        campos: [
            { name: "concepto", label: "Concepto", type: "text", required: true, full: true },
            fMonto(), fFecha("fecha", "Fecha"), fMetodo,
            { name: "estado", label: "Estado", type: "select", required: true, options: ESTADOS, default: "PAGADA" }
        ],
        columnas: [cFecha("fecha", "Fecha"), cTexto("concepto", "Concepto"), cTexto("metodoPago", "Método"),
            cMonto(), cEstado],
        acciones: [ACCION_PAGADA],
        totalKey: "monto", totalEtiqueta: "Total pagos"
    },

    {
        id: "pagos-trabajadores", etiqueta: "👷 Pagos a trabajadores", tipo: "crud", endpoint: "/api/pagos",
        titulo: "Pagos a trabajadores", subtitulo: "Sueldos, bonos y otros pagos al personal registrado en RRHH.",
        singular: "pago a trabajador", nuevo: "Nuevo",
        alcance: function (fila) { return !!decodificarTrabajador(fila.concepto); },
        preparar: function () { return cargarDep("trabajadores"); },
        campos: [
            { name: "trabajador", label: "Trabajador", type: "trabajador", required: true, virtual: true, full: true },
            { name: "detalle", label: "Concepto del pago", type: "text", required: true, virtual: true, full: true, placeholder: "Ej. Sueldo de noviembre" },
            fMonto(), fFecha("fecha", "Fecha de pago"), fMetodo,
            { name: "estado", label: "Estado", type: "select", required: true, options: ESTADOS, default: "PAGADA" }
        ],
        desdeFila: function (r) {
            const d = decodificarTrabajador(r.concepto) || { id: 0, nombre: "", texto: r.concepto };
            return Object.assign({}, r, { trabajador: { id: d.id, nombre: d.nombre }, detalle: d.texto });
        },
        aPayload: function (v) {
            return {
                concepto: codificarTrabajador(v.trabajador.id, v.trabajador.nombre, v.detalle),
                monto: v.monto, fecha: v.fecha, metodoPago: v.metodoPago, estado: v.estado
            };
        },
        columnas: [cFecha("fecha", "Fecha"), cTrabajador("concepto"),
            { key: "detalle", label: "Concepto", render: function (r) { const d = decodificarTrabajador(r.concepto); return esc(d ? d.texto || "—" : "—"); } },
            cTexto("metodoPago", "Método"), cMonto(), cEstado],
        acciones: [ACCION_PAGADA],
        totalKey: "monto", totalEtiqueta: "Total pagado a trabajadores",
        info: function () { return infoTrabajadores(); }
    },

    {
        id: "facturas", etiqueta: "📑 Facturas", tipo: "crud", endpoint: "/api/facturas",
        titulo: "Facturas", subtitulo: "Facturas de trabajadores y facturas emitidas a clientes.",
        singular: "factura", nuevo: "Nueva",
        preparar: function () { return cargarDep("trabajadores"); },
        filtros: [{
            id: "tipo", etiqueta: "Tipo de factura",
            opciones: [
                { value: "", label: "Todas" },
                { value: "TRABAJADOR", label: "De trabajadores" },
                { value: "CLIENTE", label: "A clientes" }
            ],
            prueba: function (fila, valor) {
                const esTrabajador = !!decodificarTrabajador(fila.cliente);
                return valor === "TRABAJADOR" ? esTrabajador : !esTrabajador;
            }
        }],
        campos: [
            {
                name: "tipoFactura", label: "Tipo de factura", type: "select", required: true, virtual: true, full: true,
                options: [
                    { value: "TRABAJADOR", label: "Factura de un trabajador" },
                    { value: "CLIENTE", label: "Factura emitida a un cliente" }
                ],
                default: "TRABAJADOR"
            },
            {
                name: "trabajador", label: "Trabajador", type: "trabajador", required: true, virtual: true, full: true,
                mostrarSi: function (v) { return v.tipoFactura === "TRABAJADOR"; }
            },
            {
                name: "cliente", label: "Cliente", type: "text", required: true, virtual: true, full: true,
                mostrarSi: function (v) { return v.tipoFactura === "CLIENTE"; }
            },
            { name: "numero", label: "Número de factura", type: "text", required: true, placeholder: "Ej. F001-00001" },
            fFecha("fecha", "Fecha de emisión"),
            { name: "servicio", label: "Servicio o detalle", type: "text", datalist: "servicios", full: true, placeholder: "Ej. Mantenimiento de equipos" },
            fMonto(), fEstado
        ],
        desdeFila: function (r) {
            const d = decodificarTrabajador(r.cliente);
            return Object.assign({}, r, {
                tipoFactura: d ? "TRABAJADOR" : "CLIENTE",
                trabajador: d ? { id: d.id, nombre: d.nombre } : null,
                cliente: d ? "" : r.cliente
            });
        },
        aPayload: function (v) {
            return {
                numero: v.numero, servicio: v.servicio, monto: v.monto, fecha: v.fecha, estado: v.estado,
                cliente: v.tipoFactura === "TRABAJADOR"
                    ? codificarTrabajador(v.trabajador.id, v.trabajador.nombre, "")
                    : v.cliente
            };
        },
        columnas: [
            cTexto("numero", "N.º"), cFecha("fecha", "Fecha"),
            {
                key: "tipo", label: "Tipo",
                render: function (r) {
                    return decodificarTrabajador(r.cliente)
                        ? '<span class="adm-badge adm-badge-info">Trabajador</span>'
                        : '<span class="adm-badge adm-badge-warn">Cliente</span>';
                }
            },
            { key: "cliente", label: "Trabajador / Cliente", render: function (r) { return cTrabajador("cliente").render(r); } },
            cTexto("servicio", "Servicio"), cMonto(), cEstado
        ],
        acciones: [ACCION_PAGADA],
        totalKey: "monto", totalEtiqueta: "Total facturado"
    },

    {
        id: "cuentas-por-pagar", etiqueta: "📤 Cuentas por pagar", tipo: "crud", endpoint: "/api/cuentas-por-pagar",
        titulo: "Cuentas por pagar", subtitulo: "Obligaciones de pago con proveedores y sus vencimientos.",
        singular: "cuenta por pagar", nuevo: "Nueva",
        campos: [
            { name: "proveedor", label: "Proveedor", type: "text", required: true, full: true },
            fMonto(), fEstado,
            fFecha("fechaEmision", "Fecha de emisión", 0),
            fFecha("fechaVencimiento", "Fecha de vencimiento", 30)
        ],
        validar: validarFechas,
        columnas: [cTexto("proveedor", "Proveedor"), cMonto(), cFecha("fechaEmision", "Emisión"),
            cFecha("fechaVencimiento", "Vencimiento"), cEstado, cMora],
        acciones: [ACCION_PAGADA],
        totalKey: "monto", totalEtiqueta: "Total por pagar"
    },

    {
        id: "costos-mantenimiento", etiqueta: "🔧 Costos de mantenimiento", tipo: "crud", endpoint: "/api/costos",
        consulta: "?tipo=MANTENIMIENTO",
        titulo: "Costos de mantenimiento", subtitulo: "Gastos de mantenimiento, con vínculo opcional a las órdenes de trabajo de Operaciones.",
        singular: "costo de mantenimiento", nuevo: "Nuevo",
        preparar: function () { return cargarDep("ordenes"); },
        campos: [
            {
                name: "orden", label: "Orden de trabajo (opcional)", type: "select", virtual: true, full: true,
                opcionesFn: opcionesOrdenes, vacio: "Sin orden de trabajo",
                ayudaInicial: function () {
                    return deps.ordenes.lista ? "Al elegir una orden se completan la descripción y el servicio."
                        : "⚠️ No se pudo leer Operaciones: " + deps.ordenes.error;
                }
            },
            { name: "descripcion", label: "Descripción", type: "text", required: true, full: true },
            fMonto(), fFecha("fecha", "Fecha"), fServicio
        ],
        aPayload: function (v) {
            return { tipo: "MANTENIMIENTO", descripcion: v.descripcion, monto: v.monto, fecha: v.fecha, servicio: v.servicio };
        },
        alCambiar: function (nombre, ctx) {
            if (nombre !== "orden") return;

            const o = ordenPorId(ctx.get("orden"));
            if (!o) return;

            const descripcion = "OT " + (o.codigo || o.id) + " · " + (o.tipoMantenimientoNombre || "Mantenimiento") +
                (o.equipoDescripcion ? " · " + o.equipoDescripcion : "");

            if (!ctx.get("descripcion") || ctx.esAuto("descripcion")) ctx.set("descripcion", descripcion, { auto: true });
            if (o.tipoMantenimientoNombre && (!ctx.get("servicio") || ctx.esAuto("servicio"))) {
                ctx.set("servicio", o.tipoMantenimientoNombre, { auto: true });
            }
        },
        columnas: [cFecha("fecha", "Fecha"), cTexto("descripcion", "Descripción"), cTexto("servicio", "Servicio"), cMonto()],
        totalKey: "monto", totalEtiqueta: "Total mantenimiento"
    },

    {
        id: "costos-materiales", etiqueta: "📦 Costos de materiales", tipo: "crud", endpoint: "/api/costos",
        consulta: "?tipo=MATERIALES",
        titulo: "Costos de materiales", subtitulo: "Compra y consumo de materiales, calculados con los precios del Almacén.",
        singular: "costo de materiales", nuevo: "Nuevo",
        preparar: function () { return cargarDep("productos"); },
        campos: [
            {
                name: "producto", label: "Producto del almacén (opcional)", type: "select", virtual: true, full: true,
                opcionesFn: opcionesProductos, vacio: "Sin producto (ingreso manual)",
                ayudaInicial: function () {
                    return deps.productos.lista ? "" : "⚠️ No se pudo leer Almacén: " + deps.productos.error;
                }
            },
            {
                name: "cantidad", label: "Cantidad", type: "number", virtual: true, step: "1",
                min: 0, minExclusive: true, minMessage: "La cantidad debe ser mayor a cero.", placeholder: "0"
            },
            fMonto(),
            { name: "descripcion", label: "Descripción", type: "text", required: true, full: true },
            fFecha("fecha", "Fecha"), fServicio
        ],
        aPayload: function (v) {
            return { tipo: "MATERIALES", descripcion: v.descripcion, monto: v.monto, fecha: v.fecha, servicio: v.servicio };
        },
        alCambiar: function (nombre, ctx) {
            if (nombre !== "producto" && nombre !== "cantidad") return;

            const p = productoPorId(ctx.get("producto"));
            if (!p) {
                ctx.ayuda("producto", deps.productos.lista ? "" : "⚠️ No se pudo leer Almacén: " + deps.productos.error);
                return;
            }

            ctx.ayuda("producto", "Precio unitario: " + money(p.precioUnitario) + " · Stock actual: " +
                num(p.stockActual) + " " + (p.unidadMedida || ""));

            const cantidad = Number(ctx.get("cantidad"));
            if (cantidad > 0) {
                ctx.set("monto", (cantidad * num(p.precioUnitario)).toFixed(2));

                const descripcion = "Almacén · " + (p.codigo ? p.codigo + " – " : "") + p.nombre +
                    " × " + cantidad + " " + (p.unidadMedida || "");
                if (!ctx.get("descripcion") || ctx.esAuto("descripcion")) ctx.set("descripcion", descripcion, { auto: true });
            }
        },
        columnas: [cFecha("fecha", "Fecha"), cTexto("descripcion", "Descripción"), cTexto("servicio", "Servicio"), cMonto()],
        totalKey: "monto", totalEtiqueta: "Total materiales",
        info: function () { return infoAlmacen(); }
    }
];

/* =========================================================
   PANELES INFORMATIVOS (datos de RRHH y Almacén)
========================================================= */

function itemInfo(etiqueta, valor) {
    return '<div class="adm-info-item"><span>' + esc(etiqueta) + "</span><strong>" + esc(valor) + "</strong></div>";
}

async function infoTrabajadores() {
    const d = await cargarDep("trabajadores");

    if (!d.lista) {
        return '<p class="adm-info-nota">⚠️ No se pudo leer la lista de trabajadores de RRHH: ' + esc(d.error) +
            " Los trabajadores se escribirán manualmente.</p>";
    }

    const activos = d.lista.filter(function (t) { return String(t.estado || "").toUpperCase() === "ACTIVO"; }).length;
    return itemInfo("Trabajadores en RRHH", String(d.lista.length)) + itemInfo("Trabajadores activos", String(activos));
}

async function infoAlmacen() {
    const resultados = await Promise.allSettled([
        cargarDep("productos"),
        api(RUTAS.stockBajo),
        api(RUTAS.movimientos)
    ]);

    let html = "";
    const productos = deps.productos.lista;

    if (productos) {
        const valor = productos.filter(function (p) { return p.estado !== false; })
            .reduce(function (acc, p) { return acc + num(p.stockActual) * num(p.precioUnitario); }, 0);
        html += itemInfo("Inventario valorizado", money(valor)) + itemInfo("Productos en almacén", String(productos.length));
    }

    if (resultados[1].status === "fulfilled" && Array.isArray(resultados[1].value)) {
        const bajos = resultados[1].value;
        const reposicion = bajos.reduce(function (acc, p) { return acc + num(p.cantidadFaltante) * num(p.precioUnitario); }, 0);
        html += itemInfo("Productos con stock bajo", String(bajos.length)) + itemInfo("Reposición estimada", money(reposicion));
    }

    if (resultados[2].status === "fulfilled" && Array.isArray(resultados[2].value)) {
        const salidas = resultados[2].value.filter(function (m) { return m.tipoMovimiento === "SALIDA"; });
        const consumo = salidas.reduce(function (acc, m) {
            const p = m.producto || {};
            const precio = p.precioUnitario != null ? p.precioUnitario : (productoPorId(p.id) || {}).precioUnitario;
            return acc + num(m.cantidad) * num(precio);
        }, 0);
        html += itemInfo("Consumo de almacén (salidas)", money(consumo));
    }

    if (!html) {
        return '<p class="adm-info-nota">⚠️ No se pudo leer el Almacén: ' + esc(deps.productos.error) + "</p>";
    }

    return html;
}

/* =========================================================
   FORMULARIOS
========================================================= */

function campoHTML(f, valor) {
    const id = "c-" + f.name;
    const requerido = f.required ? ' <span class="adm-requerido" aria-hidden="true">*</span>' : "";
    const clases = "adm-campo" + (f.full ? " completo" : "") + (f.type === "checkbox" ? " adm-campo-check" : "");
    const ayuda = f.ayudaInicial ? f.ayudaInicial() : "";

    let control;

    if (f.type === "checkbox") {
        return '<div class="' + clases + '" data-campo="' + f.name + '"><label for="' + id + '">' +
            '<input type="checkbox" id="' + id + '" name="' + f.name + '"' + (valor ? " checked" : "") + ">" +
            "<span>" + esc(f.label) + "</span></label></div>";
    }

    if (f.type === "select") {
        const opciones = (f.opcionesFn ? f.opcionesFn() : f.options).slice();
        if (valor && !opciones.some(function (o) { return String(o.value) === String(valor); })) {
            opciones.push({ value: valor, label: String(valor) });
        }
        const vacio = f.required ? "" : '<option value="">' + esc(f.vacio || "—") + "</option>";
        control = '<select id="' + id + '" name="' + f.name + '">' + vacio +
            opciones.map(function (o) {
                return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(valor) ? " selected" : "") + ">" + esc(o.label) + "</option>";
            }).join("") + "</select>";
    } else if (f.type === "trabajador") {
        const lista = deps.trabajadores.lista;

        if (lista) {
            const ordenados = lista.slice().sort(function (a, b) { return comparar(a.nombres, b.nombres); });
            let extra = "";

            if (valor && valor.id && !lista.some(function (t) { return Number(t.id) === Number(valor.id); })) {
                extra = '<option value="' + esc(valor.id) + '" data-nombre="' + esc(valor.nombre) + '" selected>' +
                    esc(valor.nombre) + " (no registrado)</option>";
            }

            control = '<select id="' + id + '" name="' + f.name + '"><option value="">Selecciona un trabajador</option>' + extra +
                ordenados.map(function (t) {
                    const seleccionado = valor && Number(valor.id) === Number(t.id) ? " selected" : "";
                    const cesado = String(t.estado || "").toUpperCase() === "ACTIVO" ? "" : " (cesado)";
                    return '<option value="' + esc(t.id) + '" data-nombre="' + esc(t.nombres) + '"' + seleccionado + ">" +
                        esc(t.nombres) + (t.cargo ? " — " + esc(t.cargo) : "") + esc(cesado) + "</option>";
                }).join("") + "</select>";
        } else {
            control = '<input id="' + id + '" name="' + f.name + '" type="text" value="' + esc(valor ? valor.nombre : "") +
                '" placeholder="Nombre del trabajador">';
        }
    } else {
        control = '<input id="' + id + '" name="' + f.name + '" type="' + f.type + '"' +
            ' value="' + esc(valor == null ? "" : valor) + '"' +
            (f.step ? ' step="' + f.step + '"' : "") +
            (f.type === "number" ? ' inputmode="decimal"' : "") +
            (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") +
            (f.datalist ? ' list="dl-' + f.datalist + '" autocomplete="off"' : "") + ">";
    }

    const textoAyuda = f.type === "trabajador" && !deps.trabajadores.lista
        ? "⚠️ No se pudo leer RRHH: " + deps.trabajadores.error + " Escribe el nombre manualmente."
        : ayuda;

    return '<div class="' + clases + '" data-campo="' + f.name + '"><label for="' + id + '">' + esc(f.label) + requerido + "</label>" +
        control +
        '<p class="adm-ayuda" id="h-' + f.name + '">' + esc(textoAyuda) + "</p>" +
        '<p class="adm-campo-error" id="e-' + f.name + '" role="alert"></p></div>';
}

function valorBruto(form, f) {
    const el = form.elements[f.name];
    if (!el) return null;

    if (f.type === "checkbox") return el.checked;

    if (f.type === "trabajador") {
        if (el.tagName === "SELECT") {
            if (!el.value) return null;
            const op = el.selectedOptions[0];
            return { id: Number(el.value), nombre: op ? (op.dataset.nombre || op.textContent) : "" };
        }
        const nombre = el.value.trim();
        return nombre ? { id: 0, nombre: nombre } : null;
    }

    return el.value;
}

function leerFormulario(form, campos) {
    const brutos = {};
    campos.forEach(function (f) { brutos[f.name] = valorBruto(form, f); });

    const data = {};
    const errores = {};

    campos.forEach(function (f) {
        if (f.mostrarSi && !f.mostrarSi(brutos)) return;

        const v = brutos[f.name];

        if (f.type === "checkbox") {
            data[f.name] = !!v;
            return;
        }

        if (f.type === "trabajador") {
            if (!v) {
                if (f.required) errores[f.name] = deps.trabajadores.lista ? "Selecciona un trabajador." : "Escribe el nombre del trabajador.";
                data[f.name] = null;
            } else {
                data[f.name] = v;
            }
            return;
        }

        const texto = String(v == null ? "" : v).trim();

        if (texto === "") {
            if (f.required) errores[f.name] = "Este campo es obligatorio.";
            data[f.name] = null;
            return;
        }

        if (f.type === "number") {
            const n = Number(texto);
            if (!isFinite(n)) {
                errores[f.name] = "Ingresa un número válido.";
            } else if (f.min !== undefined && (f.minExclusive ? n <= f.min : n < f.min)) {
                errores[f.name] = f.minMessage || "El valor debe ser mayor o igual a " + f.min + ".";
            }
            data[f.name] = n;
            return;
        }

        data[f.name] = texto;
    });

    return { data: data, errores: errores, brutos: brutos };
}

function actualizarVisibilidad(form, campos) {
    const brutos = {};
    campos.forEach(function (f) { brutos[f.name] = valorBruto(form, f); });

    campos.forEach(function (f) {
        if (!f.mostrarSi) return;
        const envoltorio = form.querySelector('[data-campo="' + f.name + '"]');
        if (envoltorio) envoltorio.hidden = !f.mostrarSi(brutos);
    });
}

function mostrarErrores(form, errores) {
    form.querySelectorAll(".adm-campo-error").forEach(function (p) { p.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });

    let primero = null;

    Object.keys(errores).forEach(function (nombre) {
        const p = $("#e-" + nombre, form);
        const el = form.elements[nombre];
        if (p) p.textContent = errores[nombre];
        if (el) {
            el.setAttribute("aria-invalid", "true");
            if (!primero) primero = el;
        }
    });

    if (primero) primero.focus();
}

function payloadBasico(campos, data) {
    const payload = {};
    campos.forEach(function (f) {
        if (!f.virtual && Object.prototype.hasOwnProperty.call(data, f.name)) payload[f.name] = data[f.name];
    });
    return payload;
}

let abriendoFormulario = false;

async function abrirFormulario(mod, fila, alGuardar) {
    if (abriendoFormulario) return;
    abriendoFormulario = true;

    try {
        if (mod.preparar) {
            try { await mod.preparar(); } catch (e) { /* el formulario funciona sin datos externos */ }
        }

        const editando = !!fila;
        const iniciales = editando ? (mod.desdeFila ? mod.desdeFila(fila) : fila) : {};

        const camposHTML = mod.campos.map(function (f) {
            const valor = editando ? iniciales[f.name] : (typeof f.default === "function" ? f.default() : f.default);
            return campoHTML(f, valor);
        }).join("");

        const datalist = '<datalist id="dl-servicios">' +
            Array.from(state.servicios).sort().map(function (s) { return '<option value="' + esc(s) + '">'; }).join("") +
            "</datalist>";

        abrirModal(
            '<h2 id="admModalTitulo">' + esc(editando ? "Editar " + mod.singular : mod.nuevo + " " + mod.singular) + "</h2>" +
            '<form id="admForm" novalidate><div class="adm-form-grid">' + camposHTML + "</div>" + datalist +
            '<div class="adm-modal-acciones">' +
            '<button type="button" class="adm-boton adm-boton-secundario" data-acc="cancelar">Cancelar</button>' +
            '<button type="submit" class="adm-boton adm-boton-principal" id="admGuardar">Guardar</button>' +
            "</div></form>"
        );

        const form = $("#admForm");
        const botonGuardar = $("#admGuardar");

        actualizarVisibilidad(form, mod.campos);

        const ctx = {
            get: function (n) {
                const el = form.elements[n];
                if (!el) return "";
                return el.type === "checkbox" ? el.checked : el.value;
            },
            set: function (n, v, opciones) {
                const el = form.elements[n];
                if (!el) return;
                el.value = v;
                if (opciones && opciones.auto) el.dataset.auto = "1";
            },
            esAuto: function (n) {
                const el = form.elements[n];
                return !!(el && el.dataset.auto === "1");
            },
            ayuda: function (n, texto) {
                const p = $("#h-" + n, form);
                if (p) p.textContent = texto || "";
            }
        };

        function alCambiarCampo(e) {
            const destino = e.target;
            if (!destino || !destino.name) return;

            if (e.type === "input" && destino.dataset) delete destino.dataset.auto;

            actualizarVisibilidad(form, mod.campos);
            if (mod.alCambiar) mod.alCambiar(destino.name, ctx);
        }

        form.addEventListener("input", alCambiarCampo);
        form.addEventListener("change", alCambiarCampo);

        $('[data-acc="cancelar"]').addEventListener("click", cerrarModal);

        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const resultado = leerFormulario(form, mod.campos);
            const extra = mod.validar ? mod.validar(resultado.data) : {};

            Object.keys(extra).forEach(function (k) {
                if (!resultado.errores[k]) resultado.errores[k] = extra[k];
            });

            mostrarErrores(form, resultado.errores);
            if (Object.keys(resultado.errores).length) return;

            const payload = mod.aPayload ? mod.aPayload(resultado.data, fila) : payloadBasico(mod.campos, resultado.data);

            botonGuardar.disabled = true;
            botonGuardar.textContent = "Guardando…";

            try {
                if (editando) {
                    await api(mod.endpoint + "/" + fila.id, { method: "PUT", body: JSON.stringify(payload) });
                } else {
                    await api(mod.endpoint, { method: "POST", body: JSON.stringify(payload) });
                }

                cerrarModal();
                toast(editando ? "Registro actualizado." : "Registro creado.");
                await alGuardar();
                cargarKpis();
            } catch (err) {
                toast(err.message, "error");
                botonGuardar.disabled = false;
                botonGuardar.textContent = "Guardar";
            }
        });

        const primerCampo = form.querySelector("input:not([type=hidden]), select");
        if (primerCampo) primerCampo.focus();
    } finally {
        abriendoFormulario = false;
    }
}

/* =========================================================
   VISTA GENÉRICA DE REGISTROS (TABLA + FORMULARIO)
========================================================= */

function estadoError(mensaje) {
    return '<div class="adm-estado-error" role="alert"><p><strong>No se pudo cargar la información.</strong></p>' +
        "<p>" + esc(mensaje) + "</p>" +
        '<button type="button" class="adm-boton adm-boton-principal" id="admReintentar">Reintentar</button></div>';
}

function celda(col, fila) {
    if (col.render) return col.render(fila);
    const v = fila[col.key];
    return v == null || v === "" ? "—" : esc(v);
}

function renderCrud(mod) {
    const token = routeToken;
    const panel = $("#admPanel");

    if (!state.cruds[mod.id]) state.cruds[mod.id] = { filas: [], q: "", filtros: {} };
    const st = state.cruds[mod.id];

    const filtrosHTML = (mod.filtros || []).map(function (f) {
        return '<div class="adm-filtro"><label for="flt-' + f.id + '">' + esc(f.etiqueta) + "</label>" +
            '<select id="flt-' + f.id + '" data-filtro="' + f.id + '">' +
            f.opciones.map(function (o) {
                return '<option value="' + esc(o.value) + '"' + ((st.filtros[f.id] || "") === o.value ? " selected" : "") + ">" + esc(o.label) + "</option>";
            }).join("") + "</select></div>";
    }).join("");

    panel.innerHTML =
        '<div class="adm-encabezado"><div><h2>' + esc(mod.titulo) + "</h2><p>" + esc(mod.subtitulo) + "</p></div>" +
        '<div class="adm-acciones"><button type="button" class="adm-boton adm-boton-principal" id="admNuevo">+ ' +
        esc(mod.nuevo + " " + mod.singular) + "</button></div></div>" +
        '<div class="adm-info" id="admInfo" hidden></div>' +
        '<div class="adm-barra"><div class="adm-filtro adm-filtro-buscar"><label for="admBuscar">Buscar</label>' +
        '<input id="admBuscar" type="search" placeholder="Buscar en la tabla…" value="' + esc(st.q) + '"></div>' +
        filtrosHTML + '<span class="adm-contador" id="admContador"></span></div>' +
        '<div id="admTabla"><p class="adm-vacio">Cargando…</p></div>';

    const tabla = $("#admTabla");

    function pintar() {
        const q = st.q.trim().toLowerCase();
        let filas = st.filas.slice().sort(function (a, b) { return num(b.id) - num(a.id); });

        (mod.filtros || []).forEach(function (f) {
            const valor = st.filtros[f.id];
            if (valor) filas = filas.filter(function (r) { return f.prueba(r, valor); });
        });

        if (q) {
            filas = filas.filter(function (r) {
                return Object.keys(r).some(function (k) {
                    return r[k] != null && String(r[k]).toLowerCase().indexOf(q) !== -1;
                });
            });
        }

        $("#admContador").textContent = filas.length + (filas.length === 1 ? " registro" : " registros");

        if (!filas.length) {
            tabla.innerHTML = '<p class="adm-vacio">' + (st.filas.length
                ? "No hay resultados con los filtros seleccionados."
                : "Todavía no hay registros. Usa “+ " + esc(mod.nuevo + " " + mod.singular) + "” para crear el primero.") + "</p>";
            return;
        }

        const cabecera = mod.columnas.map(function (c) {
            return '<th scope="col"' + (c.align === "right" ? ' class="num"' : "") + ">" + esc(c.label) + "</th>";
        }).join("") + '<th scope="col" class="acciones">Acciones</th>';

        const cuerpo = filas.map(function (r) {
            const celdas = mod.columnas.map(function (c) {
                return "<td" + (c.align === "right" ? ' class="num"' : "") + ">" + celda(c, r) + "</td>";
            }).join("");

            const extras = (mod.acciones || []).filter(function (a) { return a.cuando(r); }).map(function (a) {
                return '<button type="button" class="adm-boton adm-boton-secundario adm-boton-peq" data-accion="' + a.id +
                    '" data-id="' + esc(r.id) + '">' + esc(a.etiqueta(r)) + "</button>";
            }).join("");

            return "<tr>" + celdas + '<td class="acciones"><div class="adm-acciones-fila">' + extras +
                '<button type="button" class="adm-boton adm-boton-secundario adm-boton-peq" data-accion="editar" data-id="' + esc(r.id) + '">Editar</button>' +
                '<button type="button" class="adm-boton adm-boton-peligro adm-boton-peq" data-accion="eliminar" data-id="' + esc(r.id) + '">Eliminar</button>' +
                "</div></td></tr>";
        }).join("");

        let total = "";
        if (mod.totalKey) {
            const suma = filas.reduce(function (acc, r) { return acc + num(r[mod.totalKey]); }, 0);
            total = '<p class="adm-total">' + esc(mod.totalEtiqueta || "Total") + ": <strong>" + esc(money(suma)) + "</strong></p>";
        }

        tabla.innerHTML = '<div class="adm-tabla-wrap"><table class="adm-tabla"><thead><tr>' + cabecera +
            "</tr></thead><tbody>" + cuerpo + "</tbody></table></div>" + total;
    }

    async function cargar() {
        tabla.innerHTML = '<p class="adm-vacio">Cargando…</p>';

        try {
            const resultados = await Promise.all([
                api(mod.endpoint + (mod.consulta || "")),
                mod.preparar ? mod.preparar().catch(function () { return null; }) : null
            ]);

            if (token !== routeToken) return;

            const datos = Array.isArray(resultados[0]) ? resultados[0] : [];
            st.filas = mod.alcance ? datos.filter(mod.alcance) : datos;
            recolectarServicios(st.filas);
            pintar();

            if (mod.info) {
                mod.info().then(function (html) {
                    const info = $("#admInfo");
                    if (token === routeToken && info && html) {
                        info.innerHTML = html;
                        info.hidden = false;
                    }
                }).catch(function () { /* el panel informativo es opcional */ });
            }
        } catch (err) {
            if (token !== routeToken) return;
            $("#admContador").textContent = "";
            tabla.innerHTML = estadoError(err.message);
            $("#admReintentar").addEventListener("click", cargar);
        }
    }

    $("#admBuscar").addEventListener("input", function (e) {
        st.q = e.target.value;
        if (st.filas.length) pintar();
    });

    panel.querySelectorAll("[data-filtro]").forEach(function (sel) {
        sel.addEventListener("change", function (e) {
            st.filtros[e.target.dataset.filtro] = e.target.value;
            if (st.filas.length) pintar();
        });
    });

    $("#admNuevo").addEventListener("click", function () { abrirFormulario(mod, null, cargar); });

    tabla.addEventListener("click", async function (e) {
        const boton = e.target.closest("[data-accion]");
        if (!boton) return;

        const fila = st.filas.find(function (r) { return String(r.id) === boton.dataset.id; });
        if (!fila) return;

        const accion = boton.dataset.accion;

        if (accion === "editar") {
            abrirFormulario(mod, fila, cargar);
            return;
        }

        if (accion === "eliminar") {
            const ok = await confirmar("¿Eliminar este registro? Esta acción no se puede deshacer.");
            if (!ok) return;

            try {
                await api(mod.endpoint + "/" + fila.id, { method: "DELETE" });
                toast("Registro eliminado.");
                await cargar();
                cargarKpis();
            } catch (err) {
                toast(err.message, "error");
            }
            return;
        }

        const personalizada = (mod.acciones || []).find(function (a) { return a.id === accion; });
        if (personalizada) {
            try {
                const payload = Object.assign({}, fila, personalizada.cambios(fila));
                await api(mod.endpoint + "/" + fila.id, { method: "PUT", body: JSON.stringify(payload) });
                toast(personalizada.mensaje);
                await cargar();
                cargarKpis();
            } catch (err) {
                toast(err.message, "error");
            }
        }
    });

    cargar();
}

/* =========================================================
   REPORTES FINANCIEROS
========================================================= */

function resultadoOk(r) {
    return r.status === "fulfilled";
}

function mensajeError(r) {
    return r.reason && r.reason.message ? r.reason.message : "Error desconocido.";
}

function bloqueReporte(titulo, subtitulo, contenido) {
    return '<div class="adm-reporte-bloque"><h3>' + esc(titulo) + "</h3><p>" + esc(subtitulo) + "</p>" + contenido + "</div>";
}

function errorSeccion(r) {
    return '<p class="adm-error-seccion">⚠️ No se pudo cargar esta información: ' + esc(mensajeError(r)) + "</p>";
}

function agruparTrabajadores(pagos, facturas) {
    const mapa = new Map();

    function entrada(d) {
        const clave = d.id > 0 ? "id:" + d.id : "n:" + d.nombre.trim().toLowerCase();

        if (!mapa.has(clave)) {
            const t = trabajadorPorId(d.id);
            mapa.set(clave, {
                nombre: t ? t.nombres : d.nombre, cargo: t ? t.cargo : "",
                pagos: 0, totalPagos: 0, pendiente: 0, facturas: 0, totalFacturas: 0
            });
        }
        return mapa.get(clave);
    }

    pagos.forEach(function (p) {
        const d = decodificarTrabajador(p.concepto);
        if (!d) return;
        const e = entrada(d);
        e.pagos++;
        e.totalPagos += num(p.monto);
        if (p.estado !== "PAGADA") e.pendiente += num(p.monto);
    });

    facturas.forEach(function (f) {
        const d = decodificarTrabajador(f.cliente);
        if (!d) return;
        const e = entrada(d);
        e.facturas++;
        e.totalFacturas += num(f.monto);
    });

    return Array.from(mapa.values()).sort(function (a, b) { return b.totalPagos - a.totalPagos; });
}

async function renderReportes() {
    const token = routeToken;
    const panel = $("#admPanel");
    panel.innerHTML = '<p class="adm-vacio">Cargando reportes…</p>';

    const r = await Promise.allSettled([
        api(RUTAS.resumen),
        api(RUTAS.rentabilidad),
        api("/api/pagos"),
        api("/api/facturas"),
        cargarDep("trabajadores"),
        cargarDep("productos"),
        api(RUTAS.stockBajo)
    ]);

    if (token !== routeToken) return;

    const pagos = resultadoOk(r[2]) && Array.isArray(r[2].value) ? r[2].value : null;
    const facturas = resultadoOk(r[3]) && Array.isArray(r[3].value) ? r[3].value : null;

    /* 1. Ingresos, gastos y costos */
    let bloqueResumen;
    if (resultadoOk(r[0])) {
        const res = r[0].value || {};
        const pagosTrab = pagos
            ? pagos.filter(function (p) { return decodificarTrabajador(p.concepto); })
                .reduce(function (acc, p) { return acc + num(p.monto); }, 0)
            : null;

        const barras = [
            { etiqueta: "Ingresos", valor: num(res.totalIngresos), clase: "ingreso" },
            { etiqueta: "Gastos", valor: num(res.totalGastos), clase: "egreso" },
            { etiqueta: "Costos de mantenimiento", valor: num(res.totalCostosMantenimiento), clase: "egreso" },
            { etiqueta: "Costos de materiales", valor: num(res.totalCostosMateriales), clase: "egreso" },
            { etiqueta: "Costos de mano de obra", valor: num(res.totalCostosManoObra), clase: "egreso" }
        ];

        if (pagosTrab !== null) barras.push({ etiqueta: "Pagos a trabajadores", valor: pagosTrab, clase: "egreso" });

        const maximo = Math.max.apply(null, barras.map(function (b) { return b.valor; }).concat([1]));

        const barrasHTML = '<div class="adm-barras">' + barras.map(function (b) {
            return '<div class="adm-barra-fila"><span>' + esc(b.etiqueta) + "</span>" +
                '<div class="adm-barra-pista"><div class="adm-barra-relleno ' + b.clase + '" style="width:' + (b.valor / maximo * 100).toFixed(1) + '%"></div></div>' +
                '<span class="adm-barra-valor">' + esc(money(b.valor)) + "</span></div>";
        }).join("") + "</div>";

        const balance = num(res.balance);
        const pie = '<p class="adm-total">Balance (ingresos − gastos − costos): <strong class="' +
            (balance >= 0 ? "adm-positivo-texto" : "adm-negativo-texto") + '">' + esc(money(balance)) + "</strong></p>" +
            '<p class="adm-total">Por cobrar: <strong>' + esc(money(res.totalPorCobrar)) + "</strong> · Por pagar: <strong>" +
            esc(money(res.totalPorPagar)) + "</strong></p>";

        bloqueResumen = barrasHTML + pie;
    } else {
        bloqueResumen = errorSeccion(r[0]);
    }

    /* 2. Rentabilidad por servicio */
    let bloqueRent;
    if (resultadoOk(r[1])) {
        const lista = (Array.isArray(r[1].value) ? r[1].value : []).slice()
            .sort(function (a, b) { return num(b.rentabilidad) - num(a.rentabilidad); });

        if (!lista.length) {
            bloqueRent = '<p class="adm-vacio">Aún no hay ingresos con servicio asignado para calcular la rentabilidad.</p>';
        } else {
            bloqueRent = '<div class="adm-tabla-wrap"><table class="adm-tabla"><thead><tr>' +
                '<th scope="col">Servicio</th><th scope="col" class="num">Ingresos</th><th scope="col" class="num">Costos</th>' +
                '<th scope="col" class="num">Rentabilidad</th><th scope="col" class="num">Margen</th></tr></thead><tbody>' +
                lista.map(function (s) {
                    const ingresos = num(s.ingresos);
                    const rent = num(s.rentabilidad);
                    const margen = ingresos > 0 ? (rent / ingresos * 100).toFixed(1) + " %" : "—";
                    return "<tr><td>" + esc(s.servicio) + '</td><td class="num">' + esc(money(ingresos)) +
                        '</td><td class="num">' + esc(money(s.costos)) +
                        '</td><td class="num"><span class="' + (rent >= 0 ? "adm-positivo-texto" : "adm-negativo-texto") + '">' + esc(money(rent)) +
                        '</span></td><td class="num">' + esc(margen) + "</td></tr>";
                }).join("") + "</tbody></table></div>";
        }
    } else {
        bloqueRent = errorSeccion(r[1]);
    }

    /* 3. Trabajadores: pagos y facturas */
    let bloqueTrab;
    if (pagos && facturas) {
        const grupos = agruparTrabajadores(pagos, facturas);

        if (!grupos.length) {
            bloqueTrab = '<p class="adm-vacio">Aún no hay pagos ni facturas de trabajadores registrados.</p>';
        } else {
            const tot = grupos.reduce(function (a, g) {
                return { pagos: a.pagos + g.totalPagos, pendiente: a.pendiente + g.pendiente, facturas: a.facturas + g.totalFacturas };
            }, { pagos: 0, pendiente: 0, facturas: 0 });

            bloqueTrab = '<div class="adm-tabla-wrap"><table class="adm-tabla"><thead><tr>' +
                '<th scope="col">Trabajador</th><th scope="col" class="num">Pagos</th><th scope="col" class="num">Total pagado</th>' +
                '<th scope="col" class="num">Pendiente</th><th scope="col" class="num">Facturas</th><th scope="col" class="num">Total facturado</th>' +
                "</tr></thead><tbody>" +
                grupos.map(function (g) {
                    return "<tr><td><strong>" + esc(g.nombre || "—") + "</strong>" +
                        (g.cargo ? '<br><span class="adm-sec">' + esc(g.cargo) + "</span>" : "") +
                        '</td><td class="num">' + g.pagos + '</td><td class="num">' + esc(money(g.totalPagos)) +
                        '</td><td class="num">' + esc(money(g.pendiente)) + '</td><td class="num">' + g.facturas +
                        '</td><td class="num">' + esc(money(g.totalFacturas)) + "</td></tr>";
                }).join("") +
                '</tbody><tfoot><tr><td>Total</td><td class="num"></td><td class="num">' + esc(money(tot.pagos)) +
                '</td><td class="num">' + esc(money(tot.pendiente)) + '</td><td class="num"></td><td class="num">' +
                esc(money(tot.facturas)) + "</td></tr></tfoot></table></div>";
        }
    } else {
        bloqueTrab = errorSeccion(!pagos ? r[2] : r[3]);
    }

    /* 4. Almacén */
    let bloqueAlmacen;
    const productos = deps.productos.lista;
    if (productos) {
        const valor = productos.filter(function (p) { return p.estado !== false; })
            .reduce(function (acc, p) { return acc + num(p.stockActual) * num(p.precioUnitario); }, 0);

        let items = itemInfo("Productos en almacén", String(productos.length)) + itemInfo("Inventario valorizado", money(valor));

        if (resultadoOk(r[6]) && Array.isArray(r[6].value)) {
            const reposicion = r[6].value.reduce(function (acc, p) { return acc + num(p.cantidadFaltante) * num(p.precioUnitario); }, 0);
            items += itemInfo("Productos con stock bajo", String(r[6].value.length)) + itemInfo("Reposición estimada", money(reposicion));
        }

        bloqueAlmacen = '<div class="adm-info">' + items + "</div>";
    } else {
        bloqueAlmacen = '<p class="adm-error-seccion">⚠️ No se pudo leer el Almacén: ' + esc(deps.productos.error) + "</p>";
    }

    panel.innerHTML =
        '<div class="adm-encabezado"><div><h2>Reportes financieros</h2>' +
        "<p>Resumen general del estado financiero, con datos de RRHH y Almacén.</p></div>" +
        '<div class="adm-acciones"><button type="button" class="adm-boton adm-boton-secundario" id="admActualizar">Actualizar</button>' +
        '<button type="button" class="adm-boton adm-boton-principal" id="admImprimir">Imprimir reporte</button></div></div>' +
        bloqueReporte("Ingresos, gastos y costos", "Totales registrados en el sistema.", bloqueResumen) +
        bloqueReporte("Rentabilidad por servicio", "Ingresos menos los costos asociados a cada servicio.", bloqueRent) +
        bloqueReporte("Trabajadores: pagos y facturas", "Pagos y facturas registrados por trabajador (RRHH).", bloqueTrab) +
        bloqueReporte("Almacén", "Valor del inventario y reposición estimada de materiales.", bloqueAlmacen);

    $("#admImprimir").addEventListener("click", function () { window.print(); });
    $("#admActualizar").addEventListener("click", function () {
        deps.trabajadores.cargado = false;
        deps.productos.cargado = false;
        renderReportes();
        cargarKpis();
    });
}

/* =========================================================
   RESUMEN SUPERIOR
========================================================= */

async function cargarKpis() {
    const ids = ["kpiIngresos", "kpiGastos", "kpiCostos", "kpiPorPagar", "kpiBalance"];
    const tarjeta = $("#tarjetaBalance");

    try {
        const r = await api(RUTAS.resumen);
        const costos = num(r.totalCostosMantenimiento) + num(r.totalCostosMateriales) + num(r.totalCostosManoObra);
        const balance = num(r.balance);

        $("#kpiIngresos").textContent = money(r.totalIngresos);
        $("#kpiGastos").textContent = money(r.totalGastos);
        $("#kpiCostos").textContent = money(costos);
        $("#kpiPorPagar").textContent = money(r.totalPorPagar);
        $("#kpiBalance").textContent = money(balance);

        tarjeta.classList.toggle("adm-positivo", balance >= 0);
        tarjeta.classList.toggle("adm-negativo", balance < 0);
    } catch (e) {
        ids.forEach(function (id) { $("#" + id).textContent = "—"; });
        tarjeta.classList.remove("adm-positivo", "adm-negativo");
    }
}

/* =========================================================
   NAVEGACIÓN POR PESTAÑAS
========================================================= */

function construirPestanas() {
    const barra = $("#admPestanas");

    barra.innerHTML = MODULOS.map(function (m) {
        return '<button type="button" class="adm-pestana" role="tab" id="pestana-' + m.id + '" data-id="' + m.id +
            '" aria-selected="false" aria-controls="admPanel" tabindex="-1">' + esc(m.etiqueta) + "</button>";
    }).join("");

    barra.addEventListener("click", function (e) {
        const boton = e.target.closest(".adm-pestana");
        if (boton) location.hash = boton.dataset.id;
    });

    barra.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

        const botones = Array.prototype.slice.call(barra.querySelectorAll(".adm-pestana"));
        const actual = botones.indexOf(document.activeElement);
        if (actual === -1) return;

        const siguiente = botones[(actual + (e.key === "ArrowRight" ? 1 : botones.length - 1)) % botones.length];
        siguiente.focus();
        location.hash = siguiente.dataset.id;
        e.preventDefault();
    });
}

function ruta() {
    const id = (location.hash || "#" + MODULOS[0].id).slice(1);
    const mod = MODULOS.find(function (m) { return m.id === id; }) || MODULOS[0];

    routeToken++;
    cerrarModal();

    document.querySelectorAll(".adm-pestana").forEach(function (b) {
        const activa = b.dataset.id === mod.id;
        b.classList.toggle("active", activa);
        b.setAttribute("aria-selected", activa ? "true" : "false");
        b.tabIndex = activa ? 0 : -1;
    });

    $("#admPanel").setAttribute("aria-labelledby", "pestana-" + mod.id);
    document.title = mod.etiqueta.replace(/^\S+\s/, "") + " - Administración";

    if (mod.tipo === "reportes") renderReportes();
    else renderCrud(mod);

    const activa = $(".adm-pestana.active");
    if (activa && activa.scrollIntoView) activa.scrollIntoView({ block: "nearest", inline: "center" });
}

async function precargarServicios() {
    const rutas = ["/api/ingresos", "/api/gastos", "/api/costos", "/api/facturas"];
    const resultados = await Promise.allSettled(rutas.map(function (r) { return api(r); }));

    resultados.forEach(function (r) {
        if (r.status === "fulfilled" && Array.isArray(r.value)) recolectarServicios(r.value);
    });
}

function iniciar() {
    construirPestanas();

    if (!obtenerToken()) mostrarSesion(true);

    window.addEventListener("hashchange", ruta);
    ruta();
    cargarKpis();
    precargarServicios();
}

iniciar();
