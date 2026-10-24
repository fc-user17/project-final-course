
package com.pe.recursos_humanos.asistencia;

import com.pe.recursos_humanos.trabajadores.PersonalService;
import com.pe.recursos_humanos.trabajadores.Trabajador;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
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

    // Registrar una marcación sin fotografía.
    @Transactional
    public Marcacion marcar(
            String documentoIdentidad,
            TipoMarcacion tipo,
            LocalDateTime fechaHora) {

        validarDatos(documentoIdentidad, tipo);

        Trabajador trabajador = buscarTrabajador(documentoIdentidad);

        Marcacion marcacion = new Marcacion();
        marcacion.setTrabajadorId(trabajador.getId());
        marcacion.setTipo(tipo);

        // Si no se recibe fecha, utilizar la hora de Perú.
        marcacion.setFechaHora(
                fechaHora != null
                        ? fechaHora
                        : LocalDateTime.now(ZoneId.of("America/Lima"))
        );

        return marcacionRepository.save(marcacion);
    }

    // Registrar una marcación con fotografía obligatoria.
    @Transactional
    public Marcacion marcarConFoto(
            String documentoIdentidad,
            TipoMarcacion tipo,
            byte[] foto) {

        validarDatos(documentoIdentidad, tipo);

        if (foto == null || foto.length == 0) {
            throw new IllegalArgumentException(
                    "La fotografía es obligatoria");
        }

        // Límite máximo de 2 MB.
        if (foto.length > 2 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "La fotografía no debe superar los 2 MB");
        }

        Trabajador trabajador = buscarTrabajador(documentoIdentidad);

        Marcacion marcacion = new Marcacion();
        marcacion.setTrabajadorId(trabajador.getId());
        marcacion.setTipo(tipo);

        // La hora se genera en el servidor, usando la zona de Perú.
        marcacion.setFechaHora(
                LocalDateTime.now(ZoneId.of("America/Lima"))
        );

        // Copiar los bytes de la fotografía.
        marcacion.setFoto(Arrays.copyOf(foto, foto.length));

        return marcacionRepository.save(marcacion);
    }

    // Listar todas las marcaciones.
    @Transactional(readOnly = true)
    public List<Marcacion> listarTodas() {
        return marcacionRepository.findAll();
    }

    // Listar marcaciones de un trabajador.
    @Transactional(readOnly = true)
    public List<Marcacion> listarPorTrabajador(Long trabajadorId) {
        return marcacionRepository.findByTrabajadorId(trabajadorId);
    }

    // Obtener la fotografía de una marcación.
    @Transactional(readOnly = true)
    public byte[] obtenerFoto(Long id) {
        Marcacion marcacion = marcacionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe la marcación solicitada"));

        byte[] foto = marcacion.getFoto();

        if (foto == null || foto.length == 0) {
            throw new NoSuchElementException(
                    "Esta marcación no tiene fotografía");
        }

        return Arrays.copyOf(foto, foto.length);
    }

    // Validar los datos obligatorios.
    private void validarDatos(
            String documentoIdentidad,
            TipoMarcacion tipo) {

        if (documentoIdentidad == null
                || documentoIdentidad.isBlank()) {
            throw new IllegalArgumentException(
                    "El documento de identidad es obligatorio");
        }

        if (tipo == null) {
            throw new IllegalArgumentException(
                    "El tipo de marcación es obligatorio");
        }
    }

    // Buscar al trabajador por su documento.
    private Trabajador buscarTrabajador(String documentoIdentidad) {
        return personalService.buscarPorDocumento(documentoIdentidad)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe un trabajador con documento "
                                + documentoIdentidad));
    }
}
