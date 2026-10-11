package com.proyectofinal.administracionfinanzas.controller;

import com.proyectofinal.administracionfinanzas.model.Gasto;
import com.proyectofinal.administracionfinanzas.service.GastoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    @Autowired
    private GastoService gastoService;

    @GetMapping
    public List<Gasto> listar() {
        return gastoService.listar();
    }

    @GetMapping("/{id}")
    public Gasto obtener(@PathVariable Long id) {
        return gastoService.obtenerPorId(id);
    }

    @PostMapping
    public Gasto crear(@RequestBody Gasto gasto) {
        return gastoService.guardar(gasto);
    }

    @PutMapping("/{id}")
    public Gasto actualizar(@PathVariable Long id, @RequestBody Gasto gasto) {
        gasto.setId(id);
        return gastoService.guardar(gasto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        gastoService.eliminar(id);
    }
}
