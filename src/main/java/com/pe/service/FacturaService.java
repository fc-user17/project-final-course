package com.proyectofinal.administracionfinanzas.service;

import com.proyectofinal.administracionfinanzas.model.Factura;
import com.proyectofinal.administracionfinanzas.repository.FacturaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FacturaService {

    @Autowired
    private FacturaRepository facturaRepository;

    public List<Factura> listar() {
        return facturaRepository.findAll();
    }

    public Factura obtenerPorId(Long id) {
        return facturaRepository.findById(id).orElse(null);
    }

    public Factura guardar(Factura factura) {
        return facturaRepository.save(factura);
    }

    public void eliminar(Long id) {
        facturaRepository.deleteById(id);
    }
}
