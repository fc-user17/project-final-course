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
 * 2. Crear un usuario administrador de prueba si no existe.
 *
 * Esto garantiza que la app siempre tenga los datos minimos necesarios
 * para funcionar sin tener que correr scripts SQL manualmente.
 *
 * Credenciales del admin de prueba:
 *   Email:    admin@empresa.pe
 *   Password: Admin123!
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
        seedAdminUser();
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

    /** Crea el usuario administrador inicial si no existe. */
    private void seedAdminUser() {
        String adminEmail = "admin@empresa.pe";

        if (!usuarioRepository.existsByEmail(adminEmail)) {
            Rol rolAdmin = rolRepository.findByNombreRol(NombreRol.ADMIN)
                    .orElseThrow(() -> new RuntimeException("El rol ADMIN no fue encontrado. Verifica el seeder de roles."));

            Usuario admin = Usuario.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode("Admin123!"))
                    .rol(rolAdmin)
                    .activo(true)
                    .build();

            usuarioRepository.save(admin);
            log.info("Usuario admin creado: {}", adminEmail);
        }
    }
}
