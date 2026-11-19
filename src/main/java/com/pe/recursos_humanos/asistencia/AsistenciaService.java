
package com.pe.recursos_humanos.asistencia;

import com.pe.recursos_humanos.trabajadores.PersonalService;
import com.pe.recursos_humanos.trabajadores.Trabajador;
import com.pe.recursos_humanos.trabajadores.TrabajadorRepository;

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
    private final TrabajadorRepository trabajadorRepository;

    public AsistenciaService(
            PersonalService personalService,
            MarcacionRepository marcacionRepository,
            TrabajadorRepository trabajadorRepository) {

        this.personalService = personalService;
        this.marcacionRepository = marcacionRepository;
        this.trabajadorRepository = trabajadorRepository;
    }

    // =========================================
    // REGISTRAR MARCACIÓN SIN FOTOGRAFÍA
    // =========================================

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

        marcacion.setFechaHora(
                fechaHora != null
                        ? fechaHora
                        : LocalDateTime.now(ZoneId.of("America/Lima"))
        );

        return marcacionRepository.save(marcacion);
    }

    // =========================================
    // REGISTRAR MARCACIÓN CON FOTOGRAFÍA
    // =========================================

    @Transactional
    public Marcacion marcarConFoto(
            String documentoIdentidad,
            TipoMarcacion tipo,
            byte[] foto) {

        validarDatos(documentoIdentidad, tipo);
        validarFoto(foto);

        Trabajador trabajador = buscarTrabajador(documentoIdentidad);

        Marcacion marcacion = new Marcacion();

        marcacion.setTrabajadorId(trabajador.getId());
        marcacion.setTipo(tipo);

        marcacion.setFechaHora(
                LocalDateTime.now(ZoneId.of("America/Lima"))
        );

        marcacion.setFoto(Arrays.copyOf(foto, foto.length));

        return marcacionRepository.save(marcacion);
    }

    // =========================================
    // REGISTRAR MARCACIÓN POR USUARIO AUTENTICADO
    // =========================================

    @Transactional
    public Marcacion marcarConFotoPorUsuario(
            Long usuarioId,
            TipoMarcacion tipo,
            byte[] foto) {

        if (usuarioId == null) {
            throw new IllegalArgumentException(
                    "No se pudo identificar al usuario.");
        }

        if (tipo == null) {
            throw new IllegalArgumentException(
                    "El tipo de marcación es obligatorio.");
        }

        validarFoto(foto);

        Trabajador trabajador = trabajadorRepository
                .findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe un trabajador asociado a esta cuenta."));

        Marcacion marcacion = new Marcacion();

        marcacion.setTrabajadorId(trabajador.getId());
        marcacion.setTipo(tipo);

        marcacion.setFechaHora(
                LocalDateTime.now(ZoneId.of("America/Lima"))
        );

        marcacion.setFoto(Arrays.copyOf(foto, foto.length));

        return marcacionRepository.save(marcacion);
    }

    // =========================================
    // LISTAR TODAS LAS MARCACIONES
    // =========================================

    @Transactional(readOnly = true)
    public List<Marcacion> listarTodas() {
        return marcacionRepository.findAll();
    }

    // =========================================
    // LISTAR MARCACIONES POR TRABAJADOR
    // =========================================

    @Transactional(readOnly = true)
    public List<Marcacion> listarPorTrabajador(Long trabajadorId) {
        return marcacionRepository.findByTrabajadorId(trabajadorId);
    }

    // =========================================
    // LISTAR MARCACIONES DEL USUARIO AUTENTICADO
    // =========================================

    @Transactional(readOnly = true)
    public List<Marcacion> listarPorUsuario(Long usuarioId) {

        if (usuarioId == null) {
            throw new IllegalArgumentException(
                    "No se pudo identificar al usuario.");
        }

        Trabajador trabajador = trabajadorRepository
                .findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe un trabajador asociado a esta cuenta."));

        return marcacionRepository.findByTrabajadorId(trabajador.getId());
    }

    // =========================================
    // OBTENER FOTOGRAFÍA DE UNA MARCACIÓN
    // =========================================

    @Transactional(readOnly = true)
    public byte[] obtenerFoto(Long id) {

        Marcacion marcacion = marcacionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe la marcación solicitada."));

        byte[] foto = marcacion.getFoto();

        if (foto == null || foto.length == 0) {
            throw new NoSuchElementException(
                    "Esta marcación no tiene fotografía.");
        }

        return Arrays.copyOf(foto, foto.length);
    }

    // =========================================
    // VALIDAR FOTOGRAFÍA
    // =========================================

    private void validarFoto(byte[] foto) {

        if (foto == null || foto.length == 0) {
            throw new IllegalArgumentException(
                    "La fotografía es obligatoria.");
        }

        if (foto.length > 2 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "La fotografía no debe superar los 2 MB.");
        }
    }

    // =========================================
    // VALIDAR DATOS
    // =========================================

    private void validarDatos(
            String documentoIdentidad,
            TipoMarcacion tipo) {

        if (documentoIdentidad == null
                || documentoIdentidad.isBlank()) {
            throw new IllegalArgumentException(
                    "El documento de identidad es obligatorio.");
        }

        if (tipo == null) {
            throw new IllegalArgumentException(
                    "El tipo de marcación es obligatorio.");
        }
    }

    // =========================================
    // BUSCAR TRABAJADOR POR DOCUMENTO
    // =========================================

    private Trabajador buscarTrabajador(String documentoIdentidad) {

        return personalService.buscarPorDocumento(documentoIdentidad)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe un trabajador con documento "
                                + documentoIdentidad));
    }
}
