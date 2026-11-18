package com.pe.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entidad que representa un Ticket de soporte técnico e incidencias del área de Sistemas (TI).
 * Permite a cualquier usuario de la organización reportar requerimientos o incidentes informáticos
 * y realizar el seguimiento de su atención hasta el cierre.
 */
@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaTicket categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoTicket estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_solicitante_id", nullable = false)
    private Usuario usuarioSolicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_asignado_id")
    private Usuario tecnicoAsignado;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(columnDefinition = "TEXT")
    private String solucion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        if (this.estado == null) {
            this.estado = EstadoTicket.ABIERTO;
        }
        if (this.prioridad == null) {
            this.prioridad = Prioridad.MEDIA;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
