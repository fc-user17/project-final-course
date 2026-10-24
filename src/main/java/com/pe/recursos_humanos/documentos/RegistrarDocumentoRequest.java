package com.pe.recursos_humanos.documentos;

import java.time.LocalDate;

public record RegistrarDocumentoRequest(String documentoIdentidad, String tipo, LocalDate fechaVencimiento) {
}
