package com.pe.dto;

import com.pe.model.EstadoEquipo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EquipoRequest {

    @NotBlank(message = "El codigo patrimonial es obligatorio")
    @Size(max = 30, message = "El codigo patrimonial no puede superar los 30 caracteres")
    private String codigoPatrimonial;

    @NotBlank(message = "La marca es obligatoria")
    @Size(max = 100, message = "La marca no puede superar los 100 caracteres")
    private String marca;

    @NotBlank(message = "El modelo es obligatorio")
    @Size(max = 100, message = "El modelo no puede superar los 100 caracteres")
    private String modelo;

    @NotBlank(message = "El numero de serie es obligatorio")
    @Size(max = 100, message = "El numero de serie no puede superar los 100 caracteres")
    private String numeroSerie;

    @NotNull(message = "El estado del equipo es obligatorio")
    private EstadoEquipo estado;

    @NotBlank(message = "La ubicacion es obligatoria")
    @Size(max = 150, message = "La ubicacion no puede superar los 150 caracteres")
    private String ubicacion;

    @NotBlank(message = "El responsable es obligatorio")
    @Size(max = 150, message = "El responsable no puede superar los 150 caracteres")
    private String responsable;
}
