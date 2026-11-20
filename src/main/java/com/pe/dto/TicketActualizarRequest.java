package com.pe.dto;

import com.pe.model.EstadoTicket;
import com.pe.model.Prioridad;
import lombok.*;

/**
 * Petición para actualizar el estado, asignación de técnico o solución de un ticket.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketActualizarRequest {

    private EstadoTicket estado;
    private Prioridad prioridad;
    private Long tecnicoAsignadoId;
    private String solucion;
}
