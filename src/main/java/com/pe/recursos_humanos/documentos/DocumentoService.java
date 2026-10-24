
package com.pe.recursos_humanos.documentos;

import com.pe.recursos_humanos.trabajadores.PersonalService;
import com.pe.recursos_humanos.trabajadores.Trabajador;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentoService {

    private final PersonalService personalService;
    private final DocumentoRepository documentoRepository;
    private final Path carpetaDocumentos;

    public DocumentoService(
            PersonalService personalService,
            DocumentoRepository documentoRepository,
            @Value("${documentos.directorio:uploads/documentos}")
            String directorioDocumentos) {

        this.personalService = personalService;
        this.documentoRepository = documentoRepository;

        this.carpetaDocumentos = Paths.get(directorioDocumentos)
                .toAbsolutePath()
                .normalize();
    }

    @Transactional
    public Documento registrar(
            String documentoIdentidadTrabajador,
            String tipo,
            LocalDate fechaVencimiento,
            MultipartFile archivo) {

        if (documentoIdentidadTrabajador == null
                || documentoIdentidadTrabajador.isBlank()) {
            throw new IllegalArgumentException(
                    "El documento de identidad del trabajador es obligatorio");
        }

        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException(
                    "El tipo de documento es obligatorio");
        }

        // La fecha de vencimiento es opcional.
        if (fechaVencimiento != null
                && fechaVencimiento.isBefore(LocalDate.of(1900, 1, 1))) {
            throw new IllegalArgumentException(
                    "La fecha de vencimiento no es válida");
        }

        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException(
                    "Debes seleccionar un archivo");
        }

        if (archivo.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "El archivo no puede superar los 10 MB");
        }

        String nombreOriginal = archivo.getOriginalFilename();

        if (nombreOriginal == null || nombreOriginal.isBlank()) {
            throw new IllegalArgumentException(
                    "El archivo seleccionado no tiene nombre");
        }

        // Obtener y validar la extensión.
        String nombreSeguro = Paths.get(nombreOriginal)
                .getFileName()
                .toString();

        int punto = nombreSeguro.lastIndexOf('.');

        if (punto < 0) {
            throw new IllegalArgumentException(
                    "El archivo debe tener una extensión válida");
        }

        String extension = nombreSeguro.substring(punto)
                .toLowerCase(Locale.ROOT);

        Set<String> extensionesPermitidas = Set.of(
                ".pdf", ".doc", ".docx",
                ".jpg", ".jpeg", ".png"
        );

        if (!extensionesPermitidas.contains(extension)) {
            throw new IllegalArgumentException(
                    "Solo se permiten archivos PDF, Word, JPG o PNG");
        }

        // Buscar al trabajador por su DNI.
        Trabajador trabajador = personalService.buscarPorDocumento(
                documentoIdentidadTrabajador.trim()
        ).orElseThrow(() -> new NoSuchElementException(
                "No existe un trabajador con documento "
                        + documentoIdentidadTrabajador.trim()));

        String nombreGuardado = UUID.randomUUID() + extension;

        Path destino = carpetaDocumentos.resolve(nombreGuardado)
                .normalize();

        if (!destino.startsWith(carpetaDocumentos)) {
            throw new IllegalArgumentException(
                    "Ruta de archivo no válida");
        }

        try {
            Files.createDirectories(carpetaDocumentos);

            Files.copy(
                    archivo.getInputStream(),
                    destino,
                    StandardCopyOption.REPLACE_EXISTING
            );

            Documento documento = new Documento();
            documento.setTrabajadorId(trabajador.getId());
            documento.setTipo(tipo.trim());
            documento.setFechaVencimiento(fechaVencimiento);
            documento.setNombreArchivo(nombreSeguro);
            documento.setRutaArchivo(destino.toString());

            return documentoRepository.save(documento);

        } catch (IOException e) {
            throw new IllegalStateException(
                    "No se pudo guardar el archivo del documento", e);
        }
    }

    // Listar todos los documentos.
    public List<Documento> listarTodos() {
        return documentoRepository.findAll();
    }

    // Listar documentos por ID del trabajador.
    public List<Documento> listarPorTrabajador(Long trabajadorId) {
        return documentoRepository.findByTrabajadorId(trabajadorId);
    }

    // Buscar documentos utilizando el DNI del trabajador.
    public List<Documento> listarPorDocumentoIdentidad(
            String documentoIdentidad) {

        if (documentoIdentidad == null
                || documentoIdentidad.isBlank()) {
            throw new IllegalArgumentException(
                    "Debes ingresar el DNI del trabajador");
        }

        Trabajador trabajador = personalService.buscarPorDocumento(
                documentoIdentidad.trim()
        ).orElseThrow(() -> new NoSuchElementException(
                "No existe un trabajador con ese documento"));

        return documentoRepository.findByTrabajadorId(
                trabajador.getId());
    }

    // Documentos que vencen entre hoy y los próximos días indicados.
    public List<Documento> listarProximosAVencer(int diasUmbral) {

        if (diasUmbral < 0) {
            throw new IllegalArgumentException(
                    "La cantidad de días no puede ser negativa");
        }

        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(diasUmbral);

        return documentoRepository.findAll().stream()
                .filter(d -> d.getFechaVencimiento() != null)
                .filter(d -> !d.getFechaVencimiento().isBefore(hoy))
                .filter(d -> !d.getFechaVencimiento().isAfter(limite))
                .toList();
    }

    // Documentos cuya fecha de vencimiento ya pasó.
    public List<Documento> listarVencidos() {

        LocalDate hoy = LocalDate.now();

        return documentoRepository.findAll().stream()
                .filter(d -> d.getFechaVencimiento() != null)
                .filter(d -> d.getFechaVencimiento().isBefore(hoy))
                .toList();
    }

    // Obtener la ruta del archivo para visualizarlo o descargarlo.
    public Path obtenerRutaArchivo(Long id) {

        Documento documento = documentoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "No existe el documento con ID " + id));

        if (documento.getRutaArchivo() == null
                || documento.getRutaArchivo().isBlank()) {
            throw new NoSuchElementException(
                    "Este registro no tiene un archivo asociado");
        }

        Path ruta = Paths.get(documento.getRutaArchivo())
                .toAbsolutePath()
                .normalize();

        if (!ruta.startsWith(carpetaDocumentos)
                || !Files.isRegularFile(ruta)) {
            throw new NoSuchElementException(
                    "No se encuentra el archivo del documento");
        }

        return ruta;
    }
}
