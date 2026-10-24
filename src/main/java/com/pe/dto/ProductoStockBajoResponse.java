package com.pe.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ProductoStockBajoResponse {

    private Long id;
    private String codigo;
    private String nombre;
    private Integer stockActual;
    private Integer stockMinimo;
    private Integer cantidadFaltante;
    private BigDecimal precioUnitario;
}
