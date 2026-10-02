package com.pe.dto;

import com.pe.model.EstadoEquipo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class EquipoResponse {

    private Long id;
    private String codigoPatrimonial;
    private String marca;
    private String modelo;
    private String numeroSerie;
    private EstadoEquipo estado;
    private String ubicacion;
    private String responsable;
}
