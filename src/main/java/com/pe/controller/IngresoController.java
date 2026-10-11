package com.proyectofinal.administracionfinanzas.controller;

import com.proyectofinal.administracionfinanzas.model.Ingreso;
import com.proyectofinal.administracionfinanzas.service.IngresoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingresos")
public class IngresoController {

    @Autowired
    private IngresoService ingresoService;

    @GetMapping
    public List<Ingreso> listar() {
        return ingresoService.listar();
    }

    @GetMapping("/{id}")
    public Ingreso obtener(@PathVariable Long id) {
        return ingresoService.obtenerPorId(id);
    }

    @PostMapping
    public Ingreso crear(@RequestBody Ingreso ingreso) {
        return ingresoService.guardar(ingreso);
    }

    @PutMapping("/{id}")
    public Ingreso actualizar(@PathVariable Long id, @RequestBody Ingreso ingreso) {
        ingreso.setId(id);
        return ingresoService.guardar(ingreso);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        ingresoService.eliminar(id);
    }
}
