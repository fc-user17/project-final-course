package com.pe.model;

public enum CategoriaTicket {
    HARDWARE("Hardware y Equipos"),
    SOFTWARE("Software y Aplicaciones"),
    REDES_CONECTIVIDAD("Redes y Conectividad"),
    ACCESOS_SEGURIDAD("Accesos y Permisos"),
    CORREO_COMUNICACIONES("Correo y Comunicaciones"),
    OTRO("Otro Requerimiento TI");

    private final String descripcion;

    CategoriaTicket(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
