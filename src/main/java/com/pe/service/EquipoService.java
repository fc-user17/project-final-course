package com.pe.service;

import com.pe.dto.EquipoRequest;
import com.pe.dto.EquipoResponse;

import java.util.List;

public interface EquipoService {

    EquipoResponse registrar(EquipoRequest request);

    EquipoResponse actualizar(Long id, EquipoRequest request);

    EquipoResponse buscarPorId(Long id);

    List<EquipoResponse> listar();
}
