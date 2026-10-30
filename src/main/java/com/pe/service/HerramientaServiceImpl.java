package com.pe.service;

import com.pe.dto.HerramientaRequest;
import com.pe.dto.HerramientaResponse;
import com.pe.exception.DuplicateResourceException;
import com.pe.model.EstadoHerramienta;
import com.pe.model.Herramienta;
import com.pe.repository.HerramientaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class HerramientaServiceImpl implements HerramientaService {

    private final HerramientaRepository herramientaRepository;

    @Override
    public HerramientaResponse registrar(HerramientaRequest request) {
        String codigo = request.getCodigo().trim();
        herramientaRepository.findByCodigoIgnoreCase(codigo)
                .ifPresent(herramienta -> {
                    throw new DuplicateResourceException(
                            "Ya existe una herramienta con el codigo '" + codigo + "'");
                });

        Herramienta herramienta = new Herramienta();
        herramienta.setCodigo(codigo);
        herramienta.setNombre(request.getNombre().trim());
        herramienta.setDescripcion(limpiarDescripcion(request.getDescripcion()));
        herramienta.setEstado(EstadoHerramienta.DISPONIBLE);

        return convertirAResponse(herramientaRepository.save(herramienta));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HerramientaResponse> listar() {
        return herramientaRepository.findAll().stream()
                .map(this::convertirAResponse)
                .toList();
    }

    private String limpiarDescripcion(String descripcion) {
        if (descripcion == null || descripcion.isBlank()) {
            return null;
        }
        return descripcion.trim();
    }

    private HerramientaResponse convertirAResponse(Herramienta herramienta) {
        return HerramientaResponse.builder()
                .id(herramienta.getId())
                .codigo(herramienta.getCodigo())
                .nombre(herramienta.getNombre())
                .descripcion(herramienta.getDescripcion())
                .estado(herramienta.getEstado())
                .fechaRegistro(herramienta.getFechaRegistro())
                .build();
    }
}
