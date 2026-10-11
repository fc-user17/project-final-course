package com.proyectofinal.administracionfinanzas.repository;

import com.proyectofinal.administracionfinanzas.model.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GastoRepository extends JpaRepository<Gasto, Long> {
    java.util.List<Gasto> findByServicio(String servicio);
}
