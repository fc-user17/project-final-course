package com.pe.service;

import com.pe.dto.RegistroRequest;
import com.pe.dto.UsuarioResponse;

/**
 * Contrato del servicio de gestión de usuarios.
 * RF-502: Encriptación de contraseñas al registrar.
 * RF-503: Asignación de rol al usuario.
 */
public interface UsuarioService {

    UsuarioResponse registrar(RegistroRequest request);
}
