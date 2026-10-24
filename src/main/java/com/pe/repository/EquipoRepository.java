package com.pe.repository;

import com.pe.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    Optional<Equipo> findByCodigoPatrimonialIgnoreCase(String codigoPatrimonial);

    Optional<Equipo> findByNumeroSerieIgnoreCase(String numeroSerie);
}
