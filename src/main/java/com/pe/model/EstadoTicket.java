package com.pe.model;

public enum EstadoTicket {
    ABIERTO("Abierto"),
    EN_PROCESO("En Proceso"),
    RESUELTO("Resuelto"),
    CERRADO("Cerrado"),
    CANCELADO("Cancelado");

    private final String descripcion;

    EstadoTicket(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
