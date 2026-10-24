
package com.pe.recursos_humanos.asistencia;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MarcacionRepository
        extends JpaRepository<Marcacion, Long> {

    List<Marcacion> findByTrabajadorId(Long trabajadorId);
}

