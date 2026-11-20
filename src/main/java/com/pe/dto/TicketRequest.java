package com.pe.dto;

import com.pe.model.CategoriaTicket;
import com.pe.model.Prioridad;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Petición para registrar un nuevo ticket de soporte de sistemas.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRequest {

    @NotBlank(message = "El asunto o título del ticket es obligatorio")
    @Size(max = 150, message = "El título no puede superar los 150 caracteres")
    private String titulo;

    @NotBlank(message = "La descripción de la incidencia es obligatoria")
    @Size(max = 2000, message = "La descripción no puede superar los 2000 caracteres")
    private String descripcion;

    @NotNull(message = "La categoría es obligatoria")
    private CategoriaTicket categoria;

    @NotNull(message = "La prioridad es obligatoria")
    private Prioridad prioridad;
}
