package com.proyectofinal.administracionfinanzas.service;

import com.proyectofinal.administracionfinanzas.model.Gasto;
import com.proyectofinal.administracionfinanzas.repository.GastoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GastoService {

    @Autowired
    private GastoRepository gastoRepository;

    public List<Gasto> listar() {
        return gastoRepository.findAll();
    }

    public Gasto obtenerPorId(Long id) {
        return gastoRepository.findById(id).orElse(null);
    }

    public Gasto guardar(Gasto gasto) {
        return gastoRepository.save(gasto);
    }

    public void eliminar(Long id) {
        gastoRepository.deleteById(id);
    }
}
