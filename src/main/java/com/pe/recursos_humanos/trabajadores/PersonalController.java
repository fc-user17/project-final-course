package com.pe.recursos_humanos.trabajadores;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/personal")
public class PersonalController {

    private final PersonalService personalService;

    public PersonalController(PersonalService personalService) {
        this.personalService = personalService;
    }

    @GetMapping
    public ResponseEntity<List<Trabajador>> listar(
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(personalService.listar(area, estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trabajador> obtener(@PathVariable Long id) {
        return personalService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

@PostMapping
public ResponseEntity<?> registrar(@RequestBody Trabajador nuevo) {

    System.out.println("NOMBRES: " + nuevo.getNombres());
    System.out.println("DOCUMENTO: " + nuevo.getDocumentoIdentidad());
    System.out.println("CARGO: " + nuevo.getCargo());
    System.out.println("AREA: " + nuevo.getArea());
    System.out.println("ESTADO: " + nuevo.getEstado());

    try {
        Trabajador creado = personalService.registrar(nuevo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    } catch (IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }
}

    @PutMapping("/{id}")
    public ResponseEntity<Trabajador> actualizar(@PathVariable Long id, @RequestBody Trabajador cambios) {
        return personalService.actualizar(id, cambios)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        boolean eliminado = personalService.eliminar(id);
        return eliminado ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
