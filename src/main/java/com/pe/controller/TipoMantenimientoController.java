package com.pe.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pe.dto.TipoMantenimientoRequest;
import com.pe.dto.TipoMantenimientoResponse;
import com.pe.service.TipoMantenimientoService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tipos-mantenimiento")
@RequiredArgsConstructor
public class TipoMantenimientoController {

    private final TipoMantenimientoService service;

    @PostMapping
    public ResponseEntity<TipoMantenimientoResponse> save(@Valid @RequestBody TipoMantenimientoRequest request) {
        TipoMantenimientoResponse creado = service.save(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TipoMantenimientoResponse> update(@PathVariable Long id,
                                                                 @Valid @RequestBody TipoMantenimientoRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoMantenimientoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<TipoMantenimientoResponse>> findAll(
            @RequestParam(value = "soloActivos", defaultValue = "false") boolean soloActivos) {
        return ResponseEntity.ok(soloActivos ? service.findActive() : service.findAll());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<TipoMantenimientoResponse> changeStatus(@PathVariable Long id,
                                                                    @RequestParam boolean activo) {
        return ResponseEntity.ok(service.changeStatus(id, activo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
