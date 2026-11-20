package com.pe.controller;

import com.pe.dto.TicketActualizarRequest;
import com.pe.dto.TicketEstadisticasResponse;
import com.pe.dto.TicketRequest;
import com.pe.dto.TicketResponse;
import com.pe.model.EstadoTicket;
import com.pe.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión de Tickets de Soporte e Incidencias del área de Sistemas (TI).
 * Permite a cualquier trabajador autenticado generar requerimientos y dar seguimiento a su atención.
 */
@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    /**
     * Registra un nuevo ticket de soporte asociado al usuario autenticado.
     */
    @PostMapping
    public ResponseEntity<TicketResponse> crearTicket(
            @Valid @RequestBody TicketRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        TicketResponse respuesta = ticketService.crearTicket(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    /**
     * Lista únicamente los tickets creados por el usuario que inició sesión.
     */
    @GetMapping("/mis-tickets")
    public ResponseEntity<List<TicketResponse>> listarMisTickets(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(ticketService.listarMisTickets(email));
    }

    /**
     * Lista todos los tickets del sistema, con filtro opcional por estado.
     */
    @GetMapping
    public ResponseEntity<List<TicketResponse>> listarTodos(
            @RequestParam(required = false) EstadoTicket estado) {
        return ResponseEntity.ok(ticketService.listarTodos(estado));
    }

    /**
     * Obtiene los detalles de un ticket específico por su ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.buscarPorId(id));
    }

    /**
     * Actualiza el estado, prioridad, asignación de técnico o solución de un ticket.
     */
    @PutMapping("/{id}")
    public ResponseEntity<TicketResponse> actualizarTicket(
            @PathVariable Long id,
            @RequestBody TicketActualizarRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(ticketService.actualizarTicket(id, request, email));
    }

    /**
     * Elimina un ticket por su ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarTicket(@PathVariable Long id) {
        ticketService.eliminarTicket(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene el resumen de estadísticas y conteos del sistema de tickets.
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<TicketEstadisticasResponse> obtenerEstadisticas(Authentication authentication) {
        String email = (authentication != null) ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.obtenerEstadisticas(email));
    }
}
