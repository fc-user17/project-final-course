package com.pe.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO de entrada para el endpoint de login.
 * El usuario envía su email y contraseña para autenticarse.
 */
@Getter
@Setter
public class LoginRequest {

    private String email;
    private String password;
}
