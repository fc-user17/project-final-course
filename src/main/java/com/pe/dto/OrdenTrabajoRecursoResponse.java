package com.pe.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para un recurso (equipo o herramienta) asignado a una OT.
 * RF-05: Asignar equipos y/o herramientas a la orden de trabajo.
 */
@Getter
@Builder
public class OrdenTrabajoRecursoResponse {

    private Long id;

    /** ID del equipo asignado (null si el recurso es una herramienta). */
    private Long equipoId;

    /** ID de la herramienta asignada (null si el recurso es un equipo). */
    private Long herramientaId;

    private LocalDateTime fechaAsignacion;
}
