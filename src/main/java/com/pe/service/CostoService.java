package com.proyectofinal.administracionfinanzas.service;

import com.proyectofinal.administracionfinanzas.model.Costo;
import com.proyectofinal.administracionfinanzas.model.TipoCosto;
import com.proyectofinal.administracionfinanzas.repository.CostoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CostoService {

    @Autowired
    private CostoRepository costoRepository;

    public List<Costo> listar() {
        return costoRepository.findAll();
    }

    public List<Costo> listarPorTipo(TipoCosto tipo) {
        return costoRepository.findByTipo(tipo);
    }

    public Costo obtenerPorId(Long id) {
        return costoRepository.findById(id).orElse(null);
    }

    public Costo guardar(Costo costo) {
        return costoRepository.save(costo);
    }

    public void eliminar(Long id) {
        costoRepository.deleteById(id);
    }
}
