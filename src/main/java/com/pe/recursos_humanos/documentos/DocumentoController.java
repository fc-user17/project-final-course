package com.pe.recursos_humanos.documentos;

import com.pe.recursos_humanos.documentos.Documento;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "http://127.0.0.1:5500")
@RequestMapping("/api/documentos")
public class DocumentoController {

    private final DocumentoService documentoService;

    public DocumentoController(DocumentoService documentoService) {
        this.documentoService = documentoService;
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody RegistrarDocumentoRequest request) {
        try {
            Documento creado = documentoService.registrar(
                    request.documentoIdentidad(), request.tipo(), request.fechaVencimiento());
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Documento>> listar() {
        return ResponseEntity.ok(documentoService.listarTodos());
    }

    @GetMapping("/trabajador/{trabajadorId}")
    public ResponseEntity<List<Documento>> listarPorTrabajador(@PathVariable Long trabajadorId) {
        return ResponseEntity.ok(documentoService.listarPorTrabajador(trabajadorId));
    }

    @GetMapping("/proximos-a-vencer")
    public ResponseEntity<List<Documento>> listarProximosAVencer(
            @RequestParam(defaultValue = "30") int dias) {
        return ResponseEntity.ok(documentoService.listarProximosAVencer(dias));
    }

    @GetMapping("/vencidos")
    public ResponseEntity<List<Documento>> listarVencidos() {
        return ResponseEntity.ok(documentoService.listarVencidos());
    }
}
