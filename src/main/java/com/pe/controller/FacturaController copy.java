package com.proyectofinal.administracionfinanzas.controller;

import com.proyectofinal.administracionfinanzas.model.Factura;
import com.proyectofinal.administracionfinanzas.service.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

    @Autowired
    private FacturaService facturaService;

    @GetMapping
    public List<Factura> listar() {
        return facturaService.listar();
    }

    @GetMapping("/{id}")
    public Factura obtener(@PathVariable Long id) {
        return facturaService.obtenerPorId(id);
    }

    @PostMapping
    public Factura crear(@RequestBody Factura factura) {
        return facturaService.guardar(factura);
    }

    @PutMapping("/{id}")
    public Factura actualizar(@PathVariable Long id, @RequestBody Factura factura) {
        factura.setId(id);
        return facturaService.guardar(factura);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        facturaService.eliminar(id);
    }
}
