package com.pe.controller;

import com.pe.dto.AsignarHerramientaRequest;
import com.pe.dto.HerramientaAsignacionResponse;
import com.pe.service.HerramientaAsignacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/herramientas")
@RequiredArgsConstructor
public class HerramientaAsignacionController {

    private final HerramientaAsignacionService asignacionService;

    @PostMapping("/{herramientaId}/asignaciones")
    public ResponseEntity<HerramientaAsignacionResponse> asignar(
            @PathVariable Long herramientaId,
            @Valid @RequestBody AsignarHerramientaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(asignacionService.asignar(herramientaId, request));
    }

    @PostMapping("/asignaciones/{asignacionId}/devolucion")
    public ResponseEntity<HerramientaAsignacionResponse> registrarDevolucion(
            @PathVariable Long asignacionId) {
        return ResponseEntity.ok(asignacionService.registrarDevolucion(asignacionId));
    }

    @GetMapping("/{herramientaId}/asignaciones")
    public ResponseEntity<List<HerramientaAsignacionResponse>> listarHistorial(
            @PathVariable Long herramientaId) {
        return ResponseEntity.ok(asignacionService.listarHistorial(herramientaId));
    }
}
