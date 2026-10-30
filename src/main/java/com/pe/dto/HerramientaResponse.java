package com.pe.dto;

import com.pe.model.EstadoHerramienta;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HerramientaResponse {

    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private EstadoHerramienta estado;
    private LocalDateTime fechaRegistro;
}
