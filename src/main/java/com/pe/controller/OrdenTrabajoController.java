package com.pe.controller;

import com.pe.dto.AsignarRecursosRequest;
import com.pe.dto.AsignarTecnicoRequest;
import com.pe.dto.OrdenTrabajoRecursoResponse;
import com.pe.dto.OrdenTrabajoRequest;
import com.pe.dto.OrdenTrabajoResponse;
import com.pe.dto.ProgramarMantenimientoRequest;
import com.pe.model.EstadoOrden;
import com.pe.service.OrdenTrabajoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ordenes-trabajo")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService service;

    // -----------------------------------------------------------------------
    // RF-02: CRUD
    // -----------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<OrdenTrabajoResponse> save(@Valid @RequestBody OrdenTrabajoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrdenTrabajoResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody OrdenTrabajoRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdenTrabajoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<OrdenTrabajoResponse>> findAll(
            @RequestParam(required = false) EstadoOrden estado) {
        return ResponseEntity.ok(estado != null ? service.findByEstado(estado) : service.findAll());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<OrdenTrabajoResponse> changeStatus(@PathVariable Long id,
                                                              @RequestParam EstadoOrden estado) {
        return ResponseEntity.ok(service.changeStatus(id, estado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------------
    // RF-03: Programar mantenimientos preventivos en serie
    // -----------------------------------------------------------------------

    /**
     * POST /api/v1/ordenes-trabajo/programar-preventivo
     * Genera N órdenes de trabajo según la periodicidad del tipo de mantenimiento.
     *
     * Body ejemplo:
     * {
     *   "tipoMantenimientoId": 1,
     *   "fechaInicio": "2026-11-01",
     *   "cantidadOcurrencias": 3,
     *   "prioridad": "MEDIA",
     *   "descripcion": "Mantenimiento mensual de compresor"
     * }
     */
    @PostMapping("/programar-preventivo")
    public ResponseEntity<List<OrdenTrabajoResponse>> programarPreventivo(
            @Valid @RequestBody ProgramarMantenimientoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.programarMantenimientoPreventivo(request));
    }

    // -----------------------------------------------------------------------
    // RF-04: Asignar técnico a la OT
    // -----------------------------------------------------------------------

    /**
     * PATCH /api/v1/ordenes-trabajo/{id}/tecnico
     * Asigna un técnico a la OT, validando que no esté EN_PROCESO ese día.
     *
     * Body ejemplo:
     * { "tecnicoId": 7 }
     */
    @PatchMapping("/{id}/tecnico")
    public ResponseEntity<OrdenTrabajoResponse> asignarTecnico(
            @PathVariable Long id,
            @Valid @RequestBody AsignarTecnicoRequest request) {
        return ResponseEntity.ok(service.asignarTecnico(id, request));
    }

    // -----------------------------------------------------------------------
    // RF-05: Asignar equipos y herramientas a la OT
    // -----------------------------------------------------------------------

    /**
     * PUT /api/v1/ordenes-trabajo/{id}/recursos
     * Reemplaza los equipos y herramientas asignados a la OT.
     *
     * Body ejemplo:
     * {
     *   "equipoIds": [1, 3],
     *   "herramientaIds": [10, 12]
     * }
     */
    @PutMapping("/{id}/recursos")
    public ResponseEntity<List<OrdenTrabajoRecursoResponse>> asignarRecursos(
            @PathVariable Long id,
            @RequestBody AsignarRecursosRequest request) {
        return ResponseEntity.ok(service.asignarRecursos(id, request));
    }

    /**
     * GET /api/v1/ordenes-trabajo/{id}/recursos
     * Consulta los equipos y herramientas asignados a una OT.
     */
    @GetMapping("/{id}/recursos")
    public ResponseEntity<List<OrdenTrabajoRecursoResponse>> listarRecursos(@PathVariable Long id) {
        return ResponseEntity.ok(service.listarRecursos(id));
    }
}

