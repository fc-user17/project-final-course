
package com.pe.recursos_humanos.asistencia;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/asistencia")
@CrossOrigin(origins = {
    "http://localhost:5500",
    "http://127.0.0.1:5500"
})
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService) {
        this.asistenciaService = asistenciaService;
    }

    // Registrar una marcación con fotografía.
    @PostMapping(
        value = "/marcar",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> marcar(
            @RequestParam("documentoIdentidad") String documentoIdentidad,
            @RequestParam("tipo") TipoMarcacion tipo,
            @RequestParam("foto") MultipartFile foto) {

        try {
            if (documentoIdentidad == null
                    || documentoIdentidad.isBlank()) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "El documento de identidad es obligatorio")
                );
            }

            if (tipo == null) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "El tipo de marcación es obligatorio")
                );
            }

            if (foto == null || foto.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "La fotografía es obligatoria")
                );
            }

            if (foto.getSize() > 2 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "La fotografía no debe superar los 2 MB")
                );
            }

            Marcacion registrada = asistenciaService.marcarConFoto(
                documentoIdentidad.trim(),
                tipo,
                foto.getBytes()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(registrada);

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of("mensaje", e.getMessage())
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("mensaje", e.getMessage())
            );

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("mensaje", "No se pudo procesar la fotografía")
            );
        }
    }

    // Listar todas las marcaciones.
    @GetMapping
    public ResponseEntity<List<Marcacion>> listar() {
        List<Marcacion> marcaciones = asistenciaService.listarTodas();
        return ResponseEntity.ok(marcaciones);
    }

    // Listar marcaciones por trabajador.
    @GetMapping("/trabajador/{trabajadorId}")
    public ResponseEntity<List<Marcacion>> listarPorTrabajador(
            @PathVariable Long trabajadorId) {

        if (trabajadorId == null || trabajadorId <= 0) {
            return ResponseEntity.badRequest().build();
        }

        List<Marcacion> marcaciones =
            asistenciaService.listarPorTrabajador(trabajadorId);

        return ResponseEntity.ok(marcaciones);
    }
}
