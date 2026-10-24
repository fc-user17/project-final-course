
package com.pe.recursos_humanos.documentos;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentoRepository
        extends JpaRepository<Documento, Long> {

    List<Documento> findByTrabajadorId(Long trabajadorId);
}
