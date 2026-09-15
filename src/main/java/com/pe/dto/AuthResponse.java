package com.pe.dto;

import com.pe.model.NombreRol;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO de respuesta devuelto tras un login exitoso.
 * Contiene el token JWT listo para usar en las siguientes peticiones.
 */
@Getter
@Builder
public class AuthResponse {

    /** Token JWT firmado. Se usa en el header: Authorization: Bearer {token} */
    private String token;

    /** Tipo de token. Siempre es "Bearer". */
    private String tipo;

    private String email;

    private NombreRol rol;
}
