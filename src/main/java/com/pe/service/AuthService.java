package com.pe.service;

import com.pe.dto.AuthResponse;
import com.pe.dto.LoginRequest;

/**
 * Contrato del servicio de autenticación.
 * Define la operación de login que valida credenciales y genera el token JWT.
 */
public interface AuthService {

    /**
     * Autentica al usuario con sus credenciales.
     *
     * @param request contiene email y contraseña
     * @return respuesta con el token JWT y datos básicos del usuario
     */
    AuthResponse login(LoginRequest request);
}
