package com.pe.service;

import com.pe.dto.AsignarHerramientaRequest;
import com.pe.dto.HerramientaAsignacionResponse;
import com.pe.exception.ConflictException;
import com.pe.model.EstadoHerramienta;
import com.pe.model.Herramienta;
import com.pe.model.HerramientaAsignacion;
import com.pe.recursos_humanos.trabajadores.Trabajador;
import com.pe.recursos_humanos.trabajadores.TrabajadorRepository;
import com.pe.repository.HerramientaAsignacionRepository;
import com.pe.repository.HerramientaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HerramientaAsignacionServiceImplTest {

    @Mock
    private HerramientaRepository herramientaRepository;

    @Mock
    private HerramientaAsignacionRepository asignacionRepository;

    @Mock
    private TrabajadorRepository trabajadorRepository;

    @InjectMocks
    private HerramientaAsignacionServiceImpl asignacionService;

    @Test
    void asignarHerramientaDisponible_actualizaEstadoYRegistraTecnico() {
        Herramienta herramienta = herramientaDisponible();
        when(herramientaRepository.findById(1L)).thenReturn(Optional.of(herramienta));
        when(trabajadorRepository.findById(7L)).thenReturn(Optional.of(tecnicoActivo()));
        when(asignacionRepository.existsByHerramientaIdAndFechaDevolucionIsNull(1L))
                .thenReturn(false);
        when(asignacionRepository.save(any(HerramientaAsignacion.class)))
                .thenAnswer(invocation -> {
                    HerramientaAsignacion asignacion = invocation.getArgument(0);
                    asignacion.setId(10L);
                    return asignacion;
                });

        HerramientaAsignacionResponse response = asignacionService.asignar(1L, request(7L));

        assertEquals(EstadoHerramienta.ASIGNADA, herramienta.getEstado());
        assertEquals(1L, response.getHerramientaId());
        assertEquals(7L, response.getTecnicoId());
        assertEquals(10L, response.getAsignacionId());
        verify(herramientaRepository).save(herramienta);
    }

    @Test
    void asignarHerramientaOcupada_lanzaConflictoSinCrearAsignacion() {
        Herramienta herramienta = herramientaDisponible();
        when(herramientaRepository.findById(1L)).thenReturn(Optional.of(herramienta));
        when(trabajadorRepository.findById(7L)).thenReturn(Optional.of(tecnicoActivo()));
        when(asignacionRepository.existsByHerramientaIdAndFechaDevolucionIsNull(1L))
                .thenReturn(true);

        assertThrows(ConflictException.class,
                () -> asignacionService.asignar(1L, request(7L)));

        verify(asignacionRepository, never()).save(any(HerramientaAsignacion.class));
        verify(herramientaRepository, never()).save(any(Herramienta.class));
    }

    @Test
    void registrarDevolucion_guardaFechaYLiberaHerramienta() {
        Herramienta herramienta = herramientaDisponible();
        herramienta.setEstado(EstadoHerramienta.ASIGNADA);
        HerramientaAsignacion asignacion = new HerramientaAsignacion();
        asignacion.setId(10L);
        asignacion.setHerramienta(herramienta);
        asignacion.setTecnicoId(7L);
        when(asignacionRepository.findById(10L)).thenReturn(Optional.of(asignacion));
        when(asignacionRepository.save(asignacion)).thenReturn(asignacion);

        HerramientaAsignacionResponse response =
                asignacionService.registrarDevolucion(10L);

        assertNotNull(response.getFechaDevolucion());
        assertEquals(EstadoHerramienta.DISPONIBLE, herramienta.getEstado());
        verify(asignacionRepository).save(asignacion);
    }

    private Herramienta herramientaDisponible() {
        Herramienta herramienta = new Herramienta();
        herramienta.setId(1L);
        herramienta.setCodigo("H-001");
        herramienta.setNombre("Taladro");
        herramienta.setEstado(EstadoHerramienta.DISPONIBLE);
        return herramienta;
    }

    private Trabajador tecnicoActivo() {
        Trabajador tecnico = new Trabajador();
        tecnico.setId(7L);
        tecnico.setEstado("ACTIVO");
        return tecnico;
    }

    private AsignarHerramientaRequest request(Long tecnicoId) {
        AsignarHerramientaRequest request = new AsignarHerramientaRequest();
        request.setTecnicoId(tecnicoId);
        return request;
    }
}
