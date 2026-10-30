package com.pe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HerramientaRequest {

    @NotBlank(message = "El codigo de la herramienta es obligatorio")
    @Size(max = 30, message = "El codigo no puede superar los 30 caracteres")
    private String codigo;

    @NotBlank(message = "El nombre de la herramienta es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombre;

    @Size(max = 255, message = "La descripcion no puede superar los 255 caracteres")
    private String descripcion;
}
