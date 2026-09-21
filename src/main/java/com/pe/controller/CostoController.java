package com.proyectofinal.administracionfinanzas.controller;

import com.proyectofinal.administracionfinanzas.model.Costo;
import com.proyectofinal.administracionfinanzas.model.TipoCosto;
import com.proyectofinal.administracionfinanzas.service.CostoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/costos")
public class CostoController {

    @Autowired
    private CostoService costoService;

    @GetMapping
    public List<Costo> listar(@RequestParam(required = false) TipoCosto tipo) {
        if (tipo != null) {
            return costoService.listarPorTipo(tipo);
        }
        return costoService.listar();
    }

    @GetMapping("/{id}")
    public Costo obtener(@PathVariable Long id) {
        return costoService.obtenerPorId(id);
    }

    @PostMapping
    public Costo crear(@RequestBody Costo costo) {
        return costoService.guardar(costo);
    }

    @PutMapping("/{id}")
    public Costo actualizar(@PathVariable Long id, @RequestBody Costo costo) {
        costo.setId(id);
        return costoService.guardar(costo);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        costoService.eliminar(id);
    }
}
