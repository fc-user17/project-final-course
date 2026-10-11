package com.proyectofinal.administracionfinanzas.repository;

import com.proyectofinal.administracionfinanzas.model.Ingreso;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngresoRepository extends JpaRepository<Ingreso, Long> {
    java.util.List<Ingreso> findByServicio(String servicio);
}
