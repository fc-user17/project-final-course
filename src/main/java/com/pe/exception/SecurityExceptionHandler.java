package com.pe.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manejador global de excepciones relacionadas con la seguridad.
 *
 * Centraliza las respuestas de error para que el cliente siempre reciba
 * un JSON claro en lugar de la pagina de error por defecto de Spring.
 *
 * Maneja:
 *  - 401 Unauthorized: token ausente, expirado o credenciales incorrectas.
 *  - 403 Forbidden: usuario autenticado pero sin permisos para el recurso.
 */
@RestControllerAdvice
public class SecurityExceptionHandler {

    /**
     * Captura errores de autenticacion: credenciales incorrectas, token invalido, etc.
     * Devuelve HTTP 401 Unauthorized.
     */
    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
    public ResponseEntity<Map<String, Object>> handleAuthException(
            Exception ex, HttpServletRequest request) {

        Map<String, Object> body = buildErrorBody(
                HttpStatus.UNAUTHORIZED,
                "No autorizado",
                "Credenciales invalidas o token ausente/expirado. Verifica tus datos e intenta de nuevo.",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    /**
     * Captura errores de acceso denegado: el usuario esta autenticado pero
     * no tiene el rol necesario para acceder al recurso.
     * Devuelve HTTP 403 Forbidden.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {

        Map<String, Object> body = buildErrorBody(
                HttpStatus.FORBIDDEN,
                "Acceso denegado",
                "No tienes permisos suficientes para acceder a este recurso.",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    private Map<String, Object> buildErrorBody(HttpStatus status, String error,
                                                String message, String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", path);
        return body;
    }
}
