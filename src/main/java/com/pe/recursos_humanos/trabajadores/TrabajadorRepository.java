
package com.pe.recursos_humanos.trabajadores;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrabajadorRepository
        extends JpaRepository<Trabajador, Long> {

    Optional<Trabajador> findByDocumentoIdentidad(
            String documentoIdentidad);
}
