package com.pe.service;

import com.pe.dto.ProductoStockBajoResponse;
import com.pe.model.Producto;
import com.pe.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> obtenerProductoPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto registrarProducto(Producto producto) {
        return productoRepository.save(producto);
    }

    public Optional<Producto> actualizarProducto(Long id, Producto productoActualizado) {

        return productoRepository.findById(id)
                .map(producto -> {

                    producto.setCodigo(productoActualizado.getCodigo());
                    producto.setNombre(productoActualizado.getNombre());
                    producto.setDescripcion(productoActualizado.getDescripcion());
                    producto.setUnidadMedida(productoActualizado.getUnidadMedida());
                    producto.setStockActual(productoActualizado.getStockActual());
                    producto.setStockMinimo(productoActualizado.getStockMinimo());
                    producto.setPrecioUnitario(productoActualizado.getPrecioUnitario());
                    producto.setEstado(productoActualizado.getEstado());

                    return productoRepository.save(producto);
                });
    }

    public boolean eliminarProducto(Long id) {

        if (!productoRepository.existsById(id)) {
            return false;
        }

        productoRepository.deleteById(id);
        return true;
    }

    public List<ProductoStockBajoResponse> obtenerProductosStockBajo() {
        return productoRepository.findProductosConStockBajo().stream()
                .map(this::convertirAAlertaStock)
                .toList();
    }

    private ProductoStockBajoResponse convertirAAlertaStock(Producto producto) {
        int cantidadFaltante = producto.getStockMinimo() - producto.getStockActual();

        return new ProductoStockBajoResponse(
                producto.getId(),
                producto.getCodigo(),
                producto.getNombre(),
                producto.getStockActual(),
                producto.getStockMinimo(),
                cantidadFaltante,
                producto.getPrecioUnitario());
    }
}