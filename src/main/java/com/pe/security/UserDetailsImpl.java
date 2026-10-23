
package com.pe.security;

import com.pe.model.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final boolean activo;
    private final Collection<? extends GrantedAuthority> authorities;

    // Constructor de 5 argumentos: incluye el estado de la cuenta.
    public UserDetailsImpl(
            Long id,
            String email,
            String password,
            boolean activo,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.activo = activo;
        this.authorities = authorities;
    }

    // Constructor de 4 argumentos: compatibilidad con las pruebas existentes.
    public UserDetailsImpl(
            Long id,
            String email,
            String password,
            Collection<? extends GrantedAuthority> authorities) {
        this(id, email, password, true, authorities);
    }

    // Construir los datos de seguridad a partir del usuario de la BD.
    public static UserDetailsImpl build(Usuario usuario) {
        String nombreRol = usuario.getRol()
                .getNombreRol()
                .name();

        Collection<? extends GrantedAuthority> authorities =
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + nombreRol)
                );

        return new UserDetailsImpl(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getPasswordHash(),
                Boolean.TRUE.equals(usuario.getActivo()),
                authorities
        );
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }
}
