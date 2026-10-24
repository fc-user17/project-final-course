package com.pe.dto;

import com.pe.model.Prioridad;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * DTO de entrada para programar un mantenimiento preventivo (RF-03).
 * La periodicidad del tipo de mantenimiento se usa para calcular
 * las fechas de las OTs generadas en serie.
 */
@Getter
@Setter
public class ProgramarMantenimientoRequest {

    /** ID del tipo de mantenimiento (debe tener periodicidadDias definida). */
    @NotNull(message = "Debe indicar el tipo de mantenimiento")
    private Long tipoMantenimientoId;

    /** Fecha de inicio de la primera OT de la serie. */
    @NotNull(message = "La fecha de inicio es obligatoria")
    @Future(message = "La fecha de inicio debe ser futura")
    private LocalDate fechaInicio;

    /** Cuántas órdenes de trabajo se generarán en la serie (mínimo 1). */
    @NotNull(message = "Debe indicar la cantidad de ocurrencias")
    private Integer cantidadOcurrencias;

    @NotNull(message = "Debe indicar la prioridad")
    private Prioridad prioridad;

    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres")
    private String descripcion;
}
