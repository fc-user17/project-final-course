package com.pe.security;

import com.pe.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Adaptador que envuelve un {@link Usuario} y lo expone como un {@link UserDetails}
 * compatible con Spring Security.
 * RF-501: Permite que Spring Security gestione la autenticación del usuario.
 */
@AllArgsConstructor
@Getter
public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * Construye un UserDetailsImpl a partir de la entidad Usuario de la BD.
     * El rol se convierte en una autoridad con prefijo "ROLE_".
     */
    public static UserDetailsImpl build(Usuario usuario) {
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + usuario.getRol().getNombreRol().name())
        );
        return new UserDetailsImpl(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getPasswordHash(),
                authorities
        );
    }

    /** Spring Security usa el email como nombre de usuario. */
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
        return true;
    }
}
