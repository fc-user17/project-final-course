package com.pe.dto;

import com.pe.model.NombreRol;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO de salida para representar un usuario registrado.
 * Nunca expone el password_hash.
 */
@Getter
@Builder
public class UsuarioResponse {

    private Long id;
    private String email;
    private NombreRol rol;
    private Boolean activo;
}
