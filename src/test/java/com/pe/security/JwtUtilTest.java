package com.pe.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests unitarios para JwtUtil.
 *
 * Verifico que el token se genera bien, que el email se extrae correctamente,
 * y que la validacion falle cuando el token no corresponde al usuario o esta vencido.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtUtil - Generacion y validacion de tokens JWT")
class JwtUtilTest {

    @InjectMocks
    private JwtUtil jwtUtil;

    // Uso ReflectionTestUtils para inyectar los @Value sin levantar el contexto de Spring
    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtUtil, "secret",
                "clave_secreta_super_segura_modulo5_minimo_256_bits_para_hs256_ok");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86400000L); // 24 horas
    }

    /** Construye un UserDetails de prueba con el email dado. */
    private UserDetails usuario(String email) {
        return new User(email, "hash_contrasena",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS EXITOSOS ✅
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[OK] generarToken con usuario valido devuelve un token no nulo y no vacio")
    void generarToken_conUsuarioValido_retornaTokenNoNulo() {
        UserDetails userDetails = usuario("admin@empresa.pe");

        String token = jwtUtil.generarToken(userDetails);

        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    @DisplayName("[OK] extraerEmail recupera el mismo email con el que se genero el token")
    void extraerEmail_conTokenValido_retornaEmailOriginal() {
        String emailOriginal = "tecnico@empresa.pe";
        String token = jwtUtil.generarToken(usuario(emailOriginal));

        String emailExtraido = jwtUtil.extraerEmail(token);

        assertEquals(emailOriginal, emailExtraido);
    }

    @Test
    @DisplayName("[OK] un token recien generado no debe estar expirado")
    void estaExpirado_conTokenFresco_retornaFalse() {
        String token = jwtUtil.generarToken(usuario("rrhh@empresa.pe"));

        assertFalse(jwtUtil.estaExpirado(token));
    }

    @Test
    @DisplayName("[OK] esTokenValido retorna true cuando el token pertenece al mismo usuario")
    void esTokenValido_conTokenYUsuarioCorrecto_retornaTrue() {
        UserDetails userDetails = usuario("finanzas@empresa.pe");
        String token = jwtUtil.generarToken(userDetails);

        assertTrue(jwtUtil.esTokenValido(token, userDetails));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASOS FALLIDOS ❌
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("[ERROR] esTokenValido retorna false si el token pertenece a otro usuario")
    void esTokenValido_conUsuarioDiferente_retornaFalse() {
        UserDetails propietario  = usuario("admin@empresa.pe");
        UserDetails otroUsuario  = usuario("tecnico@empresa.pe");
        String token = jwtUtil.generarToken(propietario);

        // El token fue generado para admin, no para tecnico
        assertFalse(jwtUtil.esTokenValido(token, otroUsuario));
    }

    @Test
    @DisplayName("[ERROR] esTokenValido retorna false cuando el token ya expiro")
    void esTokenValido_conTokenExpirado_retornaFalse() {
        // Configuro la expiracion en -1 segundo: el token nace ya vencido
        ReflectionTestUtils.setField(jwtUtil, "expiration", -1000L);
        UserDetails userDetails = usuario("admin@empresa.pe");
        String tokenVencido = jwtUtil.generarToken(userDetails);

        assertFalse(jwtUtil.esTokenValido(tokenVencido, userDetails));
    }

    @Test
    @DisplayName("[ERROR] estaExpirado retorna true cuando el token ya vencio")
    void estaExpirado_conTokenExpirado_retornaTrue() {
        ReflectionTestUtils.setField(jwtUtil, "expiration", -1000L);
        String tokenVencido = jwtUtil.generarToken(usuario("admin@empresa.pe"));

        assertTrue(jwtUtil.estaExpirado(tokenVencido));
    }
}
