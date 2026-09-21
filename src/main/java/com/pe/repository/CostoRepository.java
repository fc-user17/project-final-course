package com.proyectofinal.administracionfinanzas.repository;

import com.proyectofinal.administracionfinanzas.model.Costo;
import com.proyectofinal.administracionfinanzas.model.TipoCosto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CostoRepository extends JpaRepository<Costo, Long> {
    java.util.List<Costo> findByTipo(TipoCosto tipo);
    java.util.List<Costo> findByServicio(String servicio);
}
