package com.pe.dto;

import com.pe.model.EstadoOrden;
import com.pe.model.Prioridad;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class OrdenTrabajoResponse {


    private Long id;
    private String codigo;
    private Long tipoMantenimientoId;
    private String tipoMantenimientoNombre;
    private Long equipoId;
    private String equipoCodigoPatrimonial;
    private String equipoDescripcion;
    private Long tecnicoId;
    private String tecnicoNombre;
    private LocalDate fechaProgramada;
    private Prioridad prioridad;
    private EstadoOrden estado;
    private String descripcion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    /** Equipos y herramientas asignados a esta OT (RF-05). */
    private List<OrdenTrabajoRecursoResponse> recursos;
}
