package com.pe.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AsignarHerramientaRequest {

    @NotNull(message = "Debe indicar el ID del técnico")
    @Positive(message = "El ID del técnico debe ser positivo")
    private Long tecnicoId;
}
