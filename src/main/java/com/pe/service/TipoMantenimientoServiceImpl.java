package com.pe.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pe.dto.TipoMantenimientoRequest;
import com.pe.dto.TipoMantenimientoResponse;
import com.pe.exception.DuplicateResourceException;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.TipoMantenimiento;
import com.pe.repository.TipoMantenimientoRepository;

import java.util.List;

@Service
@RequiredArgsConstructor 
@Transactional
public class TipoMantenimientoServiceImpl implements TipoMantenimientoService {

    private final TipoMantenimientoRepository repository;

    @Override
    public TipoMantenimientoResponse save(TipoMantenimientoRequest request) {
        if (repository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new DuplicateResourceException(
                    "Ya existe un tipo de mantenimiento con el nombre '" + request.getNombre() + "'");
        }
        TipoMantenimiento entidad = TipoMantenimiento.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .periodicidadDias(request.getPeriodicidadDias())
                .activo(true)
                .build();
        return toResponse(repository.save(entidad));
    }

    @Override
    public TipoMantenimientoResponse update(Long id, TipoMantenimientoRequest request) {
        TipoMantenimiento entidad = buscarOFallar(id);

        repository.findByNombreIgnoreCase(request.getNombre())
                .filter(existente -> !existente.getId().equals(id))
                .ifPresent(existente -> {
                    throw new DuplicateResourceException(
                            "Ya existe otro tipo de mantenimiento con el nombre '" + request.getNombre() + "'");
                });

        entidad.setNombre(request.getNombre());
        entidad.setDescripcion(request.getDescripcion());
        entidad.setPeriodicidadDias(request.getPeriodicidadDias());
        return toResponse(repository.save(entidad));
    }

    @Override
    @Transactional(readOnly = true)
    public TipoMantenimientoResponse findById(Long id) {
        return toResponse(buscarOFallar(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TipoMantenimientoResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TipoMantenimientoResponse> findActive() {
        return repository.findByActivoTrue().stream().map(this::toResponse).toList();
    }

    @Override
    public void delete(Long id) {
        //TODO: Nota: Integreación de otros modulos, la logica será en estados
        TipoMantenimiento entidad = buscarOFallar(id);
        repository.delete(entidad);
    }

    @Override
    public TipoMantenimientoResponse changeStatus(Long id, boolean activo) {
        TipoMantenimiento entidad = buscarOFallar(id);
        entidad.setActivo(activo);
        return toResponse(repository.save(entidad));
    }

    private TipoMantenimiento buscarOFallar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el tipo de mantenimiento con id " + id));
    }

    private TipoMantenimientoResponse toResponse(TipoMantenimiento entidad) {
        return TipoMantenimientoResponse.builder()
                .id(entidad.getId())
                .nombre(entidad.getNombre())
                .descripcion(entidad.getDescripcion())
                .periodicidadDias(entidad.getPeriodicidadDias())
                .activo(entidad.getActivo())
                .fechaCreacion(entidad.getFechaCreacion())
                .fechaActualizacion(entidad.getFechaActualizacion())
                .build();
    }
}
