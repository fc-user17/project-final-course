package com.pe.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pe.dto.TicketActualizarRequest;
import com.pe.dto.TicketEstadisticasResponse;
import com.pe.dto.TicketRequest;
import com.pe.dto.TicketResponse;
import com.pe.model.CategoriaTicket;
import com.pe.model.EstadoTicket;
import com.pe.model.Prioridad;
import com.pe.security.JwtUtil;
import com.pe.service.TicketService;
import com.pe.service.UserDetailsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        value = TicketController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@DisplayName("TicketController - Pruebas de integración de endpoints REST de Tickets")
class TicketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @MockitoBean
    private TicketService ticketService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    private UsernamePasswordAuthenticationToken userAuth;
    private UsernamePasswordAuthenticationToken adminAuth;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        userAuth = new UsernamePasswordAuthenticationToken(
                "usuario@empresa.pe",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_TECNICO"))
        );
        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@empresa.pe",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    @Test
    @DisplayName("POST /api/tickets - Debe registrar un ticket y retornar 201 Created")
    void crearTicket_Exito() throws Exception {
        TicketRequest request = TicketRequest.builder()
                .titulo("No funciona la impresora de almacén")
                .descripcion("Atasco recurrente de papel en la bandeja principal")
                .categoria(CategoriaTicket.HARDWARE)
                .prioridad(Prioridad.ALTA)
                .build();

        TicketResponse response = TicketResponse.builder()
                .id(1L)
                .codigo("TCK-00001")
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .categoria(CategoriaTicket.HARDWARE)
                .categoriaDescripcion("Hardware y Equipos")
                .prioridad(Prioridad.ALTA)
                .estado(EstadoTicket.ABIERTO)
                .estadoDescripcion("Abierto")
                .solicitanteEmail("usuario@empresa.pe")
                .build();

        when(ticketService.crearTicket(any(TicketRequest.class), eq("usuario@empresa.pe"))).thenReturn(response);

        mockMvc.perform(post("/api/tickets")
                        .principal(userAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value("TCK-00001"))
                .andExpect(jsonPath("$.titulo").value("No funciona la impresora de almacén"))
                .andExpect(jsonPath("$.estado").value("ABIERTO"));
    }

    @Test
    @DisplayName("GET /api/tickets/mis-tickets - Debe retornar la lista de tickets del usuario autenticado")
    void listarMisTickets_Exito() throws Exception {
        TicketResponse t1 = TicketResponse.builder()
                .id(1L)
                .codigo("TCK-00001")
                .titulo("Problema VPN")
                .categoria(CategoriaTicket.REDES_CONECTIVIDAD)
                .estado(EstadoTicket.ABIERTO)
                .solicitanteEmail("usuario@empresa.pe")
                .build();

        when(ticketService.listarMisTickets("usuario@empresa.pe")).thenReturn(List.of(t1));

        mockMvc.perform(get("/api/tickets/mis-tickets").principal(userAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].codigo").value("TCK-00001"));
    }

    @Test
    @DisplayName("GET /api/tickets/estadisticas - Debe retornar los conteos para el panel")
    void obtenerEstadisticas_Exito() throws Exception {
        TicketEstadisticasResponse stats = TicketEstadisticasResponse.builder()
                .total(8)
                .abiertos(3)
                .enProceso(2)
                .resueltos(2)
                .cerrados(1)
                .misTickets(2)
                .build();

        when(ticketService.obtenerEstadisticas("admin@empresa.pe")).thenReturn(stats);

        mockMvc.perform(get("/api/tickets/estadisticas").principal(adminAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(8))
                .andExpect(jsonPath("$.abiertos").value(3))
                .andExpect(jsonPath("$.misTickets").value(2));
    }
}
