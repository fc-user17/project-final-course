package com.pe.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HerramientaAsignacionResponse {

    private Long asignacionId;
    private Long herramientaId;
    private String codigoHerramienta;
    private String nombreHerramienta;
    private Long tecnicoId;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaDevolucion;
}
