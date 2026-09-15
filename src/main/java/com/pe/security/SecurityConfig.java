package com.pe.security;

import com.pe.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuracion central de Spring Security para el modulo de autenticacion.
 *
 * Decisiones de diseno:
 * - La API es stateless: no se usan sesiones HTTP, cada peticion se autentica con JWT.
 * - Se deshabilita CSRF porque no hay formularios web, solo endpoints REST.
 * - Las rutas /api/auth/** son publicas (login y registro no requieren token).
 * - El resto de rutas requiere autenticacion valida.
 * - Se habilita @PreAuthorize con @EnableMethodSecurity para proteger
 *   metodos individuales por rol en otros modulos.
 *
 * RF-503: Control de acceso basado en roles (RBAC).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    /** BCrypt para hashear y verificar contrasenas. Costo por defecto: 10 rondas. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Proveedor de autenticacion que usa UserDetailsServiceImpl + BCrypt.
     * Spring Security lo usa para validar las credenciales en el login.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Expone el AuthenticationManager como bean para poder inyectarlo en AuthServiceImpl.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Cadena de filtros de seguridad principal.
     * Define que rutas son publicas, cuales requieren autenticacion,
     * y registra el JwtAuthFilter antes del filtro estandar de Spring Security.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Sin CSRF: API REST stateless
                .csrf(AbstractHttpConfigurer::disable)

                // Sin sesiones HTTP: cada peticion se autentica de forma independiente
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Reglas de acceso a rutas
                .authorizeHttpRequests(auth -> auth
                        // Endpoints publicos: login y registro
                        .requestMatchers("/api/auth/**").permitAll()
                        // Solo el ADMIN puede acceder a rutas de administracion
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Cualquier otra ruta requiere estar autenticado
                        .anyRequest().authenticated()
                )

                // Registro del proveedor de autenticacion y el filtro JWT
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
