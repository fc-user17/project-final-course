package com.pe.service;

import java.util.List;

import com.pe.dto.TipoMantenimientoRequest;
import com.pe.dto.TipoMantenimientoResponse;

public interface TipoMantenimientoService {

    TipoMantenimientoResponse save(TipoMantenimientoRequest request);

    TipoMantenimientoResponse update(Long id, TipoMantenimientoRequest request);

    TipoMantenimientoResponse findById(Long id);

    List<TipoMantenimientoResponse> findAll();

    List<TipoMantenimientoResponse> findActive();

    void delete(Long id);

    TipoMantenimientoResponse changeStatus(Long id, boolean activo);
}
