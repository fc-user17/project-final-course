package com.pe.service;

import com.pe.dto.AsignarRecursosRequest;
import com.pe.dto.AsignarTecnicoRequest;
import com.pe.dto.OrdenTrabajoRecursoResponse;
import com.pe.dto.OrdenTrabajoRequest;
import com.pe.dto.OrdenTrabajoResponse;
import com.pe.dto.ProgramarMantenimientoRequest;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.Equipo;
import com.pe.model.EstadoOrden;
import com.pe.model.OrdenTrabajo;
import com.pe.model.TipoMantenimiento;
import com.pe.repository.EquipoRepository;
import com.pe.repository.OrdenTrabajoRecursoRepository;
import com.pe.repository.OrdenTrabajoRepository;
import com.pe.repository.TipoMantenimientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        TipoMantenimiento tipo =
                buscarTipoOFallar(request.getTipoMantenimientoId());

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
    public OrdenTrabajoResponse update(
            Long id, OrdenTrabajoRequest request) {

        OrdenTrabajo entidad = buscarOFallar(id);
        TipoMantenimiento tipo =
                buscarTipoOFallar(request.getTipoMantenimientoId());
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
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> findByEstado(EstadoOrden estado) {
        return repository.findByEstado(estado)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenTrabajoResponse> findByEquipoId(Long equipoId) {
        if (!equipoRepository.existsById(equipoId)) {
            throw new ResourceNotFoundException(
                    "No se encontró el equipo con id " + equipoId);
        }

        return repository.findByEquipoId(equipoId)
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
    public OrdenTrabajoResponse changeStatus(
            Long id, EstadoOrden estado) {

        OrdenTrabajo entidad = buscarOFallar(id);
        entidad.setEstado(estado);

        return toResponse(repository.save(entidad));
    }

    @Override
    public List<OrdenTrabajoResponse> programarMantenimientoPreventivo(
            ProgramarMantenimientoRequest request) {

        throw new UnsupportedOperationException(
                "Pendiente de implementar con los campos de "
                + "ProgramarMantenimientoRequest");
    }

    @Override
    public OrdenTrabajoResponse asignarTecnico(
            Long otId, AsignarTecnicoRequest request) {

        throw new UnsupportedOperationException(
                "Pendiente de implementar con el modelo y repositorio de Técnico");
    }

    @Override
    public List<OrdenTrabajoRecursoResponse> asignarRecursos(
            Long otId, AsignarRecursosRequest request) {

        throw new UnsupportedOperationException(
                "Pendiente de implementar con los campos de "
                + "AsignarRecursosRequest y OrdenTrabajoRecurso");
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenTrabajoRecursoResponse> listarRecursos(Long otId) {
        throw new UnsupportedOperationException(
                "Pendiente de implementar con OrdenTrabajoRecursoRepository");
    }

    private OrdenTrabajo buscarOFallar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la orden de trabajo con id " + id));
    }

    private TipoMantenimiento buscarTipoOFallar(Long id) {
        return tipoMantenimientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el tipo de mantenimiento con id " + id));
    }

    private Equipo buscarEquipoOpcional(Long id) {
        if (id == null) {
            return null;
        }

        return equipoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el equipo con id " + id));
    }

    private String generarCodigo(Long id) {
        return String.format("OT-%06d", id);
    }

    private OrdenTrabajoResponse toResponse(OrdenTrabajo entidad) {
        return OrdenTrabajoResponse.builder()
                .id(entidad.getId())
                .codigo(entidad.getCodigo())
                .fechaProgramada(entidad.getFechaProgramada())
                .prioridad(entidad.getPrioridad())
                .descripcion(entidad.getDescripcion())
                .estado(entidad.getEstado())
                .build();
    }
}