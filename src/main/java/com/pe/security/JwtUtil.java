package com.pe.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Utilidad para generar, parsear y validar tokens JWT.
 * RF-501: Genera un token firmado al autenticar exitosamente al usuario.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    /** Construye la clave HMAC-SHA a partir del secreto configurado. */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Genera un token JWT firmado para el usuario autenticado.
     *
     * @param userDetails datos del usuario autenticado
     * @return token JWT como String
     */
    public String generarToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extrae el email (subject) del token JWT.
     *
     * @param token token JWT
     * @return email del usuario
     */
    public String extraerEmail(String token) {
        return parsearClaims(token).getSubject();
    }

    /**
     * Valida que el token pertenezca al usuario y no haya expirado.
     *
     * @param token       token JWT
     * @param userDetails datos del usuario
     * @return true si el token es válido
     */
    public boolean esTokenValido(String token, UserDetails userDetails) {
        final String email = extraerEmail(token);
        return email.equals(userDetails.getUsername()) && !estaExpirado(token);
    }

    /**
     * Verifica si el token ha expirado.
     *
     * @param token token JWT
     * @return true si el token está vencido
     */
    public boolean estaExpirado(String token) {
        return parsearClaims(token).getExpiration().before(new Date());
    }

    private Claims parsearClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
