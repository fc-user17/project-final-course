package com.proyectofinal.administracionfinanzas.controller;

import com.proyectofinal.administracionfinanzas.model.CuentaPorCobrar;
import com.proyectofinal.administracionfinanzas.service.CuentaPorCobrarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cuentas-por-cobrar")
public class CuentaPorCobrarController {

    @Autowired
    private CuentaPorCobrarService cuentaPorCobrarService;

    @GetMapping
    public List<CuentaPorCobrar> listar() {
        return cuentaPorCobrarService.listar();
    }

    @GetMapping("/{id}")
    public CuentaPorCobrar obtener(@PathVariable Long id) {
        return cuentaPorCobrarService.obtenerPorId(id);
    }

    @PostMapping
    public CuentaPorCobrar crear(@RequestBody CuentaPorCobrar cuenta) {
        return cuentaPorCobrarService.guardar(cuenta);
    }

    @PutMapping("/{id}")
    public CuentaPorCobrar actualizar(@PathVariable Long id, @RequestBody CuentaPorCobrar cuenta) {
        cuenta.setId(id);
        return cuentaPorCobrarService.guardar(cuenta);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        cuentaPorCobrarService.eliminar(id);
    }
}
