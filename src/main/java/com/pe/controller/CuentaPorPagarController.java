package com.proyectofinal.administracionfinanzas.controller;

import com.proyectofinal.administracionfinanzas.model.CuentaPorPagar;
import com.proyectofinal.administracionfinanzas.service.CuentaPorPagarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cuentas-por-pagar")
public class CuentaPorPagarController {

    @Autowired
    private CuentaPorPagarService cuentaPorPagarService;

    @GetMapping
    public List<CuentaPorPagar> listar() {
        return cuentaPorPagarService.listar();
    }

    @GetMapping("/{id}")
    public CuentaPorPagar obtener(@PathVariable Long id) {
        return cuentaPorPagarService.obtenerPorId(id);
    }

    @PostMapping
    public CuentaPorPagar crear(@RequestBody CuentaPorPagar cuenta) {
        return cuentaPorPagarService.guardar(cuenta);
    }

    @PutMapping("/{id}")
    public CuentaPorPagar actualizar(@PathVariable Long id, @RequestBody CuentaPorPagar cuenta) {
        cuenta.setId(id);
        return cuentaPorPagarService.guardar(cuenta);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        cuentaPorPagarService.eliminar(id);
    }
}
