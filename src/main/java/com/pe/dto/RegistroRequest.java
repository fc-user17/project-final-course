package com.pe.dto;

import com.pe.model.NombreRol;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO de entrada para registrar un nuevo usuario en el sistema.
 * RF-502: La contraseña en texto plano que luego será encriptada con BCrypt.
 */
@Getter
@Setter
public class RegistroRequest {

    private String email;
    private String password;
    private NombreRol rol;
}
