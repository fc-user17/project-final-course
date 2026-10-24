package com.pe.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO de entrada para asignar un técnico a una OT (RF-04).
 * El tecnicoId hace referencia al ID del trabajador del módulo de RRHH.
 * Se valida que no tenga otra OT en estado EN_PROCESO en la misma fecha.
 */
@Getter
@Setter
public class AsignarTecnicoRequest {

    @NotNull(message = "Debe indicar el ID del técnico")
    private Long tecnicoId;
}
