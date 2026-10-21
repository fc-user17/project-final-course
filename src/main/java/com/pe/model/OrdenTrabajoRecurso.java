package com.pe.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Representa la asignación de un equipo o herramienta a una Orden de Trabajo.
 * RF-05: Asignar equipos y/o herramientas a la orden de trabajo.
 *
 * Los IDs de equipo y herramienta son referencias lógicas a los módulos
 * de Equipos/Almacén; no se usa FK física para mantener el desacoplamiento
 * entre módulos del sistema.
 */
@Entity
@Table(name = "ot_recursos",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_ot_equipo",
                        columnNames = {"orden_trabajo_id", "equipo_id"}),
                @UniqueConstraint(name = "uk_ot_herramienta",
                        columnNames = {"orden_trabajo_id", "herramienta_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenTrabajoRecurso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "orden_trabajo_id", nullable = false)
    private OrdenTrabajo ordenTrabajo;

    /**
     * ID del equipo (módulo Equipos). Nulo si el recurso es una herramienta.
     */
    @Column(name = "equipo_id")
    private Long equipoId;

    /**
     * ID de la herramienta (módulo Almacén/Herramientas). Nulo si el recurso es un equipo.
     */
    @Column(name = "herramienta_id")
    private Long herramientaId;

    @Column(name = "fecha_asignacion", nullable = false, updatable = false)
    private LocalDateTime fechaAsignacion;

    @PrePersist
    protected void onCreate() {
        this.fechaAsignacion = LocalDateTime.now();
    }
}
