package com.pe.repository;

import com.pe.model.HerramientaAsignacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HerramientaAsignacionRepository
        extends JpaRepository<HerramientaAsignacion, Long> {

    List<HerramientaAsignacion> findByHerramientaIdOrderByFechaAsignacionDesc(
            Long herramientaId);

    boolean existsByHerramientaIdAndFechaDevolucionIsNull(Long herramientaId);
}
