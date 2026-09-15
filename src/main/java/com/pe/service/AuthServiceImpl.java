package com.pe.service;

import com.pe.dto.AuthResponse;
import com.pe.dto.LoginRequest;
import com.pe.model.NombreRol;
import com.pe.security.JwtUtil;
import com.pe.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

/**
 * Implementacion del servicio de autenticacion.
 *
 * El flujo es el siguiente:
 * 1. Se delega la validacion de credenciales a Spring Security (AuthenticationManager).
 * 2. Si las credenciales son correctas, se genera el token JWT con JwtUtil.
 * 3. Se devuelve el token junto con los datos del usuario autenticado.
 *
 * RF-501: Autenticacion de usuarios mediante email y password.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse login(LoginRequest request) {
        // Spring Security valida el email y la contrasena (BCrypt internamente)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Genero el token JWT firmado para el usuario autenticado
        String token = jwtUtil.generarToken(userDetails);

        // Extraigo el rol del usuario desde sus autoridades
        NombreRol rol = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(authority -> authority.replace("ROLE_", ""))
                .map(NombreRol::valueOf)
                .findFirst()
                .orElse(null);

        return AuthResponse.builder()
                .token(token)
                .tipo("Bearer")
                .email(userDetails.getEmail())
                .rol(rol)
                .build();
    }
}
