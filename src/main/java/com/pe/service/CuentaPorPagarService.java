package com.proyectofinal.administracionfinanzas.service;

import com.proyectofinal.administracionfinanzas.model.CuentaPorPagar;
import com.proyectofinal.administracionfinanzas.repository.CuentaPorPagarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CuentaPorPagarService {

    @Autowired
    private CuentaPorPagarRepository cuentaPorPagarRepository;

    public List<CuentaPorPagar> listar() {
        return cuentaPorPagarRepository.findAll();
    }

    public CuentaPorPagar obtenerPorId(Long id) {
        return cuentaPorPagarRepository.findById(id).orElse(null);
    }

    public CuentaPorPagar guardar(CuentaPorPagar cuenta) {
        return cuentaPorPagarRepository.save(cuenta);
    }

    public void eliminar(Long id) {
        cuentaPorPagarRepository.deleteById(id);
    }
}
