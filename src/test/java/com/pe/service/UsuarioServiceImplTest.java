package com.pe.service;

import com.pe.dto.RegistroRequest;
import com.pe.dto.UsuarioResponse;
import com.pe.exception.DuplicateResourceException;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.NombreRol;
import com.pe.model.Rol;
import com.pe.model.Usuario;
import com.pe.repository.RolRepository;
import com.pe.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para UsuarioServiceImpl.
 *
 * Me aseguro de que el registro funcione correctamente cuando los datos son validos,
 * y que explote de la forma correcta cuando el email ya existe o el rol no existe en la BD.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioServiceImpl - Registro de usuarios con encriptacion BCrypt")
class UsuarioServiceImplTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    /** Construye un RegistroRequest de prueba. */
    private RegistroRequest buildRequest(String email, String password, NombreRol rol) {
        RegistroRequest request = new RegistroRequest();
        request.setEmail(email);
        request.setPassword(password);
        request.setRol(rol);
        return request;
    }

    /** Construye un Rol de prueba. */
    private Rol buildRol(NombreRol nombreRol) {
        return Rol.builder().id(1L).nombreRol(nombreRol).descripcion("Rol de prueba").build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS EXITOSOS ✅
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[OK] registrar con datos validos devuelve el UsuarioResponse correcto")
    void registrar_conDatosValidos_retornaUsuarioResponse() {
        RegistroRequest request = buildRequest("nuevo@empresa.pe", "Password123!", NombreRol.TECNICO);
        Rol rol = buildRol(NombreRol.TECNICO);

        when(usuarioRepository.existsByEmail("nuevo@empresa.pe")).thenReturn(false);
        when(rolRepository.findByNombreRol(NombreRol.TECNICO)).thenReturn(Optional.of(rol));
        when(passwordEncoder.encode("Password123!")).thenReturn("$2a$10$hash_generado");

        Usuario usuarioGuardado = Usuario.builder()
                .id(1L)
                .email("nuevo@empresa.pe")
                .passwordHash("$2a$10$hash_generado")
                .rol(rol)
                .activo(true)
                .build();
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioGuardado);

        UsuarioResponse response = usuarioService.registrar(request);

        assertNotNull(response);
        assertEquals("nuevo@empresa.pe", response.getEmail());
        assertEquals(NombreRol.TECNICO, response.getRol());
        assertTrue(response.getActivo());
    }

    @Test
    @DisplayName("[OK] la contrasena se encripta con BCrypt antes de guardar en la BD")
    void registrar_conPasswordEnTextoPlano_llamaAlPasswordEncoder() {
        RegistroRequest request = buildRequest("otro@empresa.pe", "MiPassword!", NombreRol.RRHH);
        Rol rol = buildRol(NombreRol.RRHH);

        when(usuarioRepository.existsByEmail("otro@empresa.pe")).thenReturn(false);
        when(rolRepository.findByNombreRol(NombreRol.RRHH)).thenReturn(Optional.of(rol));
        when(passwordEncoder.encode("MiPassword!")).thenReturn("$2a$10$hash");
        when(usuarioRepository.save(any())).thenReturn(
                Usuario.builder().id(2L).email("otro@empresa.pe").passwordHash("$2a$10$hash")
                        .rol(rol).activo(true).build()
        );

        usuarioService.registrar(request);

        // Verifico que se llamo al encoder exactamente una vez con la contrasena original
        verify(passwordEncoder, times(1)).encode("MiPassword!");
    }

    @Test
    @DisplayName("[OK] se llama a save exactamente una vez al registrar un usuario valido")
    void registrar_conDatosValidos_guardaElUsuarioEnLaBD() {
        RegistroRequest request = buildRequest("guardar@empresa.pe", "Pwd!", NombreRol.FINANZAS);
        Rol rol = buildRol(NombreRol.FINANZAS);

        when(usuarioRepository.existsByEmail("guardar@empresa.pe")).thenReturn(false);
        when(rolRepository.findByNombreRol(NombreRol.FINANZAS)).thenReturn(Optional.of(rol));
        when(passwordEncoder.encode(any())).thenReturn("$2a$10$hash");
        when(usuarioRepository.save(any())).thenReturn(
                Usuario.builder().id(3L).email("guardar@empresa.pe")
                        .passwordHash("$2a$10$hash").rol(rol).activo(true).build()
        );

        usuarioService.registrar(request);

        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS FALLIDOS ❌
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[ERROR] lanza DuplicateResourceException si el email ya esta registrado")
    void registrar_conEmailDuplicado_lanzaDuplicateResourceException() {
        RegistroRequest request = buildRequest("existente@empresa.pe", "Pwd!", NombreRol.ADMIN);

        when(usuarioRepository.existsByEmail("existente@empresa.pe")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> usuarioService.registrar(request));
    }

    @Test
    @DisplayName("[ERROR] NO guarda en la BD si el email ya existe (evita registros duplicados)")
    void registrar_conEmailDuplicado_noLlamaASave() {
        RegistroRequest request = buildRequest("duplicado@empresa.pe", "Pwd!", NombreRol.ADMIN);

        when(usuarioRepository.existsByEmail("duplicado@empresa.pe")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> usuarioService.registrar(request));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("[ERROR] lanza ResourceNotFoundException si el rol no existe en la BD")
    void registrar_conRolInexistente_lanzaResourceNotFoundException() {
        RegistroRequest request = buildRequest("nuevo@empresa.pe", "Pwd!", NombreRol.FINANZAS);

        when(usuarioRepository.existsByEmail("nuevo@empresa.pe")).thenReturn(false);
        when(rolRepository.findByNombreRol(NombreRol.FINANZAS)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> usuarioService.registrar(request));
    }

    @Test
    @DisplayName("[ERROR] NO guarda en la BD si el rol no existe")
    void registrar_conRolInexistente_noLlamaASave() {
        RegistroRequest request = buildRequest("nuevo@empresa.pe", "Pwd!", NombreRol.RRHH);

        when(usuarioRepository.existsByEmail("nuevo@empresa.pe")).thenReturn(false);
        when(rolRepository.findByNombreRol(NombreRol.RRHH)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> usuarioService.registrar(request));

        verify(usuarioRepository, never()).save(any());
    }
}
