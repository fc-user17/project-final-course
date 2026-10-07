package com.pe.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pe.model.TipoMantenimiento;

import java.util.List;
import java.util.Optional;

public interface TipoMantenimientoRepository extends JpaRepository<TipoMantenimiento, Long> {

    Optional<TipoMantenimiento> findByNombreIgnoreCase(String nombre);

    List<TipoMantenimiento> findByActivoTrue();

    boolean existsByNombreIgnoreCase(String nombre);
}
