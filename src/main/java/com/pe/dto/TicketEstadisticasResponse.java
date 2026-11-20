package com.pe.dto;

import lombok.*;

/**
 * Resumen de indicadores y métricas del sistema de tickets.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketEstadisticasResponse {

    private long total;
    private long abiertos;
    private long enProceso;
    private long resueltos;
    private long cerrados;
    private long misTickets;
}
