package com.pe.config;

import com.pe.model.NombreRol;
import com.pe.model.Rol;
import com.pe.model.Usuario;
import com.pe.repository.RolRepository;
import com.pe.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Seeder que se ejecuta automaticamente al iniciar la aplicacion.
 *
 * Se encarga de:
 * 1. Insertar los 4 roles del sistema si aun no existen en la BD.
 * 2. Crear usuarios de prueba para los cuatro roles si no existen.
 *
 * Esto garantiza que la app siempre tenga los datos minimos necesarios
 * para funcionar sin tener que correr scripts SQL manualmente.
 *
 * Credenciales de prueba:
 *   ADMIN:    admin@empresa.pe / Admin123!
 *   TECNICO:  tecnico@empresa.pe / Tecnico123!
 *   RRHH:     rrhh@empresa.pe / Rrhh123!
 *   FINANZAS: finanzas@empresa.pe / Finanzas123!
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Iniciando seeder de datos base...");
        seedRoles();
        seedUsers();
        log.info("Seeder finalizado correctamente.");
    }

    /** Inserta los roles por defecto si no existen en la tabla roles. */
    private void seedRoles() {
        Map<NombreRol, String> descripcionPorRol = Map.of(
                NombreRol.ADMIN,     "Administrador del sistema con acceso total",
                NombreRol.TECNICO,   "Tecnico de mantenimiento y servicios",
                NombreRol.RRHH,      "Recursos Humanos - gestion de personal",
                NombreRol.FINANZAS,  "Administracion y finanzas"
        );

        for (NombreRol nombreRol : NombreRol.values()) {
            if (rolRepository.findByNombreRol(nombreRol).isEmpty()) {
                Rol rol = Rol.builder()
                        .nombreRol(nombreRol)
                        .descripcion(descripcionPorRol.get(nombreRol))
                        .build();
                rolRepository.save(rol);
                log.info("Rol insertado: {}", nombreRol);
            }
        }
    }

    /** Crea las cuentas de prueba para cada rol si todavía no existen. */
    private void seedUsers() {
        seedUser("admin@empresa.pe", "Admin123!", NombreRol.ADMIN);
        seedUser("tecnico@empresa.pe", "Tecnico123!", NombreRol.TECNICO);
        seedUser("rrhh@empresa.pe", "Rrhh123!", NombreRol.RRHH);
        seedUser("finanzas@empresa.pe", "Finanzas123!", NombreRol.FINANZAS);
    }

    private void seedUser(String email, String password, NombreRol nombreRol) {
        if (usuarioRepository.existsByEmail(email)) {
            return;
        }

        Rol rol = rolRepository.findByNombreRol(nombreRol)
                .orElseThrow(() -> new RuntimeException("El rol " + nombreRol + " no fue encontrado. Verifica el seeder de roles."));

        Usuario usuario = Usuario.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .rol(rol)
                .activo(true)
                .build();

        usuarioRepository.save(usuario);
        log.info("Usuario de prueba creado para {}: {}", nombreRol, email);
    }
}
