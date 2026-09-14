package com.pe.service;

import com.pe.dto.MovimientoInventarioRequest;
import com.pe.model.MovimientoInventario;
import com.pe.model.Producto;
import com.pe.model.TipoMovimiento;
import com.pe.repository.MovimientoInventarioRepository;
import com.pe.repository.ProductoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MovimientoInventarioService {

    private final MovimientoInventarioRepository movimientoRepository;
    private final ProductoRepository productoRepository;

    public MovimientoInventarioService(
            MovimientoInventarioRepository movimientoRepository,
            ProductoRepository productoRepository) {
        this.movimientoRepository = movimientoRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional
    public MovimientoInventario registrarMovimiento(MovimientoInventarioRequest request) {
        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (!Boolean.TRUE.equals(producto.getEstado())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "No se pueden registrar movimientos para un producto inactivo");
        }

        int stockAnterior = producto.getStockActual();
        int variacion = request.getTipoMovimiento() == TipoMovimiento.ENTRADA
                ? request.getCantidad()
                : -request.getCantidad();
        int stockResultante = stockAnterior + variacion;

        if (stockResultante < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Stock insuficiente para registrar la salida");
        }

        producto.setStockActual(stockResultante);
        productoRepository.save(producto);

        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setProducto(producto);
        movimiento.setTipoMovimiento(request.getTipoMovimiento());
        movimiento.setCantidad(request.getCantidad());
        movimiento.setMotivo(request.getMotivo());
        movimiento.setFechaMovimiento(LocalDateTime.now());
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockResultante(stockResultante);

        return movimientoRepository.save(movimiento);
    }

    @Transactional(readOnly = true)
    public List<MovimientoInventario> listarMovimientos() {
        return movimientoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<MovimientoInventario> listarMovimientosPorProducto(Long productoId) {
        if (!productoRepository.existsById(productoId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Producto no encontrado");
        }

        return movimientoRepository.findByProductoIdOrderByFechaMovimientoDesc(productoId);
    }
}
