/**
 * =============================================================================
 * MÓDULO DE OPERACIONES Y MANTENIMIENTO - LÓGICA Y CONEXIÓN REST
 * Conecta con los endpoints de Spring Boot:
 *  - /api/v1/tipos-mantenimiento (CRUD Tipos)
 *  - /api/v1/ordenes-trabajo (RF-02 CRUD Órdenes)
 *  - /api/v1/ordenes-trabajo/programar-preventivo (RF-03 Programación en Serie)
 *  - /api/v1/ordenes-trabajo/{id}/tecnico (RF-04 Asignar Técnico)
 *  - /api/v1/ordenes-trabajo/{id}/recursos (RF-05 Asignar Recursos)
 * =============================================================================
 */

const API_BASE = window.API_URL || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8081'))
    ? 'http://localhost:8081'
    : '');

const ENDPOINTS = {
    tipos: `${API_BASE}/api/v1/tipos-mantenimiento`,
    ordenes: `${API_BASE}/api/v1/ordenes-trabajo`
};

// Cache de tipos de mantenimiento para formularios y visualización
let tiposMantenimientoCache = [];

// =============================================================================
// UTILIDADES: NOTIFICACIONES TOAST Y MODALES
// =============================================================================

function showToast(mensaje, tipo = 'info', duracion = 4500) {
    const contenedor = document.getElementById('toastContainer');
    if (!contenedor) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;

    const iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    toast.innerHTML = `
        <span class="toast-icon">${iconos[tipo] || 'ℹ️'}</span>
        <div style="flex: 1; word-break: break-word;">${mensaje}</div>
    `;

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
    }
}

// Configurar botones de cierre de modales
document.querySelectorAll('[data-cerrar]').forEach(btn => {
    btn.addEventListener('click', () => {
        cerrarModal(btn.getAttribute('data-cerrar'));
    });
});

// Cerrar modal al hacer clic en el fondo oscuro
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('open');
        }
    });
});

// =============================================================================
// NAVEGACIÓN POR PESTAÑAS
// =============================================================================

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.seccion-panel');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const activePanel = document.getElementById(targetTab);
        if (activePanel) {
            activePanel.classList.add('active');
        }
    });
});

// =============================================================================
// GESTIÓN DE TIPOS DE MANTENIMIENTO (CRUD)
// =============================================================================

const checkSoloActivos = document.getElementById('checkSoloActivos');
const btnRefrescarTipos = document.getElementById('btnRefrescarTipos');
const btnToggleFormTipo = document.getElementById('btnToggleFormTipo');
const contenedorFormTipo = document.getElementById('contenedorFormTipo');
const formTipoMantenimiento = document.getElementById('formTipoMantenimiento');
const btnCancelarTipo = document.getElementById('btnCancelarTipo');
const formTipoTitulo = document.getElementById('formTipoTitulo');

if (btnToggleFormTipo) {
    btnToggleFormTipo.addEventListener('click', () => {
        resetearFormTipo();
        contenedorFormTipo.style.display = contenedorFormTipo.style.display === 'none' ? 'block' : 'none';
    });
}

if (btnCancelarTipo) {
    btnCancelarTipo.addEventListener('click', () => {
        resetearFormTipo();
        contenedorFormTipo.style.display = 'none';
    });
}

function resetearFormTipo() {
    formTipoMantenimiento.reset();
    document.getElementById('tipoId').value = '';
    formTipoTitulo.textContent = 'Registrar Tipo de Mantenimiento';
}

async function cargarTiposMantenimiento() {
    const lista = document.getElementById('listaTiposMantenimiento');
    const soloActivos = checkSoloActivos ? checkSoloActivos.checked : false;

    try {
        const res = await fetch(`${ENDPOINTS.tipos}?soloActivos=${soloActivos}`);
        if (!res.ok) throw new Error('Error al cargar tipos de mantenimiento');

        const tipos = await res.json();
        tiposMantenimientoCache = tipos;

        // Actualizar contador KPI de tipos activos
        const activosCount = tipos.filter(t => t.activo).length;
        const kpiTipos = document.getElementById('kpiTiposActivos');
        if (kpiTipos) kpiTipos.textContent = activosCount;

        // Poblar selects de los formularios
        poblarSelectsTipos(tipos);

        // Renderizar tabla
        lista.innerHTML = '';
        if (tipos.length === 0) {
            lista.innerHTML = `<tr><td colspan="6" class="tabla-vacia">No se encontraron tipos de mantenimiento registrados.</td></tr>`;
            return;
        }

        tipos.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${t.id}</strong></td>
                <td><strong>${escapeHtml(t.nombre)}</strong></td>
                <td>${escapeHtml(t.descripcion || '-')}</td>
                <td>${t.periodicidadDias ? `${t.periodicidadDias} días` : '<em style="color:#94a3b8">No definida</em>'}</td>
                <td>
                    <span class="badge ${t.activo ? 'badge-activo' : 'badge-inactivo'}">
                        ${t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="acciones-td">
                        <button class="btn btn-outline btn-sm" onclick="editarTipo(${t.id})" title="Editar">✏️</button>
                        <button class="btn ${t.activo ? 'btn-warning' : 'btn-success'} btn-sm" onclick="cambiarEstadoTipo(${t.id}, ${!t.activo})" title="${t.activo ? 'Desactivar' : 'Activar'}">
                            ${t.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarTipo(${t.id})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            `;
            lista.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        lista.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #dc2626;">
                    Error al conectar con el servidor (${error.message}). Asegúrate de que el backend esté ejecutándose en http://localhost:8080.
                </td>
            </tr>
        `;
    }
}

function poblarSelectsTipos(tipos) {
    const tiposActivos = tipos.filter(t => t.activo);

    // Select para nueva OT
    const selectOt = document.getElementById('otTipoMantenimiento');
    if (selectOt) {
        const valorActual = selectOt.value;
        selectOt.innerHTML = '<option value="">Selecciona un tipo...</option>';
        tiposActivos.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${t.nombre}${t.periodicidadDias ? ` (Cada ${t.periodicidadDias} días)` : ''}`;
            selectOt.appendChild(opt);
        });
        if (valorActual) selectOt.value = valorActual;
    }

    // Select para Programar Preventivo (RF-03)
    const selectProg = document.getElementById('progTipoMantenimiento');
    if (selectProg) {
        const valorActualProg = selectProg.value;
        selectProg.innerHTML = '<option value="">Selecciona un tipo preventivo...</option>';
        tiposActivos.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${t.nombre} - [Periodicidad: ${t.periodicidadDias || 'Sin periodicidad'} días]`;
            opt.dataset.periodicidad = t.periodicidadDias || '';
            selectProg.appendChild(opt);
        });
        if (valorActualProg) selectProg.value = valorActualProg;
    }
}

// Al cambiar el tipo en Programar Preventivo, dar feedback de la periodicidad
const selectProg = document.getElementById('progTipoMantenimiento');
if (selectProg) {
    selectProg.addEventListener('change', () => {
        const selectedOption = selectProg.options[selectProg.selectedIndex];
        const periodicidad = selectedOption ? selectedOption.dataset.periodicidad : '';
        const ayuda = document.getElementById('ayudaPeriodicidad');
        if (ayuda) {
            if (periodicidad) {
                ayuda.textContent = `✅ Periodicidad configurada: cada ${periodicidad} días`;
                ayuda.style.color = '#15803d';
            } else {
                ayuda.textContent = `⚠️ Este tipo no tiene periodicidad configurada en días`;
                ayuda.style.color = '#b45309';
            }
        }
    });
}

// Guardar (crear o actualizar) tipo de mantenimiento
if (formTipoMantenimiento) {
    formTipoMantenimiento.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('tipoId').value;
        const nombre = document.getElementById('tipoNombre').value.trim();
        const descripcion = document.getElementById('tipoDescripcion').value.trim();
        const periodicidadDias = document.getElementById('tipoPeriodicidad').value;

        const body = {
            nombre,
            descripcion: descripcion || null,
            periodicidadDias: periodicidadDias ? parseInt(periodicidadDias, 10) : null
        };

        try {
            const url = id ? `${ENDPOINTS.tipos}/${id}` : ENDPOINTS.tipos;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'No se pudo guardar el tipo de mantenimiento');
            }

            showToast(id ? 'Tipo de mantenimiento actualizado' : 'Tipo de mantenimiento creado exitosamente', 'success');
            resetearFormTipo();
            contenedorFormTipo.style.display = 'none';
            cargarTiposMantenimiento();

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        }
    });
}

function editarTipo(id) {
    const tipo = tiposMantenimientoCache.find(t => t.id === id);
    if (!tipo) return;

    document.getElementById('tipoId').value = tipo.id;
    document.getElementById('tipoNombre').value = tipo.nombre;
    document.getElementById('tipoDescripcion').value = tipo.descripcion || '';
    document.getElementById('tipoPeriodicidad').value = tipo.periodicidadDias || '';

    formTipoTitulo.textContent = `Editar Tipo de Mantenimiento #${tipo.id}`;
    contenedorFormTipo.style.display = 'block';
    contenedorFormTipo.scrollIntoView({ behavior: 'smooth' });
}

async function cambiarEstadoTipo(id, nuevoEstado) {
    try {
        const res = await fetch(`${ENDPOINTS.tipos}/${id}/estado?activo=${nuevoEstado}`, {
            method: 'PATCH'
        });

        if (!res.ok) throw new Error('Error al cambiar el estado del tipo');

        showToast(`Tipo de mantenimiento ${nuevoEstado ? 'activado' : 'desactivado'}`, 'success');
        cargarTiposMantenimiento();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

async function eliminarTipo(id) {
    if (!confirm(`¿Estás seguro de eliminar el tipo de mantenimiento #${id}? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const res = await fetch(`${ENDPOINTS.tipos}/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'No se pudo eliminar el tipo de mantenimiento. Verifique que no tenga órdenes asociadas.');
        }

        showToast('Tipo de mantenimiento eliminado', 'success');
        cargarTiposMantenimiento();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

if (checkSoloActivos) checkSoloActivos.addEventListener('change', cargarTiposMantenimiento);
if (btnRefrescarTipos) btnRefrescarTipos.addEventListener('click', cargarTiposMantenimiento);


// =============================================================================
// GESTIÓN DE ÓRDENES DE TRABAJO (RF-02 CRUD)
// =============================================================================

let ordenesCache = [];
const btnToggleFormOt = document.getElementById('btnToggleFormOt');
const contenedorFormOt = document.getElementById('contenedorFormOt');
const formOrdenTrabajo = document.getElementById('formOrdenTrabajo');
const btnCancelarOt = document.getElementById('btnCancelarOt');
const formOtTitulo = document.getElementById('formOtTitulo');
const filtroEstadoOt = document.getElementById('filtroEstadoOt');
const btnRefrescarOts = document.getElementById('btnRefrescarOts');

if (btnToggleFormOt) {
    btnToggleFormOt.addEventListener('click', () => {
        resetearFormOt();
        contenedorFormOt.style.display = contenedorFormOt.style.display === 'none' ? 'block' : 'none';
    });
}

if (btnCancelarOt) {
    btnCancelarOt.addEventListener('click', () => {
        resetearFormOt();
        contenedorFormOt.style.display = 'none';
    });
}

function resetearFormOt() {
    formOrdenTrabajo.reset();
    document.getElementById('otId').value = '';
    formOtTitulo.textContent = 'Registrar Nueva Orden de Trabajo';
    // Poner por defecto fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('otFechaProgramada');
    if (fechaInput) {
        fechaInput.min = hoy;
        fechaInput.value = hoy;
    }
}

async function cargarOrdenesTrabajo() {
    const lista = document.getElementById('listaOrdenesTrabajo');
    const estado = filtroEstadoOt ? filtroEstadoOt.value : '';

    try {
        const url = estado ? `${ENDPOINTS.ordenes}?estado=${encodeURIComponent(estado)}` : ENDPOINTS.ordenes;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al consultar las órdenes de trabajo');

        const ordenes = await res.json();
        ordenesCache = ordenes;

        // Actualizar KPIs
        actualizarKpis(ordenes);

        // Actualizar badge del tab
        const tabBadge = document.getElementById('tabBadgeOrdenes');
        if (tabBadge) {
            const pendientes = ordenes.filter(o => o.estado === 'PENDIENTE' || o.estado === 'EN_PROCESO').length;
            tabBadge.textContent = ordenes.length;
            tabBadge.classList.toggle('visible', ordenes.length > 0);
        }

        // Renderizar tabla
        lista.innerHTML = '';
        if (ordenes.length === 0) {
            lista.innerHTML = `
                <tr><td colspan="8" class="tabla-vacia">No se encontraron órdenes de trabajo${estado ? ` con estado "${estado}"` : ''}.</td></tr>
            `;
            return;
        }

        ordenes.forEach(ot => {
            const tr = document.createElement('tr');

            // Badge prioridad
            const badgePrioridad = `<span class="badge badge-prioridad-${(ot.prioridad || '').toLowerCase()}">${ot.prioridad || '-'}</span>`;

            // Badge estado
            const estadoClase = (ot.estado || '').toLowerCase();
            const badgeEstado = `<span class="badge badge-estado-${estadoClase}">${ot.estado || '-'}</span>`;

            // Técnico asignado
            const tecnicoHtml = ot.tecnicoId
                ? `<span>👷 ID: <strong>#${ot.tecnicoId}</strong></span>`
                : `<span style="color: #94a3b8; font-style: italic;">Sin asignar</span>`;

            // Cantidad de recursos asignados
            const cantRecursos = ot.recursos ? ot.recursos.length : 0;
            const recursosHtml = cantRecursos > 0
                ? `<span style="color: var(--color-primary); font-weight: 600;">🛠️ ${cantRecursos} asignado(s)</span>`
                : `<span style="color: #94a3b8;">0 recursos</span>`;

            tr.innerHTML = `
                <td><span class="codigo-ot">${escapeHtml(ot.codigo || `OT-#${ot.id}`)}</span></td>
                <td><strong>${escapeHtml(ot.tipoMantenimientoNombre || `Tipo #${ot.tipoMantenimientoId}`)}</strong></td>
                <td>${formatearFecha(ot.fechaProgramada)}</td>
                <td>${badgePrioridad}</td>
                <td>${badgeEstado}</td>
                <td>
                    ${tecnicoHtml}
                    <button class="btn btn-outline btn-sm" style="margin-left: 0.3rem;" onclick="abrirModalTecnico(${ot.id})" title="Asignar o cambiar técnico (RF-04)">✏️</button>
                </td>
                <td>
                    ${recursosHtml}
                    <button class="btn btn-outline btn-sm" style="margin-left: 0.3rem;" onclick="abrirModalRecursos(${ot.id})" title="Gestionar recursos (RF-05)">🛠️</button>
                </td>
                <td>
                    <div class="acciones-td">
                        <button class="btn btn-outline btn-sm" onclick="abrirModalEstado(${ot.id}, '${ot.estado}')" title="Cambiar Estado">🔄</button>
                        <button class="btn btn-outline btn-sm" onclick="editarOt(${ot.id})" title="Editar">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarOt(${ot.id})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            `;
            lista.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        lista.innerHTML = `<tr><td colspan="8" class="tabla-vacia" style="color:#dc2626;">⚠️ Error al conectar con el servidor: ${error.message}</td></tr>`;
    }
}

function actualizarKpis(ordenes) {
    const kpiTotal = document.getElementById('kpiTotalOt');
    const kpiPendientes = document.getElementById('kpiPendientes');
    const kpiEnProceso = document.getElementById('kpiEnProceso');
    const kpiFinalizadas = document.getElementById('kpiFinalizadas');

    if (kpiTotal) kpiTotal.textContent = ordenes.length;
    if (kpiPendientes) kpiPendientes.textContent = ordenes.filter(o => o.estado === 'PENDIENTE').length;
    if (kpiEnProceso) kpiEnProceso.textContent = ordenes.filter(o => o.estado === 'EN_PROCESO').length;
    if (kpiFinalizadas) kpiFinalizadas.textContent = ordenes.filter(o => o.estado === 'FINALIZADA').length;
}

// Guardar o Actualizar Orden de Trabajo
if (formOrdenTrabajo) {
    formOrdenTrabajo.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('otId').value;
        const tipoMantenimientoId = document.getElementById('otTipoMantenimiento').value;
        const fechaProgramada = document.getElementById('otFechaProgramada').value;
        const prioridad = document.getElementById('otPrioridad').value;
        const descripcion = document.getElementById('otDescripcion').value.trim();

        const body = {
            tipoMantenimientoId: parseInt(tipoMantenimientoId, 10),
            fechaProgramada,
            prioridad,
            descripcion: descripcion || null
        };

        try {
            const url = id ? `${ENDPOINTS.ordenes}/${id}` : ENDPOINTS.ordenes;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al guardar la orden de trabajo');
            }

            const data = await res.json();
            showToast(id ? `Orden ${data.codigo || ''} actualizada` : `Orden ${data.codigo || ''} creada exitosamente`, 'success');
            resetearFormOt();
            contenedorFormOt.style.display = 'none';
            cargarOrdenesTrabajo();

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        }
    });
}

function editarOt(id) {
    const ot = ordenesCache.find(o => o.id === id);
    if (!ot) return;

    document.getElementById('otId').value = ot.id;
    document.getElementById('otTipoMantenimiento').value = ot.tipoMantenimientoId;
    document.getElementById('otFechaProgramada').value = ot.fechaProgramada || '';
    document.getElementById('otPrioridad').value = ot.prioridad || 'MEDIA';
    document.getElementById('otDescripcion').value = ot.descripcion || '';

    formOtTitulo.textContent = `Editar Orden de Trabajo ${ot.codigo || `#${ot.id}`}`;
    contenedorFormOt.style.display = 'block';
    contenedorFormOt.scrollIntoView({ behavior: 'smooth' });
}

async function eliminarOt(id) {
    const ot = ordenesCache.find(o => o.id === id);
    const codigo = ot ? ot.codigo : `#${id}`;

    if (!confirm(`¿Deseas eliminar la orden de trabajo ${codigo}?`)) {
        return;
    }

    try {
        const res = await fetch(`${ENDPOINTS.ordenes}/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'No se pudo eliminar la orden de trabajo');
        }

        showToast(`Orden ${codigo} eliminada`, 'success');
        cargarOrdenesTrabajo();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

if (filtroEstadoOt) filtroEstadoOt.addEventListener('change', cargarOrdenesTrabajo);
if (btnRefrescarOts) btnRefrescarOts.addEventListener('click', cargarOrdenesTrabajo);


// =============================================================================
// PROGRAMAR PREVENTIVO EN SERIE (RF-03)
// =============================================================================

const formProgramarPreventivo = document.getElementById('formProgramarPreventivo');
const progFechaInicio = document.getElementById('progFechaInicio');

// Asegurar que la fecha de inicio sea futura
if (progFechaInicio) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    progFechaInicio.min = manana.toISOString().split('T')[0];
    progFechaInicio.value = manana.toISOString().split('T')[0];
}

if (formProgramarPreventivo) {
    formProgramarPreventivo.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tipoMantenimientoId = document.getElementById('progTipoMantenimiento').value;
        const fechaInicio = document.getElementById('progFechaInicio').value;
        const cantidadOcurrencias = document.getElementById('progCantidad').value;
        const prioridad = document.getElementById('progPrioridad').value;
        const descripcion = document.getElementById('progDescripcion').value.trim();

        const body = {
            tipoMantenimientoId: parseInt(tipoMantenimientoId, 10),
            fechaInicio,
            cantidadOcurrencias: parseInt(cantidadOcurrencias, 10),
            prioridad,
            descripcion: descripcion || null
        };

        const btnSubmit = document.getElementById('btnGenerarSerie');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = '⏳ Generando órdenes...';
        }

        try {
            const res = await fetch(`${ENDPOINTS.ordenes}/programar-preventivo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al programar mantenimientos en serie');
            }

            const seriesGeneradas = await res.json();
            showToast(`¡Se generaron ${seriesGeneradas.length} órdenes de trabajo en serie con éxito!`, 'success');

            // Mostrar tabla de resultados
            const resultadoContenedor = document.getElementById('resultadoSerieContenedor');
            const listaResultado = document.getElementById('listaResultadoSerie');
            const resumenEl = document.getElementById('resultadoSerieResumen');

            if (resultadoContenedor && listaResultado) {
                if (resumenEl) resumenEl.textContent = `Se generaron ${seriesGeneradas.length} órdenes en estado PROGRAMADA automáticamente.`;
                listaResultado.innerHTML = '';
                seriesGeneradas.forEach((s, idx) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${idx + 1}</strong></td>
                        <td><span class="codigo-ot">${escapeHtml(s.codigo)}</span></td>
                        <td>${escapeHtml(s.tipoMantenimientoNombre || '')}</td>
                        <td><strong>${formatearFecha(s.fechaProgramada)}</strong></td>
                        <td><span class="badge badge-prioridad-${(s.prioridad || '').toLowerCase()}">${s.prioridad}</span></td>
                        <td><span class="badge badge-estado-${(s.estado || '').toLowerCase()}">${s.estado}</span></td>
                    `;
                    listaResultado.appendChild(tr);
                });
                resultadoContenedor.style.display = 'block';
                resultadoContenedor.scrollIntoView({ behavior: 'smooth' });
            }

            // Recargar lista principal de órdenes
            cargarOrdenesTrabajo();

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = '⚡ Generar Serie de Órdenes';
            }
        }
    });
}


// =============================================================================
// MODAL RF-04: ASIGNAR TÉCNICO A ORDEN DE TRABAJO
// =============================================================================

let otSeleccionadaIdTecnico = null;

function abrirModalTecnico(id) {
    const ot = ordenesCache.find(o => o.id === id);
    if (!ot) return;

    otSeleccionadaIdTecnico = id;
    document.getElementById('tecnicoOtCodigo').textContent = ot.codigo || `#${ot.id}`;
    document.getElementById('tecnicoOtFecha').textContent = formatearFecha(ot.fechaProgramada);
    document.getElementById('inputTecnicoId').value = ot.tecnicoId || '';

    abrirModal('modalTecnico');
}

const btnGuardarTecnico = document.getElementById('btnGuardarTecnico');
if (btnGuardarTecnico) {
    btnGuardarTecnico.addEventListener('click', async () => {
        if (!otSeleccionadaIdTecnico) return;

        const tecnicoId = document.getElementById('inputTecnicoId').value;
        if (!tecnicoId || parseInt(tecnicoId, 10) <= 0) {
            showToast('Por favor ingresa un ID de técnico válido (mayor a 0)', 'warning');
            return;
        }

        btnGuardarTecnico.disabled = true;
        btnGuardarTecnico.textContent = 'Asignando...';

        try {
            const res = await fetch(`${ENDPOINTS.ordenes}/${otSeleccionadaIdTecnico}/tecnico`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tecnicoId: parseInt(tecnicoId, 10) })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'No se pudo asignar el técnico a la orden de trabajo');
            }

            showToast('Técnico asignado exitosamente', 'success');
            cerrarModal('modalTecnico');
            cargarOrdenesTrabajo();

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error', 6000);
        } finally {
            btnGuardarTecnico.disabled = false;
            btnGuardarTecnico.textContent = 'Asignar Técnico';
        }
    });
}


// =============================================================================
// MODAL RF-05: ASIGNAR Y CONSULTAR RECURSOS (EQUIPOS Y HERRAMIENTAS)
// =============================================================================

let otSeleccionadaIdRecursos = null;

async function abrirModalRecursos(id) {
    const ot = ordenesCache.find(o => o.id === id);
    if (!ot) return;

    otSeleccionadaIdRecursos = id;
    document.getElementById('recursosOtCodigo').textContent = ot.codigo || `#${ot.id}`;

    const lista = document.getElementById('listaRecursosAsignados');
    lista.innerHTML = '<li>Consultando recursos en el servidor...</li>';

    abrirModal('modalRecursos');

    try {
        const res = await fetch(`${ENDPOINTS.ordenes}/${id}/recursos`);
        if (!res.ok) throw new Error('Error al consultar recursos asignados');

        const recursos = await res.json();
        lista.innerHTML = '';

        if (recursos.length === 0) {
            lista.innerHTML = '<li style="color: #64748b;">No hay recursos asignados a esta orden.</li>';
            document.getElementById('inputEquipoIds').value = '';
            document.getElementById('inputHerramientaIds').value = '';
            return;
        }

        const equipos = [];
        const herramientas = [];

        recursos.forEach(r => {
            const li = document.createElement('li');
            if (r.equipoId) {
                equipos.push(r.equipoId);
                li.innerHTML = `
                    <span>🚜 <strong>Equipo ID:</strong> #${r.equipoId}</span>
                    <small style="color: #64748b;">Asignado: ${formatearFechaHora(r.fechaAsignacion)}</small>
                `;
            } else if (r.herramientaId) {
                herramientas.push(r.herramientaId);
                li.innerHTML = `
                    <span>🧰 <strong>Herramienta ID:</strong> #${r.herramientaId}</span>
                    <small style="color: #64748b;">Asignado: ${formatearFechaHora(r.fechaAsignacion)}</small>
                `;
            }
            lista.appendChild(li);
        });

        // Prellenar inputs con los IDs actuales
        document.getElementById('inputEquipoIds').value = equipos.join(', ');
        document.getElementById('inputHerramientaIds').value = herramientas.join(', ');

    } catch (error) {
        console.error(error);
        lista.innerHTML = `<li style="color: #dc2626;">Error al cargar recursos: ${error.message}</li>`;
    }
}

const btnGuardarRecursos = document.getElementById('btnGuardarRecursos');
if (btnGuardarRecursos) {
    btnGuardarRecursos.addEventListener('click', async () => {
        if (!otSeleccionadaIdRecursos) return;

        const parseIds = (texto) => {
            if (!texto || !texto.trim()) return [];
            return texto
                .split(',')
                .map(v => parseInt(v.trim(), 10))
                .filter(n => !isNaN(n) && n > 0);
        };

        const equipoIds = parseIds(document.getElementById('inputEquipoIds').value);
        const herramientaIds = parseIds(document.getElementById('inputHerramientaIds').value);

        if (equipoIds.length === 0 && herramientaIds.length === 0) {
            showToast('Debes ingresar al menos un ID de equipo o herramienta', 'warning');
            return;
        }

        btnGuardarRecursos.disabled = true;
        btnGuardarRecursos.textContent = 'Guardando...';

        try {
            const res = await fetch(`${ENDPOINTS.ordenes}/${otSeleccionadaIdRecursos}/recursos`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ equipoIds, herramientaIds })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al asignar recursos a la orden');
            }

            const recursosGuardados = await res.json();
            showToast(`Se asignaron ${recursosGuardados.length} recursos correctamente`, 'success');
            cerrarModal('modalRecursos');
            cargarOrdenesTrabajo();

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            btnGuardarRecursos.disabled = false;
            btnGuardarRecursos.textContent = 'Guardar Recursos';
        }
    });
}


// =============================================================================
// MODAL: CAMBIAR ESTADO DE LA ORDEN
// =============================================================================

let otSeleccionadaIdEstado = null;

function abrirModalEstado(id, estadoActual) {
    const ot = ordenesCache.find(o => o.id === id);
    if (!ot) return;

    otSeleccionadaIdEstado = id;
    document.getElementById('estadoOtCodigo').textContent = ot.codigo || `#${ot.id}`;
    document.getElementById('selectNuevoEstado').value = estadoActual || 'PENDIENTE';

    abrirModal('modalEstado');
}

const btnGuardarEstado = document.getElementById('btnGuardarEstado');
if (btnGuardarEstado) {
    btnGuardarEstado.addEventListener('click', async () => {
        if (!otSeleccionadaIdEstado) return;

        const nuevoEstado = document.getElementById('selectNuevoEstado').value;

        btnGuardarEstado.disabled = true;
        btnGuardarEstado.textContent = 'Actualizando...';

        try {
            const res = await fetch(`${ENDPOINTS.ordenes}/${otSeleccionadaIdEstado}/estado?estado=${encodeURIComponent(nuevoEstado)}`, {
                method: 'PATCH'
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'No se pudo cambiar el estado de la orden');
            }

            showToast(`Estado cambiado a ${nuevoEstado}`, 'success');
            cerrarModal('modalEstado');
            cargarOrdenesTrabajo();

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            btnGuardarEstado.disabled = false;
            btnGuardarEstado.textContent = 'Actualizar Estado';
        }
    });
}


// =============================================================================
// UTILIDADES DE FORMATO Y SANITIZACIÓN
// =============================================================================

function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    // Espera formato YYYY-MM-DD
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
}

function formatearFechaHora(fechaHoraStr) {
    if (!fechaHoraStr) return '-';
    try {
        const d = new Date(fechaHoraStr);
        return d.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return fechaHoraStr;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// =============================================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    cargarTiposMantenimiento();
    cargarOrdenesTrabajo();
});
