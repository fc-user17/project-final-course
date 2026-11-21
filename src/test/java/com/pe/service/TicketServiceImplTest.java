package com.pe.service;

import com.pe.dto.TicketActualizarRequest;
import com.pe.dto.TicketEstadisticasResponse;
import com.pe.dto.TicketRequest;
import com.pe.dto.TicketResponse;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.*;
import com.pe.repository.TicketRepository;
import com.pe.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private TicketServiceImpl ticketService;

    private Usuario usuarioSolicitante;
    private Usuario usuarioTecnico;
    private Rol rolAdmin;
    private Rol rolTecnico;

    @BeforeEach
    void setUp() {
        rolAdmin = Rol.builder().id(1L).nombreRol(NombreRol.ADMIN).descripcion("Admin").build();
        rolTecnico = Rol.builder().id(2L).nombreRol(NombreRol.TECNICO).descripcion("Tecnico").build();

        usuarioSolicitante = Usuario.builder()
                .id(1L)
                .email("admin@empresa.pe")
                .rol(rolAdmin)
                .activo(true)
                .build();

        usuarioTecnico = Usuario.builder()
                .id(2L)
                .email("tecnico@empresa.pe")
                .rol(rolTecnico)
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("Debe crear un ticket correctamente y generar su código correlativo")
    void crearTicket_Exito() {
        TicketRequest request = TicketRequest.builder()
                .titulo("Falla en switch de red")
                .descripcion("El switch del área de finanzas se reinicia solo")
                .categoria(CategoriaTicket.REDES_CONECTIVIDAD)
                .prioridad(Prioridad.ALTA)
                .build();

        Ticket ticketGuardado = Ticket.builder()
                .id(10L)
                .codigo("TCK-00010")
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .categoria(request.getCategoria())
                .prioridad(request.getPrioridad())
                .estado(EstadoTicket.ABIERTO)
                .usuarioSolicitante(usuarioSolicitante)
                .build();

        when(usuarioRepository.findByEmail("admin@empresa.pe")).thenReturn(Optional.of(usuarioSolicitante));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticketGuardado);

        TicketResponse response = ticketService.crearTicket(request, "admin@empresa.pe");

        assertThat(response).isNotNull();
        assertThat(response.getCodigo()).isEqualTo("TCK-00010");
        assertThat(response.getTitulo()).isEqualTo("Falla en switch de red");
        assertThat(response.getEstado()).isEqualTo(EstadoTicket.ABIERTO);
        assertThat(response.getSolicitanteEmail()).isEqualTo("admin@empresa.pe");
        verify(ticketRepository, times(2)).save(any(Ticket.class));
    }

    @Test
    @DisplayName("Debe lanzar ResourceNotFoundException si el usuario solicitante no existe")
    void crearTicket_UsuarioNoEncontrado() {
        TicketRequest request = TicketRequest.builder()
                .titulo("Problema con mouse")
                .descripcion("No funciona")
                .categoria(CategoriaTicket.HARDWARE)
                .prioridad(Prioridad.BAJA)
                .build();

        when(usuarioRepository.findByEmail("desconocido@empresa.pe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.crearTicket(request, "desconocido@empresa.pe"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Usuario solicitante no encontrado");
    }

    @Test
    @DisplayName("Debe listar los tickets pertenecientes al usuario autenticado")
    void listarMisTickets_Exito() {
        Ticket ticket = Ticket.builder()
                .id(1L)
                .codigo("TCK-00001")
                .titulo("Ticket de prueba")
                .descripcion("Descripción")
                .categoria(CategoriaTicket.SOFTWARE)
                .prioridad(Prioridad.MEDIA)
                .estado(EstadoTicket.ABIERTO)
                .usuarioSolicitante(usuarioSolicitante)
                .build();

        when(usuarioRepository.findByEmail("admin@empresa.pe")).thenReturn(Optional.of(usuarioSolicitante));
        when(ticketRepository.findByUsuarioSolicitanteIdOrderByFechaCreacionDesc(1L)).thenReturn(List.of(ticket));

        List<TicketResponse> resultado = ticketService.listarMisTickets("admin@empresa.pe");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getCodigo()).isEqualTo("TCK-00001");
    }

    @Test
    @DisplayName("Debe actualizar el estado a RESUELTO, asignar técnico y registrar solución con fecha de cierre")
    void actualizarTicket_ResolucionExitosa() {
        Ticket ticketExistente = Ticket.builder()
                .id(5L)
                .codigo("TCK-00005")
                .titulo("Reemplazo de teclado")
                .descripcion("Teclado dañado")
                .categoria(CategoriaTicket.HARDWARE)
                .prioridad(Prioridad.MEDIA)
                .estado(EstadoTicket.EN_PROCESO)
                .usuarioSolicitante(usuarioSolicitante)
                .build();

        TicketActualizarRequest request = TicketActualizarRequest.builder()
                .estado(EstadoTicket.RESUELTO)
                .tecnicoAsignadoId(2L)
                .solucion("Se entregó teclado nuevo de repuesto")
                .build();

        when(ticketRepository.findById(5L)).thenReturn(Optional.of(ticketExistente));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuarioTecnico));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketResponse response = ticketService.actualizarTicket(5L, request, "tecnico@empresa.pe");

        assertThat(response.getEstado()).isEqualTo(EstadoTicket.RESUELTO);
        assertThat(response.getSolucion()).isEqualTo("Se entregó teclado nuevo de repuesto");
        assertThat(response.getTecnicoEmail()).isEqualTo("tecnico@empresa.pe");
        assertThat(response.getFechaCierre()).isNotNull();
    }

    @Test
    @DisplayName("Debe calcular correctamente las estadísticas de los tickets")
    void obtenerEstadisticas_Exito() {
        when(ticketRepository.count()).thenReturn(10L);
        when(ticketRepository.countByEstado(EstadoTicket.ABIERTO)).thenReturn(4L);
        when(ticketRepository.countByEstado(EstadoTicket.EN_PROCESO)).thenReturn(3L);
        when(ticketRepository.countByEstado(EstadoTicket.RESUELTO)).thenReturn(2L);
        when(ticketRepository.countByEstado(EstadoTicket.CERRADO)).thenReturn(1L);
        when(usuarioRepository.findByEmail("admin@empresa.pe")).thenReturn(Optional.of(usuarioSolicitante));
        when(ticketRepository.countByUsuarioSolicitanteId(1L)).thenReturn(5L);

        TicketEstadisticasResponse stats = ticketService.obtenerEstadisticas("admin@empresa.pe");

        assertThat(stats.getTotal()).isEqualTo(10L);
        assertThat(stats.getAbiertos()).isEqualTo(4L);
        assertThat(stats.getEnProceso()).isEqualTo(3L);
        assertThat(stats.getResueltos()).isEqualTo(2L);
        assertThat(stats.getCerrados()).isEqualTo(1L);
        assertThat(stats.getMisTickets()).isEqualTo(5L);
    }
}
