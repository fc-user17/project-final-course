package com.pe.service;

import com.pe.dto.HerramientaRequest;
import com.pe.dto.HerramientaResponse;

import java.util.List;

public interface HerramientaService {

    HerramientaResponse registrar(HerramientaRequest request);

    List<HerramientaResponse> listar();
}
