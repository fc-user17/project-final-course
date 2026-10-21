package com.pe.recursos_humanos.trabajadores;

public class Trabajador {

    private Long id;
    private String nombres;
    private String documentoIdentidad;
    private String cargo;
    private String area;
    private String estado;

    public Trabajador() {
    }

    public Trabajador(Long id, String nombres, String documentoIdentidad,
                      String cargo, String area, String estado) {
        this.id = id;
        this.nombres = nombres;
        this.documentoIdentidad = documentoIdentidad;
        this.cargo = cargo;
        this.area = area;
        this.estado = estado;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getDocumentoIdentidad() {
        return documentoIdentidad;
    }

    public void setDocumentoIdentidad(String documentoIdentidad) {
        this.documentoIdentidad = documentoIdentidad;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
