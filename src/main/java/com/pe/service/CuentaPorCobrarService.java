package com.proyectofinal.administracionfinanzas.service;

import com.proyectofinal.administracionfinanzas.model.CuentaPorCobrar;
import com.proyectofinal.administracionfinanzas.repository.CuentaPorCobrarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CuentaPorCobrarService {

    @Autowired
    private CuentaPorCobrarRepository cuentaPorCobrarRepository;

    public List<CuentaPorCobrar> listar() {
        return cuentaPorCobrarRepository.findAll();
    }

    public CuentaPorCobrar obtenerPorId(Long id) {
        return cuentaPorCobrarRepository.findById(id).orElse(null);
    }

    public CuentaPorCobrar guardar(CuentaPorCobrar cuenta) {
        return cuentaPorCobrarRepository.save(cuenta);
    }

    public void eliminar(Long id) {
        cuentaPorCobrarRepository.deleteById(id);
    }
}
