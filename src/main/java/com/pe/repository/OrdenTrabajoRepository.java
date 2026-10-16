package com.pe.repository;

import com.pe.model.EstadoOrden;
import com.pe.model.OrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {

    List<OrdenTrabajo> findByEstado(EstadoOrden estado);

    List<OrdenTrabajo> findByTipoMantenimientoId(Long tipoMantenimientoId);

    /** RF-04: Obtener OTs por técnico asignado. */
    List<OrdenTrabajo> findByTecnicoId(Long tecnicoId);

    /**
     * RF-04: Verifica si el técnico tiene una OT en estado EN_PROCESO
     * para la misma fecha programada (validación de disponibilidad).
     */
    @Query("""
            SELECT COUNT(o) > 0
            FROM OrdenTrabajo o
            WHERE o.tecnicoId = :tecnicoId
              AND o.fechaProgramada = :fecha
              AND o.estado = com.pe.model.EstadoOrden.EN_PROCESO
              AND (:excludeId IS NULL OR o.id <> :excludeId)
            """)
    boolean tecnicoOcupadoEnFecha(@Param("tecnicoId") Long tecnicoId,
                                  @Param("fecha") LocalDate fecha,
                                  @Param("excludeId") Long excludeId);
}

