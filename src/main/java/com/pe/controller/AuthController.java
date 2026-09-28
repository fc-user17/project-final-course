package com.pe.controller;

import com.pe.dto.AuthResponse;
import com.pe.dto.LoginRequest;
import com.pe.dto.RegistroRequest;
import com.pe.dto.UsuarioResponse;
import com.pe.service.AuthService;
import com.pe.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para el modulo de autenticacion.
 *
 * Expone dos endpoints publicos (sin necesidad de token):
 *   POST /api/auth/login    -> Valida credenciales y devuelve el JWT
 *   POST /api/auth/registro -> Registra un nuevo usuario en el sistema
 *
 * RF-501: Login y generacion de sesion segura.
 * RF-502: El registro encripta la contrasena antes de guardar.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;

    /**
     * Endpoint de login. Recibe email y password, devuelve el token JWT si las
     * credenciales son validas.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Endpoint de registro. Crea un nuevo usuario con su rol asignado.
     * Devuelve HTTP 201 Created con los datos del usuario registrado.
     */
    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registro(@RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioService.registrar(request));
    }
}
