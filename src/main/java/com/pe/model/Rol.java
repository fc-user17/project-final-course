package com.pe.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Representa un perfil de acceso dentro del sistema.
 * RF-503: Asignación y gestión de roles.
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "nombre_rol", nullable = false, unique = true, length = 50)
    private NombreRol nombreRol;

    @Column(length = 255)
    private String descripcion;
}
