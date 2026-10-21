package com.proyectofinal.administracionfinanzas.repository;

import com.proyectofinal.administracionfinanzas.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
}
