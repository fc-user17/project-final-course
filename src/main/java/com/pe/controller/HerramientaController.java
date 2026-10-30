package com.pe.controller;

import com.pe.dto.HerramientaRequest;
import com.pe.dto.HerramientaResponse;
import com.pe.service.HerramientaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/herramientas")
@RequiredArgsConstructor
public class HerramientaController {

    private final HerramientaService herramientaService;

    @PostMapping
    public ResponseEntity<HerramientaResponse> registrar(
            @Valid @RequestBody HerramientaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(herramientaService.registrar(request));
    }

    @GetMapping
    public ResponseEntity<List<HerramientaResponse>> listar() {
        return ResponseEntity.ok(herramientaService.listar());
    }
}
