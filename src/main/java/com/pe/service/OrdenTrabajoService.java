package com.pe.service;

import com.pe.dto.OrdenTrabajoRequest;
import com.pe.dto.OrdenTrabajoResponse;
import com.pe.model.EstadoOrden;

import java.util.List;

public interface OrdenTrabajoService {

    OrdenTrabajoResponse save(OrdenTrabajoRequest request);

    OrdenTrabajoResponse update(Long id, OrdenTrabajoRequest request);

    OrdenTrabajoResponse findById(Long id);

    List<OrdenTrabajoResponse> findAll();

    List<OrdenTrabajoResponse> findByEstado(EstadoOrden estado);

    void delete(Long id);

    OrdenTrabajoResponse changeStatus(Long id, EstadoOrden estado);
}
