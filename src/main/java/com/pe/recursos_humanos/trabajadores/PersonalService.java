package com.pe.recursos_humanos.trabajadores;

import com.pe.recursos_humanos.trabajadores.Trabajador;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PersonalService {

    private final List<Trabajador> trabajadores = new ArrayList<>();
    private final AtomicLong contadorId = new AtomicLong(0);

    public List<Trabajador> listar(String area, String estado) {
        return trabajadores.stream()
                .filter(t -> area == null || area.isBlank() || t.getArea().equalsIgnoreCase(area))
                .filter(t -> estado == null || estado.isBlank() || t.getEstado().equalsIgnoreCase(estado))
                .toList();
    }

    public Optional<Trabajador> buscarPorId(Long id) {
        return trabajadores.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst();
    }

    public Optional<Trabajador> buscarPorDocumento(String documentoIdentidad) {
        return trabajadores.stream()
                .filter(t -> t.getDocumentoIdentidad().equals(documentoIdentidad))
                .findFirst();
    }

    public Trabajador registrar(Trabajador nuevo) {
        if (nuevo.getNombres() == null || nuevo.getNombres().isBlank()) {
            throw new IllegalArgumentException("El nombre del trabajador es obligatorio");
        }
        if (nuevo.getDocumentoIdentidad() == null || nuevo.getDocumentoIdentidad().isBlank()) {
            throw new IllegalArgumentException("El documento de identidad es obligatorio");
        }
        if (buscarPorDocumento(nuevo.getDocumentoIdentidad()).isPresent()) {
            throw new IllegalStateException(
                    "Ya existe un trabajador registrado con el documento " + nuevo.getDocumentoIdentidad());
        }

        nuevo.setId(contadorId.incrementAndGet());
        nuevo.setEstado("ACTIVO");
        trabajadores.add(nuevo);
        return nuevo;
    }

    public Optional<Trabajador> actualizar(Long id, Trabajador cambios) {
        return buscarPorId(id).map(existente -> {
            existente.setNombres(cambios.getNombres());
            existente.setCargo(cambios.getCargo());
            existente.setArea(cambios.getArea());
            return existente;
        });
    }

    public boolean eliminar(Long id) {
        return trabajadores.removeIf(t -> t.getId().equals(id));
    }
}
