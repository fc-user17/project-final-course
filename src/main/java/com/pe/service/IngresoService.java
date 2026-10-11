package com.proyectofinal.administracionfinanzas.service;

import com.proyectofinal.administracionfinanzas.model.Ingreso;
import com.proyectofinal.administracionfinanzas.repository.IngresoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IngresoService {

    @Autowired
    private IngresoRepository ingresoRepository;

    public List<Ingreso> listar() {
        return ingresoRepository.findAll();
    }

    public Ingreso obtenerPorId(Long id) {
        return ingresoRepository.findById(id).orElse(null);
    }

    public Ingreso guardar(Ingreso ingreso) {
        return ingresoRepository.save(ingreso);
    }

    public void eliminar(Long id) {
        ingresoRepository.deleteById(id);
    }
}
