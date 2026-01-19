// BuyScreenComplete.jsx
import React, { useEffect, useState } from "react";
import {
    Box, Typography, Paper, TextField, Button, FormControl, InputLabel, Select, MenuItem,
    Snackbar, Alert, Table, TableHead, TableRow, TableCell, TableBody,
    Tabs, Tab, IconButton, useMediaQuery, useTheme,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Grid
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { Divider } from "@mui/material";
import useSnackbar from "../utils/useSnackbar";


function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ mt: 2 }}>{children}</Box> : null;
}

function getYears(range = 6) {
    const current = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < range; i++) years.push(current - i);
    return years;
}

export default function BuyScreenComplete() {
    const [tab, setTab] = useState(0); // 0 = Comprar, 1 = Historial
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [form, setForm] = useState({
        product_id: "",
        supplier_id: "",
        quantity: "",
        unit_cost: "",
        unitType: "unit",
        id: null
    });

    // Filtro mes/año
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");

    // Dialogo de confirmación
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
        fetchPurchases();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get("http://localhost:4000/products");
            setProducts(res.data);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await axios.get("http://localhost:4000/suppliers");
            setSuppliers(res.data);
        } catch (err) {
            console.error("Error fetching suppliers:", err);
        }
    };

    const fetchPurchases = async (month = "", year = "") => {
        try {
            const params = {};
            if (month) params.month = String(month).padStart(2, "0");
            if (year) params.year = String(year);
            const res = await axios.get("http://localhost:4000/purchases", { params });
            setPurchases(res.data);
        } catch (err) {
            console.error("Error fetching purchases:", err);
        }
    };

    const resetForm = () => {
        setForm({ product_id: "", supplier_id: "", quantity: "", unit_cost: "", unitType: "unit", id: null });
    };

    const handleSubmit = async () => {
        if (!form.product_id || !form.supplier_id || !form.quantity || !form.unit_cost) {
            showSnackbar("Completa todos los campos", "warning");
            return;
        }

        const payload = {
            product_id: form.product_id,
            supplier_id: form.supplier_id,
            quantity: parseFloat(form.quantity),
            unit_cost: parseFloat(form.unit_cost),
            unitType: form.unitType,
            cash: parseFloat(form.cash) || 0,
            transfer: parseFloat(form.transfer) || 0
        };

        try {
            // 1️⃣ Guardar compra
            if (form.id) {
                await axios.put(`http://localhost:4000/purchases/${form.id}`, payload);
                showSnackbar("Compra actualizada", "success");
            } else {
                await axios.post("http://localhost:4000/purchases", payload);
                showSnackbar("Compra registrada", "success");
            }

            // 2️⃣ Obtener producto para calcular salePrice
            const productRes = await axios.get(`http://localhost:4000/products/${form.product_id}`);
            const product = productRes.data;

            let salePrice = parseFloat(form.unit_cost);
            if (product.incrementType === "percentage") {
                salePrice = parseFloat(form.unit_cost) * (1 + (parseFloat(product.incrementValue) || 0) / 100);
            } else if (product.incrementType === "peso" || product.incrementType === "fixed") {
                salePrice = parseFloat(form.unit_cost) + (parseFloat(product.incrementValue) || 0);
            }

            // 3️⃣ Actualizar producto con PATCH (solo salePrice y unitType)
            await axios.patch(`http://localhost:4000/products/${form.product_id}/sale`, {
                salePrice: Number(salePrice.toFixed(2)),
                unitType: form.unitType
            });

            fetchPurchases(filterMonth, filterYear);
            fetchProducts();
            resetForm();
            setTab(1);
        } catch (err) {
            console.error("Error saving purchase:", err.response?.data || err.message);
            showSnackbar("Error al guardar compra", "error");
        }
    };


    const handleEdit = (pu) => {
        setForm({
            product_id: pu.product_id,
            supplier_id: pu.supplier_id,
            quantity: String(pu.quantity),
            unit_cost: String(pu.unit_cost),
            unitType: pu.unitType || "unit",
            id: pu.id
        });
        setTab(0);
    };

    const handleDeleteClick = (pu) => {
        setSelectedPurchase(pu);
        setOpenDialog(true);
    };

    const confirmDelete = async () => {
        if (!selectedPurchase) return;
        try {
            await axios.delete(`http://localhost:4000/purchases/${selectedPurchase.id}`);
            showSnackbar("Compra eliminada", "success" );
            fetchPurchases(filterMonth, filterYear);
            fetchProducts();
        } catch (err) {
            console.error("Error deleting purchase:", err);
            showSnackbar("Error al eliminar compra", "error");
        } finally {
            setOpenDialog(false);
            setSelectedPurchase(null);
        }
    };

    const cancelDelete = () => {
        setOpenDialog(false);
        setSelectedPurchase(null);
    };

    const applyFilter = () => {
        fetchPurchases(filterMonth, filterYear);
        setTab(1);
    };

    const clearFilter = () => {
        setFilterMonth("");
        setFilterYear("");
        fetchPurchases();
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>Compras</Typography>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="tabs compras">
                <Tab label="Comprar" />
                <Tab label="Historial" />
            </Tabs>

            {/* PESTAÑA 0: FORMULARIO DE COMPRA */}
            <TabPanel value={tab} index={0}>
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* Producto */}
                        <FormControl fullWidth>
                            <InputLabel>Producto</InputLabel>
                            <Select
                                value={form.product_id}
                                label="Producto"
                                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                            >
                                <MenuItem value=""><em>Seleccionar</em></MenuItem>
                                {products.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.name} — {p.description || ""}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>


                        {/* Proveedor */}
                        <FormControl fullWidth>
                            <InputLabel>Proveedor</InputLabel>
                            <Select
                                value={form.supplier_id}
                                label="Proveedor"
                                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                            >
                                <MenuItem value=""><em>Seleccionar</em></MenuItem>
                                {suppliers.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Cantidad + Unidad en fila */}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                label="Cantidad"
                                type="number"
                                fullWidth
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            />
                            <FormControl sx={{ minWidth: 140 }}>
                                <InputLabel>Unidad</InputLabel>
                                <Select
                                    value={form.unitType}
                                    label="Unidad"
                                    onChange={(e) => setForm({ ...form, unitType: e.target.value })}
                                >
                                    <MenuItem value="unit">Unidad</MenuItem>
                                    <MenuItem value="kg">Kilos</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Precio Unitario */}
                        <TextField
                            label="Precio Unitario"
                            type="number"
                            fullWidth
                            value={form.unit_cost}
                            onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                        />
                        <Divider sx={{ my: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Formas de pago
                            </Typography>
                        </Divider>
                        {/* Forma de pago */}
                        <Box sx={{ display: "flex", gap: 2 }}>

                            <TextField
                                label="Monto en efectivo"
                                type="number"
                                fullWidth
                                value={form.cash || ""}
                                onChange={(e) => setForm({ ...form, cash: e.target.value })}
                            />
                            <TextField
                                label="Monto en transferencia"
                                type="number"
                                fullWidth
                                value={form.transfer || ""}
                                onChange={(e) => setForm({ ...form, transfer: e.target.value })}
                            />
                        </Box>


                        {/* Botones en fila */}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button variant="contained" onClick={handleSubmit}>
                                {form.id ? "Actualizar Compra" : "Guardar Compra"}
                            </Button>
                            <Button variant="outlined" onClick={resetForm}>Limpiar</Button>
                        </Box>
                    </Box>
                </Paper>
            </TabPanel>

            {/* PESTAÑA 1: HISTORIAL */}
            <TabPanel value={tab} index={1}>
                <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                    <FormControl sx={{ minWidth: 140 }}>
                        <InputLabel>Mes</InputLabel>
                        <Select
                            value={filterMonth}
                            label="Mes"
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <MenuItem value=""><em>Todos</em></MenuItem>
                            <MenuItem value="01">Enero</MenuItem>
                            <MenuItem value="02">Febrero</MenuItem>
                            <MenuItem value="03">Marzo</MenuItem>
                            <MenuItem value="04">Abril</MenuItem>
                            <MenuItem value="05">Mayo</MenuItem>
                            <MenuItem value="06">Junio</MenuItem>
                            <MenuItem value="07">Julio</MenuItem>
                            <MenuItem value="08">Agosto</MenuItem>
                            <MenuItem value="09">Septiembre</MenuItem>
                            <MenuItem value="10">Octubre</MenuItem>
                            <MenuItem value="11">Noviembre</MenuItem>
                            <MenuItem value="12">Diciembre</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 140 }}>
                        <InputLabel>Año</InputLabel>
                        <Select
                            value={filterYear}
                            label="Año"
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <MenuItem value=""><em>Todos</em></MenuItem>
                            {getYears(6).map((y) => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <Button variant="contained" onClick={applyFilter}>Buscar</Button>
                        <Button variant="outlined" onClick={clearFilter}>Limpiar</Button>
                    </Box>
                </Box>

                {!isMobile ? (
                    <Paper>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Proveedor</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Unidad</TableCell>
                                    <TableCell>Precio Unitario</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Efectivo</TableCell>
                                    <TableCell>Transferencia</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {purchases.map((pu) => (
                                    <TableRow key={pu.id}>
                                        <TableCell>{pu.product_name}</TableCell>
                                        <TableCell>{pu.supplier_name}</TableCell>
                                        <TableCell>{pu.quantity}</TableCell>
                                        <TableCell>{pu.unitType || "unit"}</TableCell>
                                        <TableCell>${(pu.unit_cost || 0).toFixed(2)}</TableCell>
                                        <TableCell>${(pu.total || 0).toFixed(2)}</TableCell>
                                        <TableCell>${(pu.cash || 0).toFixed(2)}</TableCell>
                                        <TableCell>${(pu.transfer || 0).toFixed(2)}</TableCell>
                                        <TableCell>{new Date(pu.created_at).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleEdit(pu)}><EditIcon /></IconButton>
                                            <IconButton color="error" onClick={() => handleDeleteClick(pu)}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {purchases.map((pu) => (
                            <Paper key={pu.id} sx={{ p: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{pu.product_name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{pu.supplier_name}</Typography>
                                        <Typography sx={{ mt: 1 }}>
                                            <strong>Cantidad:</strong> {pu.quantity} {pu.unitType || "unit"}
                                        </Typography>
                                        <Typography>
                                            <strong>Precio unitario:</strong> ${(pu.unit_cost || 0).toFixed(2)}
                                        </Typography>
                                        <Typography>
                                            <strong>Total:</strong> ${(pu.total || 0).toFixed(2)}
                                        </Typography>
                                        <Typography>
                                            <strong>Efectivo:</strong> ${(pu.cash || 0).toFixed(2)}
                                        </Typography>
                                        <Typography>
                                            <strong>Transferencia:</strong> ${(pu.transfer || 0).toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(pu.created_at).toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                        <IconButton color="primary" onClick={() => handleEdit(pu)}><EditIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteClick(pu)}><DeleteIcon /></IconButton>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
            </TabPanel>

            {/* Dialogo de confirmación para eliminar */}
            <Dialog open={openDialog} onClose={cancelDelete}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que querés eliminar esta compra? Esto ajustará el stock automáticamente.
                    </DialogContentText>
                    {selectedPurchase && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2">{selectedPurchase.product_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Proveedor: {selectedPurchase.supplier_name}
                            </Typography>
                            <Typography sx={{ mt: 1 }}>
                                Cantidad: {selectedPurchase.quantity} {selectedPurchase.unitType || "unit"}
                            </Typography>
                            <Typography>
                                Total: ${(selectedPurchase.total || 0).toFixed(2)}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>
        </Box>
    );
}