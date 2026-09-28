package com.pe.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pe.dto.AuthResponse;
import com.pe.dto.LoginRequest;
import com.pe.dto.RegistroRequest;
import com.pe.dto.UsuarioResponse;
import com.pe.exception.DuplicateResourceException;
import com.pe.exception.SecurityExceptionHandler;
import com.pe.model.NombreRol;
import com.pe.service.AuthService;
import com.pe.service.UsuarioService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de integracion para AuthController usando MockMvc.
 *
 * Excluyo la autoconfiguracion de Spring Security para aislar el controlador
 * e importo el SecurityExceptionHandler para que los errores 401 y 409
 * se manejen correctamente como lo haria en produccion.
 *
 * Pruebo los dos endpoints publicos: /api/auth/login y /api/auth/registro.
 */
@WebMvcTest(
        value = AuthController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@Import(SecurityExceptionHandler.class)
@DisplayName("AuthController - Endpoints de autenticacion y registro")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private UsuarioService usuarioService;

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login ✅ Casos exitosos
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[OK] POST /api/auth/login con credenciales validas retorna 200 y el token JWT")
    void login_conCredencialesValidas_retorna200YToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@empresa.pe");
        request.setPassword("Admin123!");

        AuthResponse response = AuthResponse.builder()
                .token("header.payload.signature")
                .tipo("Bearer")
                .email("admin@empresa.pe")
                .rol(NombreRol.ADMIN)
                .build();

        when(authService.login(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("header.payload.signature"))
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.email").value("admin@empresa.pe"))
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login ❌ Casos fallidos
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[ERROR] POST /api/auth/login con contrasena incorrecta retorna 401")
    void login_conPasswordIncorrecta_retorna401() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@empresa.pe");
        request.setPassword("ContrasenaMala!");

        when(authService.login(any()))
                .thenThrow(new BadCredentialsException("Credenciales incorrectas"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("No autorizado"));
    }

    @Test
    @DisplayName("[ERROR] POST /api/auth/login con email inexistente retorna 401")
    void login_conEmailInexistente_retorna401() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("fantasma@empresa.pe");
        request.setPassword("Cualquiera123!");

        when(authService.login(any()))
                .thenThrow(new BadCredentialsException("Usuario no encontrado"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/registro ✅ Casos exitosos
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[OK] POST /api/auth/registro con datos validos retorna 201 y el usuario creado")
    void registro_conDatosValidos_retorna201YUsuario() throws Exception {
        RegistroRequest request = new RegistroRequest();
        request.setEmail("nuevo@empresa.pe");
        request.setPassword("Password123!");
        request.setRol(NombreRol.TECNICO);

        UsuarioResponse response = UsuarioResponse.builder()
                .id(1L)
                .email("nuevo@empresa.pe")
                .rol(NombreRol.TECNICO)
                .activo(true)
                .build();

        when(usuarioService.registrar(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("nuevo@empresa.pe"))
                .andExpect(jsonPath("$.rol").value("TECNICO"))
                .andExpect(jsonPath("$.activo").value(true));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/registro ❌ Casos fallidos
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[ERROR] POST /api/auth/registro con email ya registrado retorna 409 Conflict")
    void registro_conEmailDuplicado_retorna409() throws Exception {
        RegistroRequest request = new RegistroRequest();
        request.setEmail("existente@empresa.pe");
        request.setPassword("Password123!");
        request.setRol(NombreRol.ADMIN);

        when(usuarioService.registrar(any()))
                .thenThrow(new DuplicateResourceException("El email ya esta registrado"));

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("[ERROR] POST /api/auth/registro sin body retorna 400 Bad Request")
    void registro_sinBody_retorna400() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}
