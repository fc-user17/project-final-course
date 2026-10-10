package com.proyectofinal.administracionfinanzas.repository;

import com.proyectofinal.administracionfinanzas.model.Factura;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacturaRepository extends JpaRepository<Factura, Long> {
    java.util.List<Factura> findByServicio(String servicio);
}
