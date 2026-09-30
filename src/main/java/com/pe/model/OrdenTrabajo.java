package com.pe.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Representa una orden de trabajo (OT).
 * RF-02: Crear órdenes de trabajo con código autogenerado, fecha y prioridad.
 */
@Entity
@Table(name = "ordenes_trabajo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 20)
    private String codigo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tipo_mantenimiento_id", nullable = false)
    private TipoMantenimiento tipoMantenimiento;

    @Column(name = "tecnico_id")
    private Long tecnicoId;

    @Column(name = "fecha_programada")
    private LocalDate fechaProgramada;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private EstadoOrden estado = EstadoOrden.PENDIENTE;

    @Column(length = 500)
    private String descripcion;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        if (this.estado == null) {
            this.estado = EstadoOrden.PENDIENTE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
