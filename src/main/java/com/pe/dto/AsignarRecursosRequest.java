package com.pe.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * DTO de entrada para asignar equipos y/o herramientas a una OT (RF-05).
 * Los IDs hacen referencia a las entidades del módulo de Almacén/Equipos.
 * Ambas listas son opcionales pero al menos una debe tener elementos.
 */
@Getter
@Setter
public class AsignarRecursosRequest {

    /**
     * IDs de los equipos a asignar a la OT.
     * Hace referencia al módulo de Equipos (equipo_id).
     */
    private List<Long> equipoIds;

    /**
     * IDs de las herramientas a asignar a la OT.
     * Hace referencia al módulo de Herramientas (herramienta_id).
     */
    private List<Long> herramientaIds;
}
