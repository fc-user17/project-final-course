package com.pe.recursos_humanos.documentos;

import com.pe.recursos_humanos.trabajadores.PersonalService;
import com.pe.recursos_humanos.trabajadores.Trabajador;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DocumentoService {

    private final PersonalService personalService;
    private final List<Documento> documentos = new ArrayList<>();
    private final AtomicLong contadorId = new AtomicLong(0);

    public DocumentoService(PersonalService personalService) {
        this.personalService = personalService;
    }

    public Documento registrar(
            String documentoIdentidadTrabajador,
            String tipo,
            LocalDate fechaVencimiento) {

        if (documentoIdentidadTrabajador == null
                || documentoIdentidadTrabajador.isBlank()) {
            throw new IllegalArgumentException(
                    "El documento de identidad del trabajador es obligatorio");
        }

        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException(
                    "El tipo de documento es obligatorio");
        }

        if (fechaVencimiento == null) {
            throw new IllegalArgumentException(
                    "La fecha de vencimiento es obligatoria");
        }

        Trabajador trabajador =
                personalService.buscarPorDocumento(documentoIdentidadTrabajador)
                        .orElseThrow(() -> new NoSuchElementException(
                                "No existe un trabajador con documento "
                                        + documentoIdentidadTrabajador));

        Documento documento = new Documento();

        documento.setId(contadorId.incrementAndGet());
        documento.setTrabajadorId(trabajador.getId());
        documento.setTipo(tipo);
        documento.setFechaVencimiento(fechaVencimiento);

        documentos.add(documento);

        return documento;
    }

    public List<Documento> listarTodos() {
        return documentos;
    }

    public List<Documento> listarPorTrabajador(Long trabajadorId) {
        return documentos.stream()
                .filter(d -> d.getTrabajadorId().equals(trabajadorId))
                .toList();
    }

    public List<Documento> listarProximosAVencer(int diasUmbral) {

        if (diasUmbral < 0) {
            throw new IllegalArgumentException(
                    "La cantidad de días no puede ser negativa");
        }

        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(diasUmbral);

        return documentos.stream()
                .filter(d -> !d.getFechaVencimiento().isBefore(hoy)
                        && !d.getFechaVencimiento().isAfter(limite))
                .toList();
    }

    public List<Documento> listarVencidos() {

        LocalDate hoy = LocalDate.now();

        return documentos.stream()
                .filter(d -> d.getFechaVencimiento().isBefore(hoy))
                .toList();
    }
}
