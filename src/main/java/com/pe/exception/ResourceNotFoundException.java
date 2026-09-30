package com.pe.exception;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Autor: VLM
 * Descripción: Excepción lanzada cuando un recurso solicitado no existe en la base de datos.
 * Responde automáticamente con un estado HTTP 404 Not Found.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
