package com.pe.controller;

import com.pe.dto.OrdenTrabajoRequest;
import com.pe.dto.OrdenTrabajoResponse;
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
}
