
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
import java.time.LocalDate;
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

    // Registrar un documento del trabajador.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registrar(
            @RequestParam String documentoIdentidad,
            @RequestParam String tipo,
            @RequestParam(required = false) LocalDate fechaVencimiento,
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

    // Listar todos los documentos.
    @GetMapping
    public ResponseEntity<List<Documento>> listar() {
        return ResponseEntity.ok(documentoService.listarTodos());
    }

    // Listar documentos por ID del trabajador.
    @GetMapping("/trabajador/{trabajadorId}")
    public ResponseEntity<List<Documento>> listarPorTrabajador(
            @PathVariable Long trabajadorId) {

        return ResponseEntity.ok(
                documentoService.listarPorTrabajador(trabajadorId)
        );
    }

    // Buscar documentos por DNI del trabajador.
    @GetMapping("/buscar")
    public ResponseEntity<?> buscarPorDocumentoIdentidad(
            @RequestParam String documentoIdentidad) {

        try {
            List<Documento> documentos =
                    documentoService.listarPorDocumentoIdentidad(
                            documentoIdentidad
                    );

            return ResponseEntity.ok(documentos);

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(e.getMessage());

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Listar documentos que vencen dentro del período indicado.
    @GetMapping("/proximos-a-vencer")
    public ResponseEntity<List<Documento>> listarProximosAVencer(
            @RequestParam(defaultValue = "30") int dias) {

        return ResponseEntity.ok(
                documentoService.listarProximosAVencer(dias)
        );
    }

    // Listar documentos vencidos.
    @GetMapping("/vencidos")
    public ResponseEntity<List<Documento>> listarVencidos() {
        return ResponseEntity.ok(
                documentoService.listarVencidos()
        );
    }

    // Abrir el archivo asociado al documento.
    @GetMapping("/{id}/archivo")
    public ResponseEntity<?> descargarArchivo(
            @PathVariable Long id) {

        try {
            Path ruta = documentoService.obtenerRutaArchivo(id);
            Resource recurso = new UrlResource(ruta.toUri());

            if (!recurso.exists() || !recurso.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String nombre = ruta.getFileName().toString();
            String nombreMinusculas = nombre.toLowerCase(
                    java.util.Locale.ROOT
            );

            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

            if (nombreMinusculas.endsWith(".pdf")) {
                mediaType = MediaType.APPLICATION_PDF;

            } else if (nombreMinusculas.endsWith(".jpg")
                    || nombreMinusculas.endsWith(".jpeg")) {
                mediaType = MediaType.IMAGE_JPEG;

            } else if (nombreMinusculas.endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;

            } else if (nombreMinusculas.endsWith(".doc")) {
                mediaType = MediaType.parseMediaType(
                        "application/msword"
                );

            } else if (nombreMinusculas.endsWith(".docx")) {
                mediaType = MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + nombre + "\""
                    )
                    .body(recurso);

        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("No se pudo leer el archivo.");
        }
    }
}
