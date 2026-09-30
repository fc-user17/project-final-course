package com.pe.service;

import com.pe.model.NombreRol;
import com.pe.model.Rol;
import com.pe.model.Usuario;
import com.pe.repository.UsuarioRepository;
import com.pe.security.UserDetailsImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios para UserDetailsServiceImpl.
 *
 * Verifico que Spring Security puede cargar un usuario correctamente por email,
 * y que se lanza la excepcion adecuada cuando el usuario no existe.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserDetailsServiceImpl - Carga de usuario para Spring Security")
class UserDetailsServiceImplTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    /** Construye un Usuario con rol para usar en los tests. */
    private Usuario buildUsuario(String email, NombreRol nombreRol) {
        Rol rol = Rol.builder()
                .id(1L)
                .nombreRol(nombreRol)
                .descripcion("Descripcion del rol")
                .build();

        return Usuario.builder()
                .id(1L)
                .email(email)
                .passwordHash("$2a$10$hash_bcrypt_simulado")
                .rol(rol)
                .activo(true)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS EXITOSOS ✅
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[OK] carga el usuario correctamente cuando el email existe en la BD")
    void loadUserByUsername_conEmailExistente_retornaUserDetails() {
        String email = "admin@empresa.pe";
        when(usuarioRepository.findByEmail(email))
                .thenReturn(Optional.of(buildUsuario(email, NombreRol.ADMIN)));

        UserDetails resultado = userDetailsService.loadUserByUsername(email);

        assertNotNull(resultado);
        assertEquals(email, resultado.getUsername());
    }

    @Test
    @DisplayName("[OK] el UserDetails devuelto contiene el rol correcto como autoridad")
    void loadUserByUsername_conEmailExistente_tieneRolCorrecto() {
        String email = "tecnico@empresa.pe";
        when(usuarioRepository.findByEmail(email))
                .thenReturn(Optional.of(buildUsuario(email, NombreRol.TECNICO)));

        UserDetails resultado = userDetailsService.loadUserByUsername(email);

        boolean tieneRolTecnico = resultado.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TECNICO"));
        assertTrue(tieneRolTecnico, "El usuario deberia tener el rol ROLE_TECNICO");
    }

    @Test
    @DisplayName("[OK] el UserDetails devuelto es una instancia de UserDetailsImpl")
    void loadUserByUsername_conEmailExistente_retornaUserDetailsImpl() {
        String email = "rrhh@empresa.pe";
        when(usuarioRepository.findByEmail(email))
                .thenReturn(Optional.of(buildUsuario(email, NombreRol.RRHH)));

        UserDetails resultado = userDetailsService.loadUserByUsername(email);

        assertInstanceOf(UserDetailsImpl.class, resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS FALLIDOS ❌
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[ERROR] lanza UsernameNotFoundException si el email no existe en la BD")
    void loadUserByUsername_conEmailInexistente_lanzaUsernameNotFoundException() {
        String emailInexistente = "fantasma@empresa.pe";
        when(usuarioRepository.findByEmail(emailInexistente))
                .thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername(emailInexistente));
    }

    @Test
    @DisplayName("[ERROR] el mensaje de la excepcion menciona el email que no se encontro")
    void loadUserByUsername_conEmailInexistente_mensajeContieneElEmail() {
        String emailInexistente = "nadie@empresa.pe";
        when(usuarioRepository.findByEmail(emailInexistente))
                .thenReturn(Optional.empty());

        UsernameNotFoundException ex = assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername(emailInexistente));

        assertTrue(ex.getMessage().contains(emailInexistente),
                "El mensaje de error deberia indicar que email no fue encontrado");
    }
}
