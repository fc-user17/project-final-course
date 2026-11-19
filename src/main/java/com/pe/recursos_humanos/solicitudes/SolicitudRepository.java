
package com.pe.recursos_humanos.solicitudes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitudRepository
        extends JpaRepository<Solicitud, Long> {

    // Consultar las solicitudes de un trabajador
    List<Solicitud> findByTrabajador_IdOrderByFechaSolicitudDesc(
            Long trabajadorId);

    // Consultar todas las solicitudes para RR. HH.
    List<Solicitud> findAllByOrderByFechaSolicitudDesc();
}
