
package com.pe.recursos_humanos.trabajadores;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PersonalService {

    private final TrabajadorRepository trabajadorRepository;

    public PersonalService(TrabajadorRepository trabajadorRepository) {
        this.trabajadorRepository = trabajadorRepository;
    }

    public List<Trabajador> listar(String area, String estado) {
        return trabajadorRepository.findAll().stream()
                .filter(t -> area == null || area.isBlank()
                        || (t.getArea() != null
                        && t.getArea().equalsIgnoreCase(area)))
                .filter(t -> estado == null || estado.isBlank()
                        || (t.getEstado() != null
                        && t.getEstado().equalsIgnoreCase(estado)))
                .toList();
    }

    public Optional<Trabajador> buscarPorId(Long id) {
        return trabajadorRepository.findById(id);
    }

    public Optional<Trabajador> buscarPorDocumento(String documentoIdentidad) {
        return trabajadorRepository.findByDocumentoIdentidad(documentoIdentidad);
    }

    public Trabajador registrar(Trabajador nuevo) {
        if (nuevo.getNombres() == null || nuevo.getNombres().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }

        if (nuevo.getDocumentoIdentidad() == null
                || nuevo.getDocumentoIdentidad().isBlank()) {
            throw new IllegalArgumentException("El documento es obligatorio");
        }

        if (buscarPorDocumento(nuevo.getDocumentoIdentidad()).isPresent()) {
            throw new IllegalStateException(
                    "Ya existe un trabajador con ese documento");
        }

        nuevo.setId(null);
        nuevo.setEstado("ACTIVO");

        return trabajadorRepository.save(nuevo);
    }

    public Optional<Trabajador> actualizar(Long id, Trabajador cambios) {
        return trabajadorRepository.findById(id).map(existente -> {
            if (cambios.getNombres() == null
                    || cambios.getNombres().isBlank()) {
                throw new IllegalArgumentException("El nombre es obligatorio");
            }

            if (cambios.getDocumentoIdentidad() == null
                    || cambios.getDocumentoIdentidad().isBlank()) {
                throw new IllegalArgumentException("El documento es obligatorio");
            }

            Optional<Trabajador> conDocumento =
                    buscarPorDocumento(cambios.getDocumentoIdentidad());

            if (conDocumento.isPresent()
                    && !conDocumento.get().getId().equals(id)) {
                throw new IllegalStateException(
                        "Ese documento ya pertenece a otro trabajador");
            }

            existente.setNombres(cambios.getNombres());
            existente.setDocumentoIdentidad(cambios.getDocumentoIdentidad());
            existente.setCargo(cambios.getCargo());
            existente.setArea(cambios.getArea());

            return trabajadorRepository.save(existente);
        });
    }

public Optional<Trabajador> cambiarEstado(Long id, String estado) {
    if (!"ACTIVO".equalsIgnoreCase(estado)
            && !"CESADO".equalsIgnoreCase(estado)) {
        throw new IllegalArgumentException(
                "El estado debe ser ACTIVO o CESADO");
    }

    return trabajadorRepository.findById(id).map(trabajador -> {
        trabajador.setEstado(estado.toUpperCase());
        return trabajadorRepository.save(trabajador);
    });
}

public boolean eliminar(Long id) {
    if (!trabajadorRepository.existsById(id)) {
        return false;
    }

    trabajadorRepository.deleteById(id);
    return true;
}

}
