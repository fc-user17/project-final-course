package com.pe.repository;

import com.pe.model.OrdenTrabajoRecurso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repositorio para la asignación de equipos y herramientas a OTs.
 * RF-05: Asignar equipos y/o herramientas a la orden de trabajo.
 */
public interface OrdenTrabajoRecursoRepository extends JpaRepository<OrdenTrabajoRecurso, Long> {

    /** Devuelve todos los recursos asignados a una OT específica. */
    List<OrdenTrabajoRecurso> findByOrdenTrabajoId(Long ordenTrabajoId);

    /** Verifica si un equipo ya está asignado a una OT. */
    boolean existsByOrdenTrabajoIdAndEquipoId(Long ordenTrabajoId, Long equipoId);

    /** Verifica si una herramienta ya está asignada a una OT. */
    boolean existsByOrdenTrabajoIdAndHerramientaId(Long ordenTrabajoId, Long herramientaId);

    /** Elimina todos los recursos de una OT (para reemplazar asignación completa). */
    void deleteByOrdenTrabajoId(Long ordenTrabajoId);
}
