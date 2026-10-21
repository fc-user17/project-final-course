package com.proyectofinal.administracionfinanzas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "presupuestos")
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private String periodo;

    private BigDecimal montoAsignado;

    private BigDecimal montoUtilizado;

    private Boolean aprobado;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public BigDecimal getMontoAsignado() {
        return montoAsignado;
    }

    public void setMontoAsignado(BigDecimal montoAsignado) {
        this.montoAsignado = montoAsignado;
    }

    public BigDecimal getMontoUtilizado() {
        return montoUtilizado;
    }

    public void setMontoUtilizado(BigDecimal montoUtilizado) {
        this.montoUtilizado = montoUtilizado;
    }

    public Boolean getAprobado() {
        return aprobado;
    }

    public void setAprobado(Boolean aprobado) {
        this.aprobado = aprobado;
    }
}
