
package com.pe.recursos_humanos.asistencia;

import com.pe.security.UserDetailsImpl;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    // =========================================
    // REGISTRAR MARCACIÓN DEL TRABAJADOR
    // =========================================

    @PostMapping(
        value = "/marcar",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('TRABAJADOR')")
    public ResponseEntity<?> marcar(
            @AuthenticationPrincipal UserDetailsImpl usuario,
            @RequestParam("tipo") TipoMarcacion tipo,
            @RequestParam("foto") MultipartFile foto) {

        try {

            if (usuario == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("mensaje", "Sesión no válida."));
            }

            if (tipo == null) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "El tipo de marcación es obligatorio.")
                );
            }

            if (foto == null || foto.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "La fotografía es obligatoria.")
                );
            }

            if (foto.getSize() > 2 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "La fotografía no debe superar los 2 MB.")
                );
            }

            Marcacion registrada =
                    asistenciaService.marcarConFotoPorUsuario(
                            usuario.getId(),
                            tipo,
                            foto.getBytes()
                    );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(registrada);

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
                Map.of("mensaje", "No se pudo procesar la fotografía.")
            );
        }
    }

    // =========================================
    // CONSULTAR MIS MARCACIONES
    // =========================================

    @GetMapping("/mis-marcaciones")
    @PreAuthorize("hasRole('TRABAJADOR')")
    public ResponseEntity<?> listarMisMarcaciones(
            @AuthenticationPrincipal UserDetailsImpl usuario) {

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Sesión no válida."));
        }

        try {

            List<Marcacion> marcaciones =
                    asistenciaService.listarPorUsuario(usuario.getId());

            return ResponseEntity.ok(marcaciones);

        } catch (NoSuchElementException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of("mensaje", e.getMessage())
            );
        }
    }

    // =========================================
    // LISTAR TODAS LAS MARCACIONES - RR. HH.
    // =========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Marcacion>> listar() {

        List<Marcacion> marcaciones =
                asistenciaService.listarTodas();

        return ResponseEntity.ok(marcaciones);
    }

    // =========================================
    // LISTAR POR TRABAJADOR - RR. HH.
    // =========================================

    @GetMapping("/trabajador/{trabajadorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> listarPorTrabajador(
            @PathVariable Long trabajadorId) {

        if (trabajadorId == null || trabajadorId <= 0) {
            return ResponseEntity.badRequest().body(
                Map.of("mensaje", "El ID del trabajador no es válido.")
            );
        }

        List<Marcacion> marcaciones =
                asistenciaService.listarPorTrabajador(trabajadorId);

        return ResponseEntity.ok(marcaciones);
    }
}
