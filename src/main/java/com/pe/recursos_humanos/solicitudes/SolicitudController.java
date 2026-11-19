
package com.pe.recursos_humanos.solicitudes;

import com.pe.security.UserDetailsImpl;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = {
    "http://localhost:5500",
    "http://127.0.0.1:5500"
})
public class SolicitudController {

    private final SolicitudService solicitudService;

    public SolicitudController(SolicitudService solicitudService) {
        this.solicitudService = solicitudService;
    }

    // =========================================
    // REGISTRAR SOLICITUD - TRABAJADOR
    // =========================================

    @PostMapping
    @PreAuthorize("hasRole('TRABAJADOR')")
    public ResponseEntity<?> registrar(
            @AuthenticationPrincipal UserDetailsImpl usuario,
            @RequestBody Map<String, String> datos) {

        try {

            if (usuario == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("mensaje", "Sesión no válida."));
            }

            if (datos == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("mensaje", "Debes enviar los datos de la solicitud."));
            }

            String tipoTexto = datos.get("tipo");

            if (tipoTexto == null || tipoTexto.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("mensaje", "Debes seleccionar el tipo de solicitud."));
            }

            TipoSolicitud tipo = TipoSolicitud.valueOf(
                    tipoTexto.trim().toUpperCase());

            LocalDate fechaInicio = LocalDate.parse(
                    datos.get("fechaInicio"));

            LocalDate fechaFin = LocalDate.parse(
                    datos.get("fechaFin"));

            String motivo = datos.get("motivo");

            SolicitudRespuesta solicitud = solicitudService.registrar(
                    usuario.getId(),
                    tipo,
                    fechaInicio,
                    fechaFin,
                    motivo
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(solicitud);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "Verifica los datos: " + e.getMessage())
            );

        } catch (NoSuchElementException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("mensaje", e.getMessage())
            );

        } catch (NullPointerException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("mensaje", "Faltan datos obligatorios.")
            );
        }
    }

    // =========================================
    // CONSULTAR MIS SOLICITUDES - TRABAJADOR
    // =========================================

    @GetMapping("/mis-solicitudes")
    @PreAuthorize("hasRole('TRABAJADOR')")
    public ResponseEntity<?> listarMisSolicitudes(
            @AuthenticationPrincipal UserDetailsImpl usuario) {

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Sesión no válida."));
        }

        try {

            List<SolicitudRespuesta> solicitudes =
                    solicitudService.listarPorUsuario(usuario.getId());

            return ResponseEntity.ok(solicitudes);

        } catch (NoSuchElementException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    // =========================================
    // CONSULTAR TODAS LAS SOLICITUDES - RR. HH.
    // =========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SolicitudRespuesta>> listarTodas() {

        List<SolicitudRespuesta> solicitudes =
                solicitudService.listarTodas();

        return ResponseEntity.ok(solicitudes);
    }

    // =========================================
    // APROBAR SOLICITUD - RR. HH.
    // =========================================

    @PutMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> aprobar(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> datos) {

        try {

            String observacion = datos == null
                    ? null
                    : datos.get("observacion");

            SolicitudRespuesta solicitud =
                    solicitudService.aprobar(id, observacion);

            return ResponseEntity.ok(solicitud);

        } catch (NoSuchElementException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", e.getMessage()));

        } catch (IllegalStateException | IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    // =========================================
    // RECHAZAR SOLICITUD - RR. HH.
    // =========================================

    @PutMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rechazar(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> datos) {

        try {

            String observacion = datos == null
                    ? null
                    : datos.get("observacion");

            SolicitudRespuesta solicitud =
                    solicitudService.rechazar(id, observacion);

            return ResponseEntity.ok(solicitud);

        } catch (NoSuchElementException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", e.getMessage()));

        } catch (IllegalStateException | IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }
}
