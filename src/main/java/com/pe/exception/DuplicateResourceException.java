package com.pe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Autor: VLM
 * Descripción: Excepción lanzada cuando se intenta crear un recurso que ya existe en la base de datos (por ejemplo, email duplicado). 
 * Responde automáticamente con un estado HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
