
package com.pe.recursos_humanos.documentos;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = {
    "http://127.0.0.1:5500",
    "http://localhost:5500"
})
@RequestMapping("/api/documentos")
public class DocumentoController {

    private final DocumentoService documentoService;

    public DocumentoController(DocumentoService documentoService) {
        this.documentoService = documentoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registrar(
            @RequestParam String documentoIdentidad,
            @RequestParam String tipo,
            @RequestParam java.time.LocalDate fechaVencimiento,
            @RequestParam MultipartFile archivoDocumento) {

        try {
            Documento creado = documentoService.registrar(
                    documentoIdentidad,
                    tipo,
                    fechaVencimiento,
                    archivoDocumento
            );

            return ResponseEntity.status(201).body(creado);

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(e.getMessage());

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError()
                    .body("No se pudo guardar el documento.");
        }
    }

    @GetMapping
    public ResponseEntity<List<Documento>> listar() {
        return ResponseEntity.ok(documentoService.listarTodos());
    }

    @GetMapping("/trabajador/{trabajadorId}")
    public ResponseEntity<List<Documento>> listarPorTrabajador(
            @PathVariable Long trabajadorId) {
        return ResponseEntity.ok(
                documentoService.listarPorTrabajador(trabajadorId));
    }

    @GetMapping("/proximos-a-vencer")
    public ResponseEntity<List<Documento>> listarProximosAVencer(
            @RequestParam(defaultValue = "30") int dias) {
        return ResponseEntity.ok(
                documentoService.listarProximosAVencer(dias));
    }

    @GetMapping("/vencidos")
    public ResponseEntity<List<Documento>> listarVencidos() {
        return ResponseEntity.ok(documentoService.listarVencidos());
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<?> descargarArchivo(@PathVariable Long id) {
        try {
            Path ruta = documentoService.obtenerRutaArchivo(id);
            Resource recurso = new UrlResource(ruta.toUri());

            String tipoContenido = Files.probeContentType(ruta);
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

            if ("application/pdf".equals(tipoContenido)) {
                mediaType = MediaType.APPLICATION_PDF;
            } else if ("image/jpeg".equals(tipoContenido)) {
                mediaType = MediaType.IMAGE_JPEG;
            } else if ("image/png".equals(tipoContenido)) {
                mediaType = MediaType.IMAGE_PNG;
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + ruta.getFileName() + "\"")
                    .body(recurso);

        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("No se pudo leer el archivo.");
        }
    }
}
