package com.pe.dto;

import com.pe.model.Prioridad;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class OrdenTrabajoRequest {

    @NotNull(message = "Debe indicar el tipo de mantenimiento")
    private Long tipoMantenimientoId;

    @Positive(message = "El identificador del equipo debe ser positivo")
    private Long equipoId;

    @FutureOrPresent(message = "La fecha programada no puede ser en el pasado")
    private LocalDate fechaProgramada;

    @NotNull(message = "Debe indicar la prioridad")
    private Prioridad prioridad;

    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres")
    private String descripcion;
}
