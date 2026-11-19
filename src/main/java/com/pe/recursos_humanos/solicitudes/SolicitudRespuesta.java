
package com.pe.recursos_humanos.solicitudes;

public record SolicitudRespuesta(
        Long id,
        TrabajadorRespuesta trabajador,
        TipoSolicitud tipo,
        java.time.LocalDate fechaInicio,
        java.time.LocalDate fechaFin,
        String motivo,
        EstadoSolicitud estado,
        String observacion,
        java.time.LocalDateTime fechaSolicitud
) {
    public record TrabajadorRespuesta(
            Long id,
            String nombres
    ) {
    }

    public static SolicitudRespuesta desde(Solicitud solicitud) {

        return new SolicitudRespuesta(
                solicitud.getId(),
                new TrabajadorRespuesta(
                        solicitud.getTrabajador().getId(),
                        solicitud.getTrabajador().getNombres()
                ),
                solicitud.getTipo(),
                solicitud.getFechaInicio(),
                solicitud.getFechaFin(),
                solicitud.getMotivo(),
                solicitud.getEstado(),
                solicitud.getObservacion(),
                solicitud.getFechaSolicitud()
        );
    }
}
