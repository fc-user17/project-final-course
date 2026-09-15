package com.pe.service;

import com.pe.dto.RegistroRequest;
import com.pe.dto.UsuarioResponse;
import com.pe.exception.DuplicateResourceException;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.Rol;
import com.pe.model.Usuario;
import com.pe.repository.RolRepository;
import com.pe.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación del servicio de usuarios.
 * RF-502: Usa BCryptPasswordEncoder para hashear la contraseña antes de guardar.
 * RF-503: Asigna el rol solicitado validando que exista en la BD.
 */
@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UsuarioResponse registrar(RegistroRequest request) {
        // Validar que el email no esté registrado
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Ya existe un usuario registrado con el email: " + request.getEmail()
            );
        }

        // Buscar el rol solicitado
        Rol rol = rolRepository.findByNombreRol(request.getRol())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Rol no encontrado: " + request.getRol()
                ));

        // Crear usuario con contraseña encriptada (BCrypt)
        Usuario usuario = Usuario.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .rol(rol)
                .activo(true)
                .build();

        Usuario guardado = usuarioRepository.save(usuario);

        return UsuarioResponse.builder()
                .id(guardado.getId())
                .email(guardado.getEmail())
                .rol(guardado.getRol().getNombreRol())
                .activo(guardado.getActivo())
                .build();
    }
}
