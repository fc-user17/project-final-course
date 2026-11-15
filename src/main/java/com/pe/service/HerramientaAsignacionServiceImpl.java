package com.pe.service;

import com.pe.dto.AsignarHerramientaRequest;
import com.pe.dto.HerramientaAsignacionResponse;
import com.pe.exception.ConflictException;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.EstadoHerramienta;
import com.pe.model.Herramienta;
import com.pe.model.HerramientaAsignacion;
import com.pe.recursos_humanos.trabajadores.Trabajador;
import com.pe.recursos_humanos.trabajadores.TrabajadorRepository;
import com.pe.repository.HerramientaAsignacionRepository;
import com.pe.repository.HerramientaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class HerramientaAsignacionServiceImpl implements HerramientaAsignacionService {

    private final HerramientaRepository herramientaRepository;
    private final HerramientaAsignacionRepository asignacionRepository;
    private final TrabajadorRepository trabajadorRepository;

    @Override
    public HerramientaAsignacionResponse asignar(
            Long herramientaId, AsignarHerramientaRequest request) {
        Herramienta herramienta = buscarHerramienta(herramientaId);
        Trabajador tecnico = trabajadorRepository.findById(request.getTecnicoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el técnico con id " + request.getTecnicoId()));

        if (!"ACTIVO".equalsIgnoreCase(tecnico.getEstado())) {
            throw new ConflictException(
                    "No se puede asignar una herramienta a un técnico inactivo");
        }
        if (herramienta.getEstado() != EstadoHerramienta.DISPONIBLE
                || asignacionRepository.existsByHerramientaIdAndFechaDevolucionIsNull(
                        herramientaId)) {
            throw new ConflictException(
                    "La herramienta no está disponible para asignación");
        }

        HerramientaAsignacion asignacion = new HerramientaAsignacion();
        asignacion.setHerramienta(herramienta);
        asignacion.setTecnicoId(tecnico.getId());

        herramienta.setEstado(EstadoHerramienta.ASIGNADA);
        herramientaRepository.save(herramienta);

        return convertirAResponse(asignacionRepository.save(asignacion));
    }

    @Override
    public HerramientaAsignacionResponse registrarDevolucion(Long asignacionId) {
        HerramientaAsignacion asignacion = asignacionRepository.findById(asignacionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe la asignación de herramienta con id " + asignacionId));

        if (asignacion.getFechaDevolucion() != null) {
            throw new ConflictException(
                    "La herramienta ya fue devuelta para esta asignación");
        }

        asignacion.setFechaDevolucion(LocalDateTime.now());
        asignacion.getHerramienta().setEstado(EstadoHerramienta.DISPONIBLE);
        return convertirAResponse(asignacionRepository.save(asignacion));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HerramientaAsignacionResponse> listarHistorial(Long herramientaId) {
        buscarHerramienta(herramientaId);
        return asignacionRepository
                .findByHerramientaIdOrderByFechaAsignacionDesc(herramientaId)
                .stream()
                .map(this::convertirAResponse)
                .toList();
    }

    private Herramienta buscarHerramienta(Long herramientaId) {
        return herramientaRepository.findById(herramientaId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe la herramienta con id " + herramientaId));
    }

    private HerramientaAsignacionResponse convertirAResponse(
            HerramientaAsignacion asignacion) {
        Herramienta herramienta = asignacion.getHerramienta();
        return HerramientaAsignacionResponse.builder()
                .asignacionId(asignacion.getId())
                .herramientaId(herramienta.getId())
                .codigoHerramienta(herramienta.getCodigo())
                .nombreHerramienta(herramienta.getNombre())
                .tecnicoId(asignacion.getTecnicoId())
                .fechaAsignacion(asignacion.getFechaAsignacion())
                .fechaDevolucion(asignacion.getFechaDevolucion())
                .build();
    }
}
