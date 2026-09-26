package com.pe.repository;

import com.pe.model.EstadoOrden;
import com.pe.model.OrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {

    List<OrdenTrabajo> findByEstado(EstadoOrden estado);

    List<OrdenTrabajo> findByTipoMantenimientoId(Long tipoMantenimientoId);
}
