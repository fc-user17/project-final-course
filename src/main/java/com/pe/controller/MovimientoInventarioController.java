package com.pe.controller;

import com.pe.dto.MovimientoInventarioRequest;
import com.pe.model.MovimientoInventario;
import com.pe.service.MovimientoInventarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimientos-inventario")
public class MovimientoInventarioController {

    private final MovimientoInventarioService movimientoService;

    public MovimientoInventarioController(MovimientoInventarioService movimientoService) {
        this.movimientoService = movimientoService;
    }

    @PostMapping
    public ResponseEntity<MovimientoInventario> registrarMovimiento(
            @Valid @RequestBody MovimientoInventarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(movimientoService.registrarMovimiento(request));
    }

    @GetMapping
    public ResponseEntity<List<MovimientoInventario>> listarMovimientos() {
        return ResponseEntity.ok(movimientoService.listarMovimientos());
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<MovimientoInventario>> listarMovimientosPorProducto(
            @PathVariable Long productoId) {
        return ResponseEntity.ok(movimientoService.listarMovimientosPorProducto(productoId));
    }
}
