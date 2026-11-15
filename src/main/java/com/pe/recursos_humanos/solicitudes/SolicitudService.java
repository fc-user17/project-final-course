
package com.pe.recursos_humanos.solicitudes;

import com.pe.recursos_humanos.trabajadores.Trabajador;
import com.pe.recursos_humanos.trabajadores.TrabajadorRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final TrabajadorRepository trabajadorRepository;

    public SolicitudService(
            SolicitudRepository solicitudRepository,
            TrabajadorRepository trabajadorRepository) {

        this.solicitudRepository = solicitudRepository;
        this.trabajadorRepository = trabajadorRepository;
    }

    // =========================================
    // REGISTRAR SOLICITUD DEL TRABAJADOR
    // =========================================

    @Transactional
    public Solicitud registrar(
            Long usuarioId,
            TipoSolicitud tipo,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String motivo) {

        // Validar usuario
        if (usuarioId == null) {
            throw new IllegalArgumentException(
                    "No se pudo identificar al usuario.");
        }

        // Validar tipo
        if (tipo == null) {
            throw new IllegalArgumentException(
                    "Debes seleccionar el tipo de solicitud.");
        }

        // Validar fechas
        if (fechaInicio == null || fechaFin == null) {
            throw new IllegalArgumentException(
                    "Las fechas son obligatorias.");
        }

        if (fechaInicio.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La fecha de inicio no puede ser anterior a hoy.");
        }

        if (fechaFin.isBefore(fechaInicio)) {
            throw new IllegalArgumentException(
                    "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        // Validar motivo
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException(
                    "El motivo de la solicitud es obligatorio.");
        }

        // Buscar trabajador asociado al usuario
        Trabajador trabajador = trabajadorRepository
                .findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe un trabajador asociado a esta cuenta."));

        // Crear solicitud
        Solicitud solicitud = new Solicitud();

        solicitud.setTrabajador(trabajador);
        solicitud.setTipo(tipo);
        solicitud.setFechaInicio(fechaInicio);
        solicitud.setFechaFin(fechaFin);
        solicitud.setMotivo(motivo.trim());
        solicitud.setEstado(EstadoSolicitud.PENDIENTE);

        return solicitudRepository.save(solicitud);
    }

    // =========================================
    // CONSULTAR SOLICITUDES DEL TRABAJADOR
    // =========================================

    @Transactional(readOnly = true)
    public List<Solicitud> listarPorUsuario(Long usuarioId) {

        if (usuarioId == null) {
            throw new IllegalArgumentException(
                    "No se pudo identificar al usuario.");
        }

        Trabajador trabajador = trabajadorRepository
                .findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe un trabajador asociado a esta cuenta."));

        return solicitudRepository
                .findByTrabajador_IdOrderByFechaSolicitudDesc(
                        trabajador.getId());
    }

    // =========================================
    // CONSULTAR TODAS LAS SOLICITUDES - RR. HH.
    // =========================================

    @Transactional(readOnly = true)
    public List<Solicitud> listarTodas() {

        return solicitudRepository
                .findAllByOrderByFechaSolicitudDesc();
    }
}
