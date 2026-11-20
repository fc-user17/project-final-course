package com.pe.service;

import com.pe.dto.TicketActualizarRequest;
import com.pe.dto.TicketEstadisticasResponse;
import com.pe.dto.TicketRequest;
import com.pe.dto.TicketResponse;
import com.pe.model.EstadoTicket;

import java.util.List;

public interface TicketService {

    TicketResponse crearTicket(TicketRequest request, String emailUsuario);

    List<TicketResponse> listarMisTickets(String emailUsuario);

    List<TicketResponse> listarTodos(EstadoTicket estado);

    TicketResponse buscarPorId(Long id);

    TicketResponse actualizarTicket(Long id, TicketActualizarRequest request, String emailUsuarioModificador);

    void eliminarTicket(Long id);

    TicketEstadisticasResponse obtenerEstadisticas(String emailUsuario);
}
