package com.pe.service;

import com.pe.dto.AsignarRecursosRequest;
import com.pe.dto.AsignarTecnicoRequest;
import com.pe.dto.OrdenTrabajoRecursoResponse;
import com.pe.dto.OrdenTrabajoRequest;
import com.pe.dto.OrdenTrabajoResponse;
import com.pe.dto.ProgramarMantenimientoRequest;
import com.pe.model.EstadoOrden;

import java.util.List;

public interface OrdenTrabajoService {

    OrdenTrabajoResponse save(OrdenTrabajoRequest request);

    OrdenTrabajoResponse update(Long id, OrdenTrabajoRequest request);

    OrdenTrabajoResponse findById(Long id);

    List<OrdenTrabajoResponse> findAll();

    List<OrdenTrabajoResponse> findByEstado(EstadoOrden estado);

    List<OrdenTrabajoResponse> findByEquipoId(Long equipoId);

    void delete(Long id);

    OrdenTrabajoResponse changeStatus(Long id, EstadoOrden estado);

    /**
     * RF-03: Genera una serie de OTs preventivas a partir de la periodicidad
     * definida en el TipoMantenimiento. Devuelve la lista de OTs creadas.
     */
    List<OrdenTrabajoResponse> programarMantenimientoPreventivo(ProgramarMantenimientoRequest request);

    /**
     * RF-04: Asigna un técnico a la OT validando que no esté ocupado (EN_PROCESO)
     * en la misma fecha programada.
     */
    OrdenTrabajoResponse asignarTecnico(Long otId, AsignarTecnicoRequest request);

    /**
     * RF-05: Asigna equipos y/o herramientas a la OT. Reemplaza la asignación anterior.
     * Devuelve la lista actualizada de recursos de la OT.
     */
    List<OrdenTrabajoRecursoResponse> asignarRecursos(Long otId, AsignarRecursosRequest request);

    /**
     * RF-05: Consulta los equipos y herramientas asignados a una OT.
     */
    List<OrdenTrabajoRecursoResponse> listarRecursos(Long otId);
}

