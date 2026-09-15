package com.pe.service;

import com.pe.dto.OrdenTrabajoRequest;
import com.pe.dto.OrdenTrabajoResponse;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.EstadoOrden;
import com.pe.model.OrdenTrabajo;
import com.pe.model.TipoMantenimiento;
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

    @Override
    public OrdenTrabajoResponse save(OrdenTrabajoRequest request) {
        TipoMantenimiento tipo = tipoMantenimientoRepository.findById(request.getTipoMantenimientoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el tipo de mantenimiento con id " + request.getTipoMantenimientoId()));

        OrdenTrabajo entidad = OrdenTrabajo.builder()
                .tipoMantenimiento(tipo)
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

        TipoMantenimiento tipo = tipoMantenimientoRepository.findById(request.getTipoMantenimientoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el tipo de mantenimiento con id " + request.getTipoMantenimientoId()));

        entidad.setTipoMantenimiento(tipo);
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

    private OrdenTrabajo buscarOFallar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la orden de trabajo con id " + id));
    }

    private String generarCodigo(Long id) {
        return String.format("OT-%05d", id);
    }

    private OrdenTrabajoResponse toResponse(OrdenTrabajo entidad) {
        return OrdenTrabajoResponse.builder()
                .id(entidad.getId())
                .codigo(entidad.getCodigo())
                .tipoMantenimientoId(entidad.getTipoMantenimiento().getId())
                .tipoMantenimientoNombre(entidad.getTipoMantenimiento().getNombre())
                .tecnicoId(entidad.getTecnicoId())
                .fechaProgramada(entidad.getFechaProgramada())
                .prioridad(entidad.getPrioridad())
                .estado(entidad.getEstado())
                .descripcion(entidad.getDescripcion())
                .fechaCreacion(entidad.getFechaCreacion())
                .fechaActualizacion(entidad.getFechaActualizacion())
                .build();
    }
}
