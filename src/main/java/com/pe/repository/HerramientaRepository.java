package com.pe.repository;

import com.pe.model.Herramienta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HerramientaRepository extends JpaRepository<Herramienta, Long> {

    Optional<Herramienta> findByCodigoIgnoreCase(String codigo);
}
