package com.pe.service;

import com.pe.dto.AuthResponse;
import com.pe.dto.LoginRequest;
import com.pe.model.NombreRol;
import com.pe.security.JwtUtil;
import com.pe.security.UserDetailsImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para AuthServiceImpl.
 *
 * Verifico el flujo de login exitoso (credenciales correctas generan token)
 * y el caso donde Spring Security rechaza las credenciales por ser incorrectas.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl - Autenticacion y generacion de token JWT")
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    /** Construye un UserDetailsImpl de prueba con el rol indicado. */
    private UserDetailsImpl buildUserDetails(String email, NombreRol nombreRol) {
        return new UserDetailsImpl(
                1L,
                email,
                "$2a$10$hash_bcrypt",
                List.of(new SimpleGrantedAuthority("ROLE_" + nombreRol.name()))
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS EXITOSOS ✅
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[OK] login con credenciales validas devuelve AuthResponse con token JWT")
    void login_conCredencialesValidas_retornaAuthResponseConToken() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@empresa.pe");
        request.setPassword("Admin123!");

        UserDetailsImpl userDetails = buildUserDetails("admin@empresa.pe", NombreRol.ADMIN);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtUtil.generarToken(userDetails)).thenReturn("header.payload.signature");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("header.payload.signature", response.getToken());
        assertEquals("Bearer", response.getTipo());
    }

    @Test
    @DisplayName("[OK] el AuthResponse contiene el email y el rol del usuario autenticado")
    void login_conCredencialesValidas_retornaEmailYRolCorrectos() {
        LoginRequest request = new LoginRequest();
        request.setEmail("tecnico@empresa.pe");
        request.setPassword("Tecnico123!");

        UserDetailsImpl userDetails = buildUserDetails("tecnico@empresa.pe", NombreRol.TECNICO);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtil.generarToken(any())).thenReturn("token.jwt");

        AuthResponse response = authService.login(request);

        assertEquals("tecnico@empresa.pe", response.getEmail());
        assertEquals(NombreRol.TECNICO, response.getRol());
    }

    @Test
    @DisplayName("[OK] se llama a JwtUtil.generarToken exactamente una vez por login exitoso")
    void login_conCredencialesValidas_llamaAGenerarTokenUnaVez() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@empresa.pe");
        request.setPassword("Admin123!");

        UserDetailsImpl userDetails = buildUserDetails("admin@empresa.pe", NombreRol.ADMIN);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtil.generarToken(any())).thenReturn("token");

        authService.login(request);

        verify(jwtUtil, times(1)).generarToken(userDetails);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS FALLIDOS ❌
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[ERROR] login con contrasena incorrecta lanza BadCredentialsException")
    void login_conPasswordIncorrecta_lanzaBadCredentialsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@empresa.pe");
        request.setPassword("ContrasenaMal123");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Credenciales incorrectas"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("[ERROR] cuando el login falla, NO se genera ningun token JWT")
    void login_conCredencialesInvalidas_noGeneraToken() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@empresa.pe");
        request.setPassword("Incorrecta!");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Credenciales incorrectas"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));

        // Me aseguro de que jwtUtil nunca fue invocado si la autenticacion fallo
        verify(jwtUtil, never()).generarToken(any());
    }

    @Test
    @DisplayName("[ERROR] login con email inexistente también lanza BadCredentialsException")
    void login_conEmailInexistente_lanzaBadCredentialsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("noexiste@empresa.pe");
        request.setPassword("Cualquiera123");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Usuario no encontrado"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }
}
