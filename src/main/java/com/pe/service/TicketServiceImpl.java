package com.pe.service;

import com.pe.dto.TicketActualizarRequest;
import com.pe.dto.TicketEstadisticasResponse;
import com.pe.dto.TicketRequest;
import com.pe.dto.TicketResponse;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.EstadoTicket;
import com.pe.model.Ticket;
import com.pe.model.Usuario;
import com.pe.repository.TicketRepository;
import com.pe.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public TicketResponse crearTicket(TicketRequest request, String emailUsuario) {
        Usuario solicitante = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario solicitante no encontrado con email: " + emailUsuario));

        String tempCodigo = "TCK-TEMP-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        Ticket ticket = Ticket.builder()
                .codigo(tempCodigo)
                .titulo(request.getTitulo().trim())
                .descripcion(request.getDescripcion().trim())
                .categoria(request.getCategoria())
                .prioridad(request.getPrioridad())
                .estado(EstadoTicket.ABIERTO)
                .usuarioSolicitante(solicitante)
                .build();

        ticket = ticketRepository.save(ticket);
        ticket.setCodigo(String.format("TCK-%05d", ticket.getId()));
        ticket = ticketRepository.save(ticket);

        log.info("[TICKETS] Creado nuevo ticket {} por usuario {}", ticket.getCodigo(), emailUsuario);
        return mapToResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> listarMisTickets(String emailUsuario) {
        Usuario solicitante = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con email: " + emailUsuario));

        return ticketRepository.findByUsuarioSolicitanteIdOrderByFechaCreacionDesc(solicitante.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> listarTodos(EstadoTicket estado) {
        List<Ticket> tickets = (estado != null)
                ? ticketRepository.findByEstadoOrderByFechaCreacionDesc(estado)
                : ticketRepository.findAllByOrderByFechaCreacionDesc();

        return tickets.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse buscarPorId(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket no encontrado con ID: " + id));
        return mapToResponse(ticket);
    }

    @Override
    @Transactional
    public TicketResponse actualizarTicket(Long id, TicketActualizarRequest request, String emailUsuarioModificador) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket no encontrado con ID: " + id));

        if (request.getEstado() != null) {
            ticket.setEstado(request.getEstado());
            if (request.getEstado() == EstadoTicket.RESUELTO || request.getEstado() == EstadoTicket.CERRADO) {
                if (ticket.getFechaCierre() == null) {
                    ticket.setFechaCierre(LocalDateTime.now());
                }
            } else if (request.getEstado() == EstadoTicket.ABIERTO || request.getEstado() == EstadoTicket.EN_PROCESO) {
                ticket.setFechaCierre(null);
            }
        }

        if (request.getPrioridad() != null) {
            ticket.setPrioridad(request.getPrioridad());
        }

        if (request.getTecnicoAsignadoId() != null) {
            if (request.getTecnicoAsignadoId() <= 0) {
                ticket.setTecnicoAsignado(null);
            } else {
                Usuario tecnico = usuarioRepository.findById(request.getTecnicoAsignadoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Técnico no encontrado con ID: " + request.getTecnicoAsignadoId()));
                ticket.setTecnicoAsignado(tecnico);
            }
        }

        if (request.getSolucion() != null) {
            ticket.setSolucion(request.getSolucion().trim());
        }

        Ticket guardado = ticketRepository.save(ticket);
        log.info("[TICKETS] Ticket {} actualizado por {}", guardado.getCodigo(), emailUsuarioModificador);
        return mapToResponse(guardado);
    }

    @Override
    @Transactional
    public void eliminarTicket(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ticket no encontrado con ID: " + id);
        }
        ticketRepository.deleteById(id);
        log.info("[TICKETS] Ticket ID {} eliminado", id);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketEstadisticasResponse obtenerEstadisticas(String emailUsuario) {
        long total = ticketRepository.count();
        long abiertos = ticketRepository.countByEstado(EstadoTicket.ABIERTO);
        long enProceso = ticketRepository.countByEstado(EstadoTicket.EN_PROCESO);
        long resueltos = ticketRepository.countByEstado(EstadoTicket.RESUELTO);
        long cerrados = ticketRepository.countByEstado(EstadoTicket.CERRADO);

        long misTickets = 0;
        if (emailUsuario != null && !emailUsuario.isBlank()) {
            misTickets = usuarioRepository.findByEmail(emailUsuario)
                    .map(u -> ticketRepository.countByUsuarioSolicitanteId(u.getId()))
                    .orElse(0L);
        }

        return TicketEstadisticasResponse.builder()
                .total(total)
                .abiertos(abiertos)
                .enProceso(enProceso)
                .resueltos(resueltos)
                .cerrados(cerrados)
                .misTickets(misTickets)
                .build();
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        Usuario solicitante = ticket.getUsuarioSolicitante();
        Usuario tecnico = ticket.getTecnicoAsignado();

        return TicketResponse.builder()
                .id(ticket.getId())
                .codigo(ticket.getCodigo())
                .titulo(ticket.getTitulo())
                .descripcion(ticket.getDescripcion())
                .categoria(ticket.getCategoria())
                .categoriaDescripcion(ticket.getCategoria() != null ? ticket.getCategoria().getDescripcion() : null)
                .prioridad(ticket.getPrioridad())
                .estado(ticket.getEstado())
                .estadoDescripcion(ticket.getEstado() != null ? ticket.getEstado().getDescripcion() : null)
                .solicitanteId(solicitante != null ? solicitante.getId() : null)
                .solicitanteEmail(solicitante != null ? solicitante.getEmail() : null)
                .solicitanteRol(solicitante != null && solicitante.getRol() != null && solicitante.getRol().getNombreRol() != null
                        ? solicitante.getRol().getNombreRol().name() : null)
                .tecnicoId(tecnico != null ? tecnico.getId() : null)
                .tecnicoEmail(tecnico != null ? tecnico.getEmail() : null)
                .fechaCreacion(ticket.getFechaCreacion())
                .fechaActualizacion(ticket.getFechaActualizacion())
                .fechaCierre(ticket.getFechaCierre())
                .solucion(ticket.getSolucion())
                .build();
    }
}
