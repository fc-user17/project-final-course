package com.pe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Lanzada cuando se intenta asignar un técnico que no está disponible
 * para la fecha programada de la orden de trabajo (RF-04).
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class TecnicoNoDisponibleException extends RuntimeException {

    public TecnicoNoDisponibleException(Long tecnicoId, String fecha) {
        super("El técnico con id " + tecnicoId
                + " ya tiene una orden EN_PROCESO para la fecha " + fecha
                + ". No puede ser asignado a otra OT en la misma fecha.");
    }
}
