package com.proyectofinal.administracionfinanzas.controller;

import com.proyectofinal.administracionfinanzas.model.Presupuesto;
import com.proyectofinal.administracionfinanzas.service.PresupuestoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {

    @Autowired
    private PresupuestoService presupuestoService;

    @GetMapping
    public List<Presupuesto> listar() {
        return presupuestoService.listar();
    }

    @GetMapping("/{id}")
    public Presupuesto obtener(@PathVariable Long id) {
        return presupuestoService.obtenerPorId(id);
    }

    @PostMapping
    public Presupuesto crear(@RequestBody Presupuesto presupuesto) {
        return presupuestoService.guardar(presupuesto);
    }

    @PutMapping("/{id}")
    public Presupuesto actualizar(@PathVariable Long id, @RequestBody Presupuesto presupuesto) {
        presupuesto.setId(id);
        return presupuestoService.guardar(presupuesto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        presupuestoService.eliminar(id);
    }
}
