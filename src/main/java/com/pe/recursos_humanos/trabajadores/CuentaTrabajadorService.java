
package com.pe.recursos_humanos.trabajadores;

import com.pe.model.NombreRol;
import com.pe.model.Rol;
import com.pe.model.Usuario;
import com.pe.repository.RolRepository;
import com.pe.repository.UsuarioRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CuentaTrabajadorService {

    private final TrabajadorRepository trabajadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public CuentaTrabajadorService(
            TrabajadorRepository trabajadorRepository,
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder) {

        this.trabajadorRepository = trabajadorRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void crearCuenta(Long trabajadorId, CrearCuentaRequest request) {

        Trabajador trabajador = trabajadorRepository.findById(trabajadorId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Trabajador no encontrado"));

        if (trabajador.getUsuario() != null) {
            throw new IllegalStateException(
                    "Este trabajador ya tiene una cuenta creada");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("El correo es obligatorio");
        }

        if (request.getPassword() == null
                || request.getPassword().length() < 8) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener al menos 8 caracteres");
        }

        String email = request.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Este correo ya está registrado");
        }

        Rol rol = rolRepository.findByNombreRol(NombreRol.TRABAJADOR)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "No existe el rol TRABAJADOR"));

        Usuario usuario = Usuario.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .rol(rol)
                .activo(true)
                .build();

        usuarioRepository.save(usuario);

        trabajador.setUsuario(usuario);
        trabajadorRepository.save(trabajador);
    }
}
