/**
 * =============================================================================
 * MÓDULO DE SISTEMAS Y MESA DE AYUDA TI — CLIENTE REST Y GESTIÓN DE TICKETS
 * Conecta con los endpoints:
 *  - POST   /api/tickets              (Crear ticket)
 *  - GET    /api/tickets/mis-tickets  (Listar tickets del usuario logueado)
 *  - GET    /api/tickets              (Listar todos los tickets - Soporte TI)
 *  - GET    /api/tickets/{id}         (Ver detalle)
 *  - PUT    /api/tickets/{id}         (Actualizar estado/solución)
 *  - GET    /api/tickets/estadisticas (Métricas de soporte)
 * =============================================================================
 */

const API_BASE = window.API_URL || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8081'))
    ? 'http://localhost:8081'
    : '');

// Helpers de sesión y autenticación
function getAuthToken() {
    return sessionStorage.getItem("autenticacion") ||
           localStorage.getItem("auth_token") ||
           localStorage.getItem("token") || "";
}

function getAuthEmail() {
    return sessionStorage.getItem("usuario") ||
           localStorage.getItem("auth_email") || "Usuario";
}

function getAuthRole() {
    return sessionStorage.getItem("rol") ||
           localStorage.getItem("auth_role") || "INVITADO";
}

// Variables de estado
let misTicketsCache = [];
let todosTicketsCache = [];
let ticketSeleccionadoId = null;

// =============================================================================
// INICIALIZACIÓN
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
    configurarTabs();
    configurarFormularioCrear();
    configurarFiltros();
    configurarModal();
    cargarEstadisticas();
    cargarMisTickets();
    cargarTodosTickets();
});

function verificarSesion() {
    const token = getAuthToken();
    const emailSpan = document.getElementById("userEmailDisplay");
    const roleSpan = document.getElementById("userRoleDisplay");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!token) {
        console.warn("[Tickets] No hay sesión activa. Redirigiendo a login...");
        window.location.href = "login.html";
        return;
    }

    if (emailSpan) emailSpan.textContent = getAuthEmail();
    if (roleSpan) roleSpan.textContent = getAuthRole();

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_email");
            localStorage.removeItem("auth_role");
            window.location.href = "login.html";
        });
    }
}

// =============================================================================
// TABS
// =============================================================================
function configurarTabs() {
    const tabButtons = document.querySelectorAll(".tickets-tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const targetId = btn.getAttribute("data-tab");
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add("active");

            if (targetId === "tab-mis-tickets") {
                cargarMisTickets();
            } else if (targetId === "tab-gestion-ti") {
                cargarTodosTickets();
            }
        });
    });
}

// =============================================================================
// PETICIONES HTTP CON TOKEN
// =============================================================================
async function fetchConAuth(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    try {
        const respuesta = await fetch(url, { ...options, headers });
        if (respuesta.status === 401) {
            showToast("Tu sesión ha expirado. Por favor inicia sesión nuevamente.", "error");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
            throw new Error("No autorizado");
        }
        return respuesta;
    } catch (err) {
        console.error("[HTTP Error]:", err);
        throw err;
    }
}

// =============================================================================
// ESTADÍSTICAS Y MÉTRICAS
// =============================================================================
async function cargarEstadisticas() {
    try {
        const res = await fetchConAuth(`${API_BASE}/api/tickets/estadisticas`);
        if (!res.ok) return;
        const stats = await res.json();

        const totalEl = document.getElementById("metricTotal");
        const abiertosEl = document.getElementById("metricAbiertos");
        const enProcesoEl = document.getElementById("metricEnProceso");
        const resueltosEl = document.getElementById("metricResueltos");
        const misTicketsEl = document.getElementById("metricMisTickets");

        if (totalEl) totalEl.textContent = stats.total ?? 0;
        if (abiertosEl) abiertosEl.textContent = stats.abiertos ?? 0;
        if (enProcesoEl) enProcesoEl.textContent = stats.enProceso ?? 0;
        if (resueltosEl) resueltosEl.textContent = stats.resueltos ?? 0;
        if (misTicketsEl) misTicketsEl.textContent = stats.misTickets ?? 0;
    } catch (e) {
        console.error("Error al cargar estadísticas:", e);
    }
}

// =============================================================================
// CREAR NUEVO TICKET
// =============================================================================
function configurarFormularioCrear() {
    const form = document.getElementById("formNuevoTicket");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btnSubmit = form.querySelector("button[type='submit']");
        const originalText = btnSubmit ? btnSubmit.textContent : "";
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Registrando ticket...";
        }

        const body = {
            titulo: document.getElementById("ticketTitulo").value.trim(),
            categoria: document.getElementById("ticketCategoria").value,
            prioridad: document.getElementById("ticketPrioridad").value,
            descripcion: document.getElementById("ticketDescripcion").value.trim()
        };

        try {
            const res = await fetchConAuth(`${API_BASE}/api/tickets`, {
                method: "POST",
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const msg = errorData.message || `Error HTTP ${res.status}`;
                throw new Error(msg);
            }

            const creado = await res.json();
            showToast(`¡Ticket generado exitosamente! Código: ${creado.codigo}`, "success");
            form.reset();

            // Actualizar datos
            cargarEstadisticas();
            cargarMisTickets();
            cargarTodosTickets();

            // Cambiar a la pestaña de "Mis Tickets"
            const tabMisTicketsBtn = document.querySelector("[data-tab='tab-mis-tickets']");
            if (tabMisTicketsBtn) tabMisTicketsBtn.click();

        } catch (error) {
            showToast(`No se pudo crear el ticket: ${error.message}`, "error");
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalText;
            }
        }
    });
}

// =============================================================================
// LISTAR MIS TICKETS
// =============================================================================
async function cargarMisTickets() {
    const tbody = document.getElementById("tablaMisTicketsBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">Cargando tus tickets...</td></tr>`;

    try {
        const res = await fetchConAuth(`${API_BASE}/api/tickets/mis-tickets`);
        if (!res.ok) throw new Error("Error al obtener tickets");
        const tickets = await res.json();
        misTicketsCache = tickets;

        renderizarMisTickets(tickets);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: #dc2626; padding: 2rem;">Error al cargar tus tickets. Verifica tu conexión.</td></tr>`;
    }
}

function renderizarMisTickets(tickets) {
    const tbody = document.getElementById("tablaMisTicketsBody");
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #64748b;">
            No has registrado ningún ticket de soporte todavía. <br>
            Haz clic en <strong>"Nuevo Requerimiento"</strong> para generar tu primer ticket.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td><span class="badge-code">${escaparHTML(t.codigo)}</span></td>
            <td><strong>${escaparHTML(t.titulo)}</strong></td>
            <td>${escaparHTML(t.categoriaDescripcion || t.categoria)}</td>
            <td>${renderBadgePrioridad(t.prioridad)}</td>
            <td>${renderBadgeEstado(t.estado, t.estadoDescripcion)}</td>
            <td>${formatearFecha(t.fechaCreacion)}</td>
            <td>
                <button class="tck-btn tck-btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;"
                    onclick="abrirModalDetalle(${t.id})">
                    🔍 Ver Detalle
                </button>
            </td>
        </tr>
    `).join("");
}

// =============================================================================
// GESTIÓN TI (LISTAR TODOS LOS TICKETS)
// =============================================================================
async function cargarTodosTickets() {
    const tbody = document.getElementById("tablaGestionTiBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">Cargando lista de tickets...</td></tr>`;

    try {
        const res = await fetchConAuth(`${API_BASE}/api/tickets`);
        if (!res.ok) throw new Error("Error al obtener tickets");
        const tickets = await res.json();
        todosTicketsCache = tickets;

        aplicarFiltrosGestion();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: #dc2626; padding: 2rem;">Error al cargar tickets de soporte.</td></tr>`;
    }
}

function configurarFiltros() {
    const filtroEstado = document.getElementById("filtroEstadoGestion");
    const inputBuscar = document.getElementById("buscarTicketGestion");

    if (filtroEstado) filtroEstado.addEventListener("change", aplicarFiltrosGestion);
    if (inputBuscar) inputBuscar.addEventListener("input", aplicarFiltrosGestion);
}

function aplicarFiltrosGestion() {
    const filtroEstado = document.getElementById("filtroEstadoGestion")?.value || "";
    const textoBuscar = (document.getElementById("buscarTicketGestion")?.value || "").toLowerCase().trim();

    let filtrados = [...todosTicketsCache];

    if (filtroEstado) {
        filtrados = filtrados.filter(t => t.estado === filtroEstado);
    }

    if (textoBuscar) {
        filtrados = filtrados.filter(t =>
            (t.codigo && t.codigo.toLowerCase().includes(textoBuscar)) ||
            (t.titulo && t.titulo.toLowerCase().includes(textoBuscar)) ||
            (t.solicitanteEmail && t.solicitanteEmail.toLowerCase().includes(textoBuscar)) ||
            (t.descripcion && t.descripcion.toLowerCase().includes(textoBuscar))
        );
    }

    renderizarTodosTickets(filtrados);
}

function renderizarTodosTickets(tickets) {
    const tbody = document.getElementById("tablaGestionTiBody");
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color: #64748b;">
            No se encontraron tickets con los filtros seleccionados.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td><span class="badge-code">${escaparHTML(t.codigo)}</span></td>
            <td><strong>${escaparHTML(t.titulo)}</strong></td>
            <td><span style="font-size:0.85rem; color:#475569;">${escaparHTML(t.solicitanteEmail || "—")}</span></td>
            <td>${escaparHTML(t.categoriaDescripcion || t.categoria)}</td>
            <td>${renderBadgePrioridad(t.prioridad)}</td>
            <td>${renderBadgeEstado(t.estado, t.estadoDescripcion)}</td>
            <td>${formatearFecha(t.fechaCreacion)}</td>
            <td>
                <button class="tck-btn tck-btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;"
                    onclick="abrirModalAtencion(${t.id})">
                    ⚙️ Atender / Resolver
                </button>
            </td>
        </tr>
    `).join("");
}

// =============================================================================
// MODAL DE DETALLE Y GESTIÓN TÉCNICA
// =============================================================================
function configurarModal() {
    const backdrop = document.getElementById("modalTicket");
    const btnCerrar = document.getElementById("btnCerrarModal");
    const btnCancelar = document.getElementById("btnCancelarModal");
    const btnGuardar = document.getElementById("btnGuardarAtencion");

    const cerrar = () => {
        if (backdrop) backdrop.classList.remove("open");
        ticketSeleccionadoId = null;
    };

    if (btnCerrar) btnCerrar.addEventListener("click", cerrar);
    if (btnCancelar) btnCancelar.addEventListener("click", cerrar);

    if (backdrop) {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) cerrar();
        });
    }

    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarAtencionTicket);
    }
}

async function abrirModalDetalle(id) {
    await prepararModal(id, false);
}

async function abrirModalAtencion(id) {
    await prepararModal(id, true);
}

async function prepararModal(id, esEdicion) {
    ticketSeleccionadoId = id;
    const backdrop = document.getElementById("modalTicket");
    if (!backdrop) return;

    try {
        const res = await fetchConAuth(`${API_BASE}/api/tickets/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el ticket");
        const ticket = await res.json();

        // Llenar campos de lectura
        document.getElementById("modalCodigo").textContent = ticket.codigo || "";
        document.getElementById("modalTitulo").textContent = ticket.titulo || "";
        document.getElementById("modalSolicitante").textContent = ticket.solicitanteEmail || "—";
        document.getElementById("modalCategoria").textContent = ticket.categoriaDescripcion || ticket.categoria;
        document.getElementById("modalFecha").textContent = formatearFecha(ticket.fechaCreacion);
        document.getElementById("modalDescripcion").textContent = ticket.descripcion || "";

        // Campos de formulario
        const selectEstado = document.getElementById("modalSelectEstado");
        const selectPrioridad = document.getElementById("modalSelectPrioridad");
        const textareaSolucion = document.getElementById("modalSolucion");
        const seccionAcciones = document.getElementById("modalSeccionAcciones");
        const btnGuardar = document.getElementById("btnGuardarAtencion");

        if (selectEstado) selectEstado.value = ticket.estado || "ABIERTO";
        if (selectPrioridad) selectPrioridad.value = ticket.prioridad || "MEDIA";
        if (textareaSolucion) textareaSolucion.value = ticket.solucion || "";

        if (!esEdicion) {
            // Modo solo lectura para el usuario común
            if (selectEstado) selectEstado.disabled = true;
            if (selectPrioridad) selectPrioridad.disabled = true;
            if (textareaSolucion) textareaSolucion.disabled = true;
            if (btnGuardar) btnGuardar.style.display = "none";
        } else {
            // Modo edición para TI/Admin
            if (selectEstado) selectEstado.disabled = false;
            if (selectPrioridad) selectPrioridad.disabled = false;
            if (textareaSolucion) textareaSolucion.disabled = false;
            if (btnGuardar) btnGuardar.style.display = "inline-flex";
        }

        backdrop.classList.add("open");
    } catch (e) {
        showToast("Error al abrir detalle del ticket", "error");
    }
}

async function guardarAtencionTicket() {
    if (!ticketSeleccionadoId) return;

    const btnGuardar = document.getElementById("btnGuardarAtencion");
    const originalText = btnGuardar ? btnGuardar.textContent : "";
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";
    }

    const nuevoEstado = document.getElementById("modalSelectEstado")?.value;
    const nuevaPrioridad = document.getElementById("modalSelectPrioridad")?.value;
    const solucionTexto = document.getElementById("modalSolucion")?.value.trim();

    const body = {
        estado: nuevoEstado,
        prioridad: nuevaPrioridad,
        solucion: solucionTexto
    };

    try {
        const res = await fetchConAuth(`${API_BASE}/api/tickets/${ticketSeleccionadoId}`, {
            method: "PUT",
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error(`Error al actualizar (HTTP ${res.status})`);
        }

        showToast("Ticket actualizado correctamente con la resolución de TI.", "success");
        document.getElementById("modalTicket")?.classList.remove("open");
        ticketSeleccionadoId = null;

        // Refrescar vistas
        cargarEstadisticas();
        cargarMisTickets();
        cargarTodosTickets();

    } catch (e) {
        showToast(`Error al guardar: ${e.message}`, "error");
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = originalText;
        }
    }
}

// =============================================================================
// UTILIDADES DE FORMATO Y UI
// =============================================================================
function renderBadgeEstado(estado, descripcion) {
    const desc = descripcion || estado;
    switch (estado) {
        case "ABIERTO":
            return `<span class="badge-estado badge-abierto">🟡 ${escaparHTML(desc)}</span>`;
        case "EN_PROCESO":
            return `<span class="badge-estado badge-en-proceso">🔵 ${escaparHTML(desc)}</span>`;
        case "RESUELTO":
            return `<span class="badge-estado badge-resuelto">🟢 ${escaparHTML(desc)}</span>`;
        case "CERRADO":
            return `<span class="badge-estado badge-cerrado">⚪ ${escaparHTML(desc)}</span>`;
        case "CANCELADO":
            return `<span class="badge-estado badge-cancelado">🔴 ${escaparHTML(desc)}</span>`;
        default:
            return `<span class="badge-estado">${escaparHTML(desc)}</span>`;
    }
}

function renderBadgePrioridad(prio) {
    return `<span class="badge-prioridad prio-${prio}">${escaparHTML(prio)}</span>`;
}

function formatearFecha(isoString) {
    if (!isoString) return "—";
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return isoString;
    }
}

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(mensaje, tipo = "info") {
    let contenedor = document.getElementById("toastContainer");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "toastContainer";
        contenedor.className = "tck-toast-container";
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement("div");
    toast.className = `tck-toast tck-toast-${tipo}`;
    toast.innerHTML = `<span>${escaparHTML(mensaje)}</span>`;
    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}
