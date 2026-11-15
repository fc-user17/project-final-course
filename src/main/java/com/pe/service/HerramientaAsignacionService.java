package com.pe.service;

import com.pe.dto.AsignarHerramientaRequest;
import com.pe.dto.HerramientaAsignacionResponse;

import java.util.List;

public interface HerramientaAsignacionService {

    HerramientaAsignacionResponse asignar(
            Long herramientaId, AsignarHerramientaRequest request);

    HerramientaAsignacionResponse registrarDevolucion(Long asignacionId);

    List<HerramientaAsignacionResponse> listarHistorial(Long herramientaId);
}
