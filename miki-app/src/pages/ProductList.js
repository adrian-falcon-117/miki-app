import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Grid,
    Card,
    CardContent,
    CardActions,
    CardMedia,
    Typography,
    IconButton,
    TextField,
    Select,
    MenuItem,
    Button,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Box,
    CircularProgress,
    Tooltip,
    Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { validateProduct } from "../utils/validators";
import useSnackbar from "../utils/useSnackbar";

// Debounce helper
function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function ProductList() {
    // Datos y paginación cliente
    const [products, setProducts] = useState([]); // todos los productos
    const [visibleProducts, setVisibleProducts] = useState([]); // productos mostrados
    const [page, setPage] = useState(0);
    const pageSize = 12;

    // UI y edición
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Snackbar
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    // Delete confirm
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Scanner
    const [scannerOpen, setScannerOpen] = useState(false);
    const scannerRef = useRef(null);

    // Lazy load sentinel
    const sentinelRef = useRef(null);

    // Filtros y búsqueda
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 350);
    const [unitFilter, setUnitFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name"); // name | price | stock

    useEffect(() => {
        fetchProducts();
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
                scannerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset visibleProducts cuando cambian productos o filtros
    useEffect(() => {
        applyFiltersAndReset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, debouncedQuery, unitFilter, sortBy]);

    // IntersectionObserver para lazy load
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadMore();
                    }
                });
            },
            { root: null, rootMargin: "200px", threshold: 0.1 }
        );

        const node = sentinelRef.current;
        if (node) observer.observe(node);

        return () => {
            if (node) observer.unobserve(node);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleProducts, products, page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:4000/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
            showSnackbar("Error al cargar productos", "error");
        } finally {
            setLoading(false);
        }
    };

    const refreshProducts = async () => {
        setRefreshing(true);
        await fetchProducts();
        setRefreshing(false);
    };

    const calculateSalePrice = (purchase, type, value) => {
        const p = parseFloat(purchase) || 0;
        const v = parseFloat(value) || 0;
        if (type === "percentage") return (p + (p * v) / 100).toFixed(2);
        return (p + v).toFixed(2);
    };

    const startEdit = (product) => {
        setEditingId(product.id);
        setFormData({
            id: product.id,
            barcode: product.barcode ?? "",
            name: product.name ?? "",
            purchasePrice: product.purchasePrice ?? "",
            incrementType: product.incrementType ?? "percentage",
            incrementValue: product.incrementValue ?? "",
            salePrice: product.salePrice ?? "",
            stock: product.stock ?? "",
            description: product.description ?? "",
            unitType: product.unitType ?? "unit",
            image: product.image ?? ""
        });
        // Scroll card into view for better UX on mobile
        setTimeout(() => {
            const el = document.getElementById(`product-card-${product.id}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({});
    };

    const validateAndSave = async () => {
        const error = validateProduct(formData);
        if (error) {
            showSnackbar(error, "error");
            return;
        }

        const recalculated = calculateSalePrice(formData.purchasePrice, formData.incrementType, formData.incrementValue);
        const payload = {
            barcode: formData.barcode,
            name: formData.name,
            purchasePrice: parseFloat(formData.purchasePrice),
            incrementType: formData.incrementType,
            incrementValue: parseFloat(formData.incrementValue),
            salePrice: parseFloat(recalculated),
            stock: parseFloat(formData.stock),
            description: formData.description,
            unitType: formData.unitType,
            image: formData.image
        };

        try {
            // Mantener la función original: actualiza backend y luego el estado
            await axios.put(`http://localhost:4000/products/${editingId}`, payload);
            setProducts(prev => prev.map(p => p.id === editingId ? { id: editingId, ...payload } : p));
            setVisibleProducts(prev => prev.map(p => p.id === editingId ? { id: editingId, ...payload } : p));
            showSnackbar("Producto actualizado", "success");
            cancelEdit();
        } catch (err) {
            console.error(err);
            showSnackbar("Error al actualizar producto", "error");
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:4000/products/${deleteId}`);
            setProducts(prev => prev.filter(p => p.id !== deleteId));
            setVisibleProducts(prev => prev.filter(p => p.id !== deleteId));
            showSnackbar("Producto eliminado", "success");
        } catch (err) {
            console.error(err);
            showSnackbar("Error al eliminar producto", "error");
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const openScanner = () => {
        setScannerOpen(true);
        setTimeout(() => {
            try {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                    scannerRef.current = null;
                }
                const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
                scanner.render(
                    (decodedText) => {
                        setFormData(prev => {
                            const updated = { ...prev, barcode: decodedText };
                            updated.salePrice = calculateSalePrice(updated.purchasePrice, updated.incrementType, updated.incrementValue);
                            return updated;
                        });
                        scanner.clear().catch(() => { });
                        scannerRef.current = null;
                        setScannerOpen(false);
                    },
                    () => { }
                );
                scannerRef.current = scanner;
            } catch (err) {
                console.error("Error iniciando escáner:", err);
                showSnackbar("No se pudo iniciar el escáner", "error");
                setScannerOpen(false);
            }
        }, 300);
    };

    const closeScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => { });
            scannerRef.current = null;
        }
        setScannerOpen(false);
    };

    // Filtrado, búsqueda y ordenamiento (no modifica funciones existentes)
    const applyFiltersAndReset = () => {
        let list = [...products];

        // Búsqueda por nombre o descripción o barcode
        if (debouncedQuery && debouncedQuery.trim() !== "") {
            const q = debouncedQuery.trim().toLowerCase();
            list = list.filter(p =>
                (p.name || "").toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q) ||
                (p.barcode || "").toLowerCase().includes(q)
            );
        }

        // Filtro por tipo de unidad
        if (unitFilter !== "all") {
            list = list.filter(p => p.unitType === unitFilter);
        }

        // Ordenamiento
        if (sortBy === "name") {
            list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        } else if (sortBy === "price") {
            list.sort((a, b) => (Number(a.salePrice) || 0) - (Number(b.salePrice) || 0));
        } else if (sortBy === "stock") {
            list.sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0));
        }

        setPage(0);
        setVisibleProducts(list.slice(0, pageSize));
    };

    // Cargar más (cliente-side)
    const loadMore = useCallback(() => {
        const nextPage = page + 1;
        const start = nextPage * pageSize;
        // Recompute filtered list to ensure consistent paging with filters
        let list = [...products];
        if (debouncedQuery && debouncedQuery.trim() !== "") {
            const q = debouncedQuery.trim().toLowerCase();
            list = list.filter(p =>
                (p.name || "").toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q) ||
                (p.barcode || "").toLowerCase().includes(q)
            );
        }
        if (unitFilter !== "all") {
            list = list.filter(p => p.unitType === unitFilter);
        }
        if (sortBy === "name") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        else if (sortBy === "price") list.sort((a, b) => (Number(a.salePrice) || 0) - (Number(b.salePrice) || 0));
        else if (sortBy === "stock") list.sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0));

        if (start >= list.length) return;
        const nextSlice = list.slice(start, start + pageSize);
        setVisibleProducts(prev => [...prev, ...nextSlice]);
        setPage(nextPage);
    }, [page, products, debouncedQuery, unitFilter, sortBy]);

    const handleLoadMoreClick = () => loadMore();

    // Helpers UI
    const highlight = (text = "") => {
        if (!debouncedQuery) return text;
        const q = debouncedQuery.trim();
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.substring(0, idx)}
                <strong style={{ backgroundColor: "yellow" }}>{text.substring(idx, idx + q.length)}</strong>
                {text.substring(idx + q.length)}
            </>
        );
    };

    return (
        <>
            {/* Controles superiores */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
                <Select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} size="small">
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="unit">Por unidad</MenuItem>
                    <MenuItem value="kg">Por kilo</MenuItem>
                </Select>

                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} size="small">
                    <MenuItem value="name">Ordenar por nombre</MenuItem>
                    <MenuItem value="price">Ordenar por precio</MenuItem>
                    <MenuItem value="stock">Ordenar por stock</MenuItem>
                </Select>

                <Tooltip title="Refrescar lista">
                    <span>
                        <IconButton onClick={refreshProducts} disabled={refreshing} color="primary">
                            {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* Estado de carga */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                    <CircularProgress />
                </Box>
            ) : visibleProducts.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="h6">No se encontraron productos</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Intenta cambiar filtros o presiona refrescar.
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        {visibleProducts.map(product => (
                            <Grid item xs={12} sm={6} md={4} key={product.id}>
                                <Card id={`product-card-${product.id}`} sx={{ height: "100%", display: "flex", flexDirection: "column", transition: "transform 0.12s ease" }}>

                                    <CardContent sx={{ flexGrow: 1, p: 2, borderLeft: "6px solid #1976d2", }}>
                                        {editingId === product.id ? (
                                            <>
                                                <TextField
                                                    label="Código de barras"
                                                    fullWidth
                                                    value={formData.barcode ?? ""}
                                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mb: 1 }}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={openScanner} size="small" aria-label="Abrir escáner">
                                                                    <CameraAltIcon />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />

                                                <TextField
                                                    label="Nombre"
                                                    fullWidth
                                                    value={formData.name ?? ""}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mb: 1 }}
                                                />

                                                <TextField
                                                    label="Descripción"
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={formData.description ?? ""}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mb: 1 }}
                                                />
                                                <TextField
                                                    label="Precio compra"
                                                    type="number"
                                                    fullWidth
                                                    value={formData.purchasePrice ?? ""}
                                                    onChange={(e) => {
                                                        const newPurchase = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            purchasePrice: newPurchase,
                                                            salePrice: calculateSalePrice(newPurchase, prev.incrementType, prev.incrementValue)
                                                        }));
                                                    }}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mb: 1 }}
                                                />
                                                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                                                    <TextField
                                                        label="Valor incremento"
                                                        type="number"
                                                        value={formData.incrementValue ?? ""}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                incrementValue: newValue,
                                                                salePrice: calculateSalePrice(prev.purchasePrice, prev.incrementType, newValue)
                                                            }));
                                                        }}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ flex: 1 }}
                                                    />
                                                    <Select
                                                        value={formData.incrementType ?? "percentage"}
                                                        onChange={(e) => {
                                                            const newType = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                incrementType: newType,
                                                                salePrice: calculateSalePrice(prev.purchasePrice, newType, prev.incrementValue)
                                                            }));
                                                        }}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ minWidth: 140 }}
                                                    >
                                                        <MenuItem value="percentage">Porcentaje(%)</MenuItem>
                                                        <MenuItem value="peso">Pesos($)</MenuItem>
                                                    </Select>
                                                </Box>
                                                <TextField
                                                    label="Precio venta"
                                                    type="number"
                                                    value={formData.salePrice ?? ""}
                                                    InputProps={{ readOnly: true }}
                                                    variant="outlined"
                                                    size="small"
                                                    fullWidth
                                                    sx={{ mb: 1 }}
                                                />

                                                <Box sx={{ display: "flex", gap: 1 }}>
                                                    <TextField
                                                        label="Stock"
                                                        type="number"
                                                        value={formData.stock ?? ""}
                                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ flex: 1 }}
                                                    />

                                                    <Select
                                                        value={formData.unitType ?? "unit"}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, unitType: e.target.value }))}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ minWidth: 140 }}
                                                    >
                                                        <MenuItem value="unit">Por unidad</MenuItem>
                                                        <MenuItem value="kg">Por kilo</MenuItem>
                                                    </Select>
                                                </Box>
                                            </>
                                        ) : (
                                            <>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    {product.barcode || "—"}
                                                </Typography>
                                                <Typography variant="h6" sx={{ mt: 0.5 }}>
                                                    {highlight(product.name || "")}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
                                                    {highlight(product.description || "")}
                                                </Typography>

                                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                    ${Number(product.salePrice || 0).toFixed(2)}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color={product.stock === 0 ? "error" : "text.secondary"}
                                                    sx={{ display: "block", mt: 1 }}
                                                >
                                                    Stock: {product.stock ?? 0} {product.unitType === "kg" ? "Kg" : "Unidad/es"}
                                                </Typography>


                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                                    Incremento: {product.incrementType === "percentage" ? `${product.incrementValue}%` : `$${product.incrementValue}`}
                                                </Typography>
                                            </>
                                        )}
                                    </CardContent>

                                    <CardActions>
                                        {editingId === product.id ? (
                                            <>
                                                <Tooltip title="Guardar cambios">
                                                    <IconButton color="success" onClick={validateAndSave} size="small" aria-label="Guardar">
                                                        <SaveIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Cancelar edición">
                                                    <IconButton color="error" onClick={cancelEdit} size="small" aria-label="Cancelar">
                                                        <CancelIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <>
                                                <Tooltip title="Editar producto">
                                                    <IconButton color="primary" onClick={() => startEdit(product)} size="small" aria-label="Editar">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar producto">
                                                    <IconButton color="error" onClick={() => confirmDelete(product.id)} size="small" aria-label="Eliminar">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Sentinel para IntersectionObserver */}
                    <div ref={sentinelRef} style={{ height: 1 }} />

                    {/* Botón de respaldo para cargar más */}
                    {visibleProducts.length < products.length && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <Button variant="outlined" onClick={handleLoadMoreClick}>Cargar más</Button>
                        </Box>
                    )}
                </>
            )}

            <Snackbar open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>

            {/* Confirm delete dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>¿Estás seguro de que deseas eliminar este producto?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="primary">Cancelar</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* Scanner dialog */}
            <Dialog open={scannerOpen} onClose={closeScanner} fullWidth maxWidth="sm">
                <DialogTitle>Escanear código de barras</DialogTitle>
                <DialogContent>
                    <div id="reader" style={{ width: "100%" }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeScanner} color="primary">Cerrar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
