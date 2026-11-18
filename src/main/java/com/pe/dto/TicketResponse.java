package com.pe.dto;

import com.pe.model.CategoriaTicket;
import com.pe.model.EstadoTicket;
import com.pe.model.Prioridad;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Respuesta con la información completa de un ticket de sistemas.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketResponse {

    private Long id;
    private String codigo;
    private String titulo;
    private String descripcion;
    private CategoriaTicket categoria;
    private String categoriaDescripcion;
    private Prioridad prioridad;
    private EstadoTicket estado;
    private String estadoDescripcion;

    private Long solicitanteId;
    private String solicitanteEmail;
    private String solicitanteRol;

    private Long tecnicoId;
    private String tecnicoEmail;

    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private LocalDateTime fechaCierre;
    private String solucion;
}
