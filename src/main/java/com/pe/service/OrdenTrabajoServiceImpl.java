package com.pe.service;

import com.pe.dto.AsignarRecursosRequest;
import com.pe.dto.AsignarTecnicoRequest;
import com.pe.dto.OrdenTrabajoRecursoResponse;
import com.pe.dto.OrdenTrabajoRequest;
import com.pe.dto.OrdenTrabajoResponse;
import com.pe.dto.ProgramarMantenimientoRequest;
import com.pe.exception.ResourceNotFoundException;
import com.pe.exception.TecnicoNoDisponibleException;
import com.pe.model.Equipo;
import com.pe.model.EstadoOrden;
import com.pe.model.OrdenTrabajo;
import com.pe.model.OrdenTrabajoRecurso;
import com.pe.model.TipoMantenimiento;
import com.pe.repository.OrdenTrabajoRecursoRepository;
import com.pe.repository.EquipoRepository;
import com.pe.repository.OrdenTrabajoRepository;
import com.pe.repository.TipoMantenimientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrdenTrabajoServiceImpl implements OrdenTrabajoService {

    private final OrdenTrabajoRepository repository;
    private final TipoMantenimientoRepository tipoMantenimientoRepository;
    private final OrdenTrabajoRecursoRepository recursoRepository;
    private final EquipoRepository equipoRepository;


    @Override
    public OrdenTrabajoResponse save(OrdenTrabajoRequest request) {
        TipoMantenimiento tipo = tipoMantenimientoRepository.findById(request.getTipoMantenimientoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el tipo de mantenimiento con id " + request.getTipoMantenimientoId()));
        Equipo equipo = buscarEquipoOpcional(request.getEquipoId());

        OrdenTrabajo entidad = OrdenTrabajo.builder()
                .tipoMantenimiento(tipo)
                .equipo(equipo)
                .fechaProgramada(request.getFechaProgramada())
                .prioridad(request.getPrioridad())
                .descripcion(request.getDescripcion())
                .estado(EstadoOrden.PENDIENTE)
                .build();

        entidad = repository.save(entidad);
        entidad.setCodigo(generarCodigo(entidad.getId()));
        entidad = repository.save(entidad);

        return toResponse(entidad);
    }

    @Override
    public OrdenTrabajoResponse update(Long id, OrdenTrabajoRequest request) {
        OrdenTrabajo entidad = buscarOFallar(id);
       // TipoMantenimiento tipo = buscarTipoOFallar(request.getTipoMantenimientoId());

        TipoMantenimiento tipo = tipoMantenimientoRepository.findById(request.getTipoMantenimientoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el tipo de mantenimiento con id " + request.getTipoMantenimientoId()));
        Equipo equipo = buscarEquipoOpcional(request.getEquipoId());

        entidad.setTipoMantenimiento(tipo);
        entidad.setEquipo(equipo);
        entidad.setFechaProgramada(request.getFechaProgramada());
        entidad.setPrioridad(request.getPrioridad());
        entidad.setDescripcion(request.getDescripcion());

        return toResponse(repository.save(entidad));
    }

    @Override
    @Transactional(readOnly = true)
    public OrdenTrabajoResponse findById(Long id) {
        return toResponse(buscarOFallar(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> findByEstado(EstadoOrden estado) {
        return repository.findByEstado(estado).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> findByEquipoId(Long equipoId) {
        if (!equipoRepository.existsById(equipoId)) {
            throw new ResourceNotFoundException("No se encontró el equipo con id " + equipoId);
        }

        return repository.findByEquipoIdOrderByFechaCreacionDescIdDesc(equipoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {
        OrdenTrabajo entidad = buscarOFallar(id);
        repository.delete(entidad);
    }

    @Override
    public OrdenTrabajoResponse changeStatus(Long id, EstadoOrden estado) {
        OrdenTrabajo entidad = buscarOFallar(id);
        entidad.setEstado(estado);
        return toResponse(repository.save(entidad));
    }

    // -------------------------------------------------------------------------
    // RF-03: Programar mantenimientos preventivos según periodicidad
    // -------------------------------------------------------------------------

    /**
     * Genera automáticamente N órdenes de trabajo con fecha calculada a partir
     * de la periodicidad en días del TipoMantenimiento.
     *
     * Ejemplo: periodicidadDias=30, cantidadOcurrencias=3, fechaInicio=2026-11-01
     * → OT-1: 2026-11-01 | OT-2: 2026-12-01 | OT-3: 2026-12-31
     */
    @Override
    public List<OrdenTrabajoResponse> programarMantenimientoPreventivo(ProgramarMantenimientoRequest request) {
        TipoMantenimiento tipo = buscarTipoOFallar(request.getTipoMantenimientoId());

        if (tipo.getPeriodicidadDias() == null || tipo.getPeriodicidadDias() <= 0) {
            throw new IllegalArgumentException(
                    "El tipo de mantenimiento '" + tipo.getNombre()
                    + "' no tiene una periodicidad definida. Solo los tipos preventivos pueden programarse en serie.");
        }

        List<OrdenTrabajoResponse> generadas = new ArrayList<>();
        LocalDate fechaActual = request.getFechaInicio();

        for (int i = 0; i < request.getCantidadOcurrencias(); i++) {
            OrdenTrabajo ot = OrdenTrabajo.builder()
                    .tipoMantenimiento(tipo)
                    .fechaProgramada(fechaActual)
                    .prioridad(request.getPrioridad())
                    .descripcion(request.getDescripcion())
                    .estado(EstadoOrden.PROGRAMADA)   // las preventivas nacen PROGRAMADAS
                    .build();

            ot = repository.save(ot);
            ot.setCodigo(generarCodigo(ot.getId()));
            ot = repository.save(ot);

            generadas.add(toResponse(ot));
            fechaActual = fechaActual.plusDays(tipo.getPeriodicidadDias());
        }

        return generadas;
    }

    // -------------------------------------------------------------------------
    // RF-04: Asignar técnico validando disponibilidad
    // -------------------------------------------------------------------------

    /**
     * Asigna el técnico indicado a la OT.
     * Regla de disponibilidad: un técnico NO puede tener dos OTs en estado EN_PROCESO
     * para la misma fecha programada.
     */
    @Override
    public OrdenTrabajoResponse asignarTecnico(Long otId, AsignarTecnicoRequest request) {
        OrdenTrabajo ot = buscarOFallar(otId);

        if (ot.getFechaProgramada() != null) {
            boolean ocupado = repository.tecnicoOcupadoEnFecha(
                    request.getTecnicoId(),
                    ot.getFechaProgramada(),
                    otId   // excluye la propia OT (permite reasignación)
            );
            if (ocupado) {
                throw new TecnicoNoDisponibleException(
                        request.getTecnicoId(),
                        ot.getFechaProgramada().toString());
            }
        }

        ot.setTecnicoId(request.getTecnicoId());
        return toResponse(repository.save(ot));
    }

    // -------------------------------------------------------------------------
    // RF-05: Asignar equipos y herramientas a la OT
    // -------------------------------------------------------------------------

    /**
     * Reemplaza la asignación completa de recursos de una OT.
     * Se eliminan los anteriores y se insertan los nuevos para tener
     * una sola fuente de verdad por OT.
     */
    @Override
    public List<OrdenTrabajoRecursoResponse> asignarRecursos(Long otId, AsignarRecursosRequest request) {
        OrdenTrabajo ot = buscarOFallar(otId);

        // Eliminar asignación anterior (reemplazar en bloque)
        recursoRepository.deleteByOrdenTrabajoId(otId);

        List<OrdenTrabajoRecurso> nuevos = new ArrayList<>();

        if (request.getEquipoIds() != null) {
            for (Long equipoId : request.getEquipoIds()) {
                nuevos.add(OrdenTrabajoRecurso.builder()
                        .ordenTrabajo(ot)
                        .equipoId(equipoId)
                        .build());
            }
        }

        if (request.getHerramientaIds() != null) {
            for (Long herramientaId : request.getHerramientaIds()) {
                nuevos.add(OrdenTrabajoRecurso.builder()
                        .ordenTrabajo(ot)
                        .herramientaId(herramientaId)
                        .build());
            }
        }

        return recursoRepository.saveAll(nuevos)
                .stream()
                .map(this::toRecursoResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenTrabajoRecursoResponse> listarRecursos(Long otId) {
        buscarOFallar(otId); // valida que la OT exista
        return recursoRepository.findByOrdenTrabajoId(otId)
                .stream()
                .map(this::toRecursoResponse)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    private OrdenTrabajo buscarOFallar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la orden de trabajo con id " + id));
    }

    private TipoMantenimiento buscarTipoOFallar(Long id) {
        return tipoMantenimientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el tipo de mantenimiento con id " + id));
    }

    private Equipo buscarEquipoOpcional(Long equipoId) {
        if (equipoId == null) {
            return null;
        }

        return equipoRepository.findById(equipoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el equipo con id " + equipoId));
    }

    private String generarCodigo(Long id) {
        return String.format("OT-%05d", id);
    }

    private OrdenTrabajoResponse toResponse(OrdenTrabajo entidad) {
        List<OrdenTrabajoRecursoResponse> recursos =
                recursoRepository.findByOrdenTrabajoId(entidad.getId())
                        .stream()
                        .map(this::toRecursoResponse)
                        .toList();

        return OrdenTrabajoResponse.builder()
                .id(entidad.getId())
                .codigo(entidad.getCodigo())
                .tipoMantenimientoId(entidad.getTipoMantenimiento().getId())
                .tipoMantenimientoNombre(entidad.getTipoMantenimiento().getNombre())
                .equipoId(entidad.getEquipo() != null ? entidad.getEquipo().getId() : null)
                .equipoCodigoPatrimonial(entidad.getEquipo() != null
                        ? entidad.getEquipo().getCodigoPatrimonial()
                        : null)
                .tecnicoId(entidad.getTecnicoId())
                .fechaProgramada(entidad.getFechaProgramada())
                .prioridad(entidad.getPrioridad())
                .estado(entidad.getEstado())
                .descripcion(entidad.getDescripcion())
                .fechaCreacion(entidad.getFechaCreacion())
                .fechaActualizacion(entidad.getFechaActualizacion())
                .recursos(recursos)
                .build();
    }

    private OrdenTrabajoRecursoResponse toRecursoResponse(OrdenTrabajoRecurso r) {
        return OrdenTrabajoRecursoResponse.builder()
                .id(r.getId())
                .equipoId(r.getEquipoId())
                .herramientaId(r.getHerramientaId())
                .fechaAsignacion(r.getFechaAsignacion())
                .build();
    }
}
