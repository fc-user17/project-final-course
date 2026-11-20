package com.pe.repository;

import com.pe.model.EstadoTicket;
import com.pe.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByCodigo(String codigo);

    List<Ticket> findByUsuarioSolicitanteIdOrderByFechaCreacionDesc(Long usuarioSolicitanteId);

    List<Ticket> findAllByOrderByFechaCreacionDesc();

    List<Ticket> findByEstadoOrderByFechaCreacionDesc(EstadoTicket estado);

    List<Ticket> findByTecnicoAsignadoIdOrderByFechaCreacionDesc(Long tecnicoId);

    long countByEstado(EstadoTicket estado);

    long countByUsuarioSolicitanteId(Long usuarioSolicitanteId);

    Optional<Ticket> findTopByOrderByIdDesc();
}
