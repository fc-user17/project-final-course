
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

    // REGISTRAR SOLICITUD

    @Transactional
    public SolicitudRespuesta registrar(
            Long usuarioId,
            TipoSolicitud tipo,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String motivo) {

        if (usuarioId == null) {
            throw new IllegalArgumentException(
                    "No se pudo identificar al usuario.");
        }

        if (tipo == null) {
            throw new IllegalArgumentException(
                    "Debes seleccionar el tipo de solicitud.");
        }

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

        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException(
                    "El motivo de la solicitud es obligatorio.");
        }

        Trabajador trabajador = trabajadorRepository
                .findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe un trabajador asociado a esta cuenta."));

        Solicitud solicitud = new Solicitud();

        solicitud.setTrabajador(trabajador);
        solicitud.setTipo(tipo);
        solicitud.setFechaInicio(fechaInicio);
        solicitud.setFechaFin(fechaFin);
        solicitud.setMotivo(motivo.trim());
        solicitud.setEstado(EstadoSolicitud.PENDIENTE);

        Solicitud guardada = solicitudRepository.save(solicitud);

        return SolicitudRespuesta.desde(guardada);
    }

    // CONSULTAR SOLICITUDES DEL TRABAJADOR

    @Transactional(readOnly = true)
    public List<SolicitudRespuesta> listarPorUsuario(Long usuarioId) {

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
                        trabajador.getId())
                .stream()
                .map(SolicitudRespuesta::desde)
                .toList();
    }

    // CONSULTAR TODAS LAS SOLICITUDES - RR. HH.

    @Transactional(readOnly = true)
    public List<SolicitudRespuesta> listarTodas() {

        return solicitudRepository
                .findAllByOrderByFechaSolicitudDesc()
                .stream()
                .map(SolicitudRespuesta::desde)
                .toList();
    }

    // APROBAR SOLICITUD

    @Transactional
    public SolicitudRespuesta aprobar(
            Long solicitudId,
            String observacion) {

        Solicitud solicitud = buscarSolicitud(solicitudId);

        validarPendiente(solicitud);

        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitud.setObservacion(limpiarObservacion(observacion));

        Solicitud actualizada = solicitudRepository.save(solicitud);

        return SolicitudRespuesta.desde(actualizada);
    }

    // RECHAZAR SOLICITUD

    @Transactional
    public SolicitudRespuesta rechazar(
            Long solicitudId,
            String observacion) {

        if (observacion == null || observacion.isBlank()) {
            throw new IllegalArgumentException(
                    "Debes indicar el motivo del rechazo.");
        }

        Solicitud solicitud = buscarSolicitud(solicitudId);

        validarPendiente(solicitud);

        solicitud.setEstado(EstadoSolicitud.RECHAZADA);
        solicitud.setObservacion(observacion.trim());

        Solicitud actualizada = solicitudRepository.save(solicitud);

        return SolicitudRespuesta.desde(actualizada);
    }

    // BUSCAR SOLICITUD

    private Solicitud buscarSolicitud(Long solicitudId) {

        return solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NoSuchElementException(
                        "No se encontró la solicitud."));
    }

    // VALIDAR ESTADO

    private void validarPendiente(Solicitud solicitud) {

        if (solicitud.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new IllegalStateException(
                    "Esta solicitud ya fue atendida anteriormente.");
        }
    }

    // LIMPIAR OBSERVACIÓN

    private String limpiarObservacion(String observacion) {

        if (observacion == null || observacion.isBlank()) {
            return null;
        }

        return observacion.trim();
    }
}
