package com.pe.repository;

import com.pe.model.NombreRol;
import com.pe.model.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repositorio para la entidad Rol.
 * RF-503: Consultar roles por nombre para asignación de permisos.
 */
public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByNombreRol(NombreRol nombreRol);
}
