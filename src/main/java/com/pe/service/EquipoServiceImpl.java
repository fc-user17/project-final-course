package com.pe.service;

import com.pe.dto.EquipoRequest;
import com.pe.dto.EquipoResponse;
import com.pe.exception.DuplicateResourceException;
import com.pe.exception.ResourceNotFoundException;
import com.pe.model.Equipo;
import com.pe.repository.EquipoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipoServiceImpl implements EquipoService {

    private final EquipoRepository equipoRepository;

    @Override
    public EquipoResponse registrar(EquipoRequest request) {
        validarUnicidad(request, null);
        return convertirAResponse(equipoRepository.save(convertirAEntidad(request)));
    }

    @Override
    public EquipoResponse actualizar(Long id, EquipoRequest request) {
        Equipo equipo = buscarOFallar(id);
        validarUnicidad(request, id);

        equipo.setCodigoPatrimonial(request.getCodigoPatrimonial().trim());
        equipo.setMarca(request.getMarca().trim());
        equipo.setModelo(request.getModelo().trim());
        equipo.setNumeroSerie(request.getNumeroSerie().trim());
        equipo.setEstado(request.getEstado());
        equipo.setUbicacion(request.getUbicacion().trim());
        equipo.setResponsable(request.getResponsable().trim());

        return convertirAResponse(equipoRepository.save(equipo));
    }

    @Override
    @Transactional(readOnly = true)
    public EquipoResponse buscarPorId(Long id) {
        return convertirAResponse(buscarOFallar(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipoResponse> listar() {
        return equipoRepository.findAll().stream()
                .map(this::convertirAResponse)
                .toList();
    }

    private void validarUnicidad(EquipoRequest request, Long idActual) {
        equipoRepository.findByCodigoPatrimonialIgnoreCase(request.getCodigoPatrimonial().trim())
                .filter(equipo -> !equipo.getId().equals(idActual))
                .ifPresent(equipo -> {
                    throw new DuplicateResourceException(
                            "Ya existe un equipo con el codigo patrimonial '"
                                    + request.getCodigoPatrimonial() + "'");
                });

        equipoRepository.findByNumeroSerieIgnoreCase(request.getNumeroSerie().trim())
                .filter(equipo -> !equipo.getId().equals(idActual))
                .ifPresent(equipo -> {
                    throw new DuplicateResourceException(
                            "Ya existe un equipo con el numero de serie '"
                                    + request.getNumeroSerie() + "'");
                });
    }

    private Equipo buscarOFallar(Long id) {
        return equipoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro el equipo con id " + id));
    }

    private Equipo convertirAEntidad(EquipoRequest request) {
        Equipo equipo = new Equipo();
        equipo.setCodigoPatrimonial(request.getCodigoPatrimonial().trim());
        equipo.setMarca(request.getMarca().trim());
        equipo.setModelo(request.getModelo().trim());
        equipo.setNumeroSerie(request.getNumeroSerie().trim());
        equipo.setEstado(request.getEstado());
        equipo.setUbicacion(request.getUbicacion().trim());
        equipo.setResponsable(request.getResponsable().trim());
        return equipo;
    }

    private EquipoResponse convertirAResponse(Equipo equipo) {
        return EquipoResponse.builder()
                .id(equipo.getId())
                .codigoPatrimonial(equipo.getCodigoPatrimonial())
                .marca(equipo.getMarca())
                .modelo(equipo.getModelo())
                .numeroSerie(equipo.getNumeroSerie())
                .estado(equipo.getEstado())
                .ubicacion(equipo.getUbicacion())
                .responsable(equipo.getResponsable())
                .build();
    }
}
