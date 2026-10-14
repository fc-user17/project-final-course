package com.pe.recursos_humanos.asistencia;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/asistencia")
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService) {
        this.asistenciaService = asistenciaService;
    }

    @PostMapping("/marcar")
    public ResponseEntity<?> marcar(@RequestBody MarcarRequest request) {
        try {
            Marcacion registrada = asistenciaService.marcar(
                    request.documentoIdentidad(),
                    request.tipo(),
                    request.fechaHora()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(registrada);

        } catch (NoSuchElementException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Marcacion>> listar() {
        return ResponseEntity.ok(
                asistenciaService.listarTodas()
        );
    }

    @GetMapping("/trabajador/{trabajadorId}")
    public ResponseEntity<List<Marcacion>> listarPorTrabajador(
            @PathVariable Long trabajadorId) {

        return ResponseEntity.ok(
                asistenciaService.listarPorTrabajador(trabajadorId)
        );
    }
}
