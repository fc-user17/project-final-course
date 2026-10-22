
package com.pe.recursos_humanos.asistencia;

import com.pe.recursos_humanos.trabajadores.PersonalService;
import com.pe.recursos_humanos.trabajadores.Trabajador;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class AsistenciaService {

    private final PersonalService personalService;
    private final MarcacionRepository marcacionRepository;

    public AsistenciaService(
            PersonalService personalService,
            MarcacionRepository marcacionRepository) {
        this.personalService = personalService;
        this.marcacionRepository = marcacionRepository;
    }

    @Transactional
    public Marcacion marcar(
            String documentoIdentidad,
            TipoMarcacion tipo,
            LocalDateTime fechaHora) {

        if (documentoIdentidad == null
                || documentoIdentidad.isBlank()) {
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
        marcacion.setTrabajadorId(trabajador.getId());
        marcacion.setTipo(tipo);
        marcacion.setFechaHora(
                fechaHora != null ? fechaHora : LocalDateTime.now()
        );

        return marcacionRepository.save(marcacion);
    }

    public List<Marcacion> listarTodas() {
        return marcacionRepository.findAll();
    }

    public List<Marcacion> listarPorTrabajador(Long trabajadorId) {
        return marcacionRepository.findByTrabajadorId(trabajadorId);
    }
}
