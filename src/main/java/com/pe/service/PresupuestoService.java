package com.proyectofinal.administracionfinanzas.service;

import com.proyectofinal.administracionfinanzas.model.Presupuesto;
import com.proyectofinal.administracionfinanzas.repository.PresupuestoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PresupuestoService {

    @Autowired
    private PresupuestoRepository presupuestoRepository;

    public List<Presupuesto> listar() {
        return presupuestoRepository.findAll();
    }

    public Presupuesto obtenerPorId(Long id) {
        return presupuestoRepository.findById(id).orElse(null);
    }

    public Presupuesto guardar(Presupuesto presupuesto) {
        return presupuestoRepository.save(presupuesto);
    }

    public void eliminar(Long id) {
        presupuestoRepository.deleteById(id);
    }
}
