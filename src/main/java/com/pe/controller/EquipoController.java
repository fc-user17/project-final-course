package com.pe.controller;

import com.pe.dto.EquipoRequest;
import com.pe.dto.EquipoResponse;
import com.pe.service.EquipoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService equipoService;

    @PostMapping
    public ResponseEntity<EquipoResponse> registrar(@Valid @RequestBody EquipoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipoService.registrar(request));
    }

    @GetMapping
    public ResponseEntity<List<EquipoResponse>> listar() {
        return ResponseEntity.ok(equipoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(equipoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EquipoRequest request) {
        return ResponseEntity.ok(equipoService.actualizar(id, request));
    }
}
