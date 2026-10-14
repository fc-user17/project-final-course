package com.pe.recursos_humanos.asistencia;

import com.pe.recursos_humanos.trabajadores.PersonalService;
import com.pe.recursos_humanos.trabajadores.Trabajador;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class AsistenciaService {

    private final PersonalService personalService;
    private final List<Marcacion> marcaciones = new ArrayList<>();
    private final AtomicLong contadorId = new AtomicLong(0);

    public AsistenciaService(PersonalService personalService) {
        this.personalService = personalService;
    }

    public Marcacion marcar(
            String documentoIdentidad,
            TipoMarcacion tipo,
            LocalDateTime fechaHora) {

        if (documentoIdentidad == null || documentoIdentidad.isBlank()) {
            throw new IllegalArgumentException(
                    "El documento de identidad es obligatorio");
        }

        if (tipo == null) {
            throw new IllegalArgumentException(
                    "El tipo de marcación es obligatorio");
        }

        Trabajador trabajador =
                personalService.buscarPorDocumento(documentoIdentidad)
                        .orElseThrow(() -> new NoSuchElementException(
                                "No existe un trabajador con documento "
                                        + documentoIdentidad));

        Marcacion marcacion = new Marcacion();

        marcacion.setId(contadorId.incrementAndGet());
        marcacion.setTrabajadorId(trabajador.getId());
        marcacion.setTipo(tipo);
        marcacion.setFechaHora(
                fechaHora != null ? fechaHora : LocalDateTime.now()
        );

        marcaciones.add(marcacion);

        return marcacion;
    }

    public List<Marcacion> listarTodas() {
        return marcaciones;
    }

    public List<Marcacion> listarPorTrabajador(Long trabajadorId) {
        return marcaciones.stream()
                .filter(m -> m.getTrabajadorId().equals(trabajadorId))
                .toList();
    }
}
