package com.pe.recursos_humanos.asistencia;

import java.time.LocalDateTime;

public record MarcarRequest(
        String documentoIdentidad,
        TipoMarcacion tipo,
        LocalDateTime fechaHora
) {
}
