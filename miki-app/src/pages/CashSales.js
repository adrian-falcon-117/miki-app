// src/pages/CashSales.js
import React, { useEffect, useState, useCallback } from "react";
import {
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useMediaQuery,
    useTheme,
    Snackbar,
    Alert
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon from "@mui/icons-material/Replay";
import useCashbox from "../utils/useCashbox";
import useSnackbar from "../utils/useSnackbar";
import axios from "axios";

/**
 * SaleCard: render reutilizable para una venta (tarjeta móvil)
 */
function SaleCard({ sale, onCancel, onReactivate, formatDate }) {
    return (
        <Card
            variant="outlined"
            sx={{
                bgcolor: sale.canceled ? "#ffebee" : "#fff",
                borderLeft: sale.canceled ? "6px solid #d32f2f" : "6px solid #1976d2"
            }}
        >
            <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {sale.description || "Venta sin descripción"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Fecha: {formatDate(sale.created_at || sale.createdAt || sale.date)}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mt: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography>Importe: ${((Number(sale.amount) || 0)).toFixed(2)}</Typography>
                    <Typography>Efectivo: ${((Number(sale.cash) || 0)).toFixed(2)}</Typography>
                    <Typography>Transfer: ${((Number(sale.transfer) || 0)).toFixed(2)}</Typography>
                    <Typography sx={{ color: sale.canceled ? "error.main" : "success.main", fontWeight: "bold" }}>
                        {sale.canceled ? "Cancelada" : "Activa"}
                    </Typography>
                </Box>
            </CardContent>
            <CardActions>
                {sale.canceled ? (
                    <IconButton color="primary" onClick={() => onReactivate(sale)} aria-label="Reactivar venta">
                        <ReplayIcon />
                    </IconButton>
                ) : (
                    <IconButton color="error" onClick={() => onCancel(sale)} aria-label="Cancelar venta">
                        <CancelIcon />
                    </IconButton>
                )}
            </CardActions>
        </Card>
    );
}

export default function CashSales() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saleToCancel, setSaleToCancel] = useState(null);
    const [sales, setSales] = useState([]); // fuente de verdad local
    const [loading, setLoading] = useState(true);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const { cashboxOpening, setCashboxOpening, isOpen } = useCashbox();
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    // formatea fecha
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hh}:${mm}`;
    };

    // recalcula acumuladores y guarda en cashboxOpening
    const recalcAndSaveTotals = useCallback((salesArray) => {
        const activeSales = (salesArray || []).filter(s => !s.canceled);
        const salesTotal = activeSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        const cashSalesTotal = activeSales.reduce((sum, s) => sum + (Number(s.cash) || 0), 0);
        const transferSalesTotal = activeSales.reduce((sum, s) => sum + (Number(s.transfer) || 0), 0);

        if (!cashboxOpening) return;
        const updated = {
            ...cashboxOpening,
            salesList: salesArray,
            salesTotal,
            cashSalesTotal,
            transferSalesTotal
        };
        setCashboxOpening(updated);
    }, [cashboxOpening, setCashboxOpening]);

    // agrupa ventas por fecha (día) a partir del estado local `sales`
    const groupedSales = sales.reduce((groups, sale) => {
        const dateOnly = new Date(sale.created_at || sale.createdAt || sale.date || Date.now());
        const day = String(dateOnly.getDate()).padStart(2, "0");
        const month = String(dateOnly.getMonth() + 1).padStart(2, "0");
        const year = dateOnly.getFullYear();
        const key = `${day}/${month}/${year}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(sale);
        return groups;
    }, {});

    // totales para mostrar en footer (desde `sales`)
    const totalsForCashbox = sales.reduce((acc, s) => {
        if (!s.canceled) {
            acc.cash += Number(s.cash) || 0;
            acc.transfer += Number(s.transfer) || 0;
            acc.amount += Number(s.amount) || 0;
            acc.count += 1;
        }
        return acc;
    }, { cash: 0, transfer: 0, amount: 0, count: 0 });

    // handlers
    const handleCancelClick = (sale) => {
        setSaleToCancel(sale);
        setConfirmOpen(true);
    };

    const confirmCancelSale = async () => {
        if (!saleToCancel || !cashboxOpening) {
            setConfirmOpen(false);
            setSaleToCancel(null);
            return;
        }

        const id = saleToCancel.id;

        try {
            const res = await axios.put(`http://localhost:4000/sales/${id}/cancel`);
            const updatedSale = res.data;

            const newSales = (sales || []).map(s =>
                s.id === id ? { ...s, ...updatedSale } : s
            );

            setSales(newSales); // 👈 ahora dentro del try
            recalcAndSaveTotals(newSales);

            showSnackbar("Venta cancelada", "success");
        } catch (err) {
            console.error("Error cancelando venta:", err.response?.data || err.message);
            showSnackbar("Error al cancelar venta", "error");
        } finally {
            setConfirmOpen(false);
            setSaleToCancel(null);
        }
    };

    const handleReactivateClick = async (sale) => {
        if (!sale || !cashboxOpening) return;
        const id = sale.id;

        try {
            // Llamada al backend para reactivar
            const res = await axios.put(`http://localhost:4000/sales/${id}/reactivate`);
            const updatedSale = res.data;

            // Actualizamos la lista local con la respuesta
            const newSales = (sales || []).map(s =>
                s.id === id ? { ...s, ...updatedSale } : s
            );

            setSales(newSales);
            recalcAndSaveTotals(newSales);

            showSnackbar("Venta reactivada", "success");
        } catch (err) {
            console.error("Error reactivando venta:", err.response?.data || err.message);
            showSnackbar("Error al reactivar venta", "error");
        }
    };

    // carga inicial: inicializamos `sales` desde cashboxOpening
    useEffect(() => {
        setLoading(false);

        if (!isOpen || !cashboxOpening) {
            if (!isOpen) showSnackbar("No hay caja abierta", "warning");
            setSales([]); // si no hay caja, dejamos vacío
        } else {
            const initialSales = Array.isArray(cashboxOpening.salesList)
                ? cashboxOpening.salesList
                : [];
            setSales(initialSales);
        }
    }, [cashboxOpening, isOpen]);

    // recalcular totales SOLO cuando cambie `sales`
    useEffect(() => {
        if (sales.length > 0 && cashboxOpening) {
            recalcAndSaveTotals(sales);
        }
    }, [sales]);


    // render
    if (!isOpen && !loading) {
        return (
            <>
                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="h6">No hay caja abierta</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Abrí la caja para ver las ventas de esa apertura.
                    </Typography>
                </Paper>
            </>
        );
    }

    return (
        <>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Ventas de la apertura de caja</Typography>
                {cashboxOpening ? (
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1, flexWrap: "wrap" }}>
                        <Typography>Abierta: {formatDate(cashboxOpening.opened_at)}</Typography>
                        <Typography>Inicial: ${Number(cashboxOpening.opening || 0).toFixed(2)}</Typography>
                        <Typography sx={{ ml: "auto", color: "text.secondary" }}>Ventas mostradas: {sales.length}</Typography>
                        <Typography sx={{ ml: "auto", color: "text.secondary" }}>Ventas activas: {totalsForCashbox.count}</Typography>
                    </Box>
                ) : null}
            </Box>

            {isMobile ? (
                <Grid container spacing={2}>
                    {Object.keys(groupedSales).length === 0 && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography>No hay ventas en esta apertura</Typography>
                            </Paper>
                        </Grid>
                    )}

                    {Object.keys(groupedSales).map(date => {
                        const daySales = groupedSales[date];
                        return (
                            <Grid item xs={12} key={date}>
                                <Typography variant="h6" sx={{ mb: 1 }}>{`Ventas del ${date}`}</Typography>
                                <Grid container spacing={1}>
                                    {daySales.map(sale => (
                                        <Grid item xs={12} key={sale.id}>
                                            <SaleCard
                                                sale={sale}
                                                onCancel={handleCancelClick}
                                                onReactivate={handleReactivateClick}
                                                formatDate={formatDate}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <>
                    {Object.keys(groupedSales).length === 0 ? (
                        <Paper sx={{ p: 2, textAlign: "center" }}>
                            <Typography>No hay ventas en esta apertura</Typography>
                        </Paper>
                    ) : (
                        Object.keys(groupedSales).map(date => {
                            const daySales = groupedSales[date];
                            return (
                                <TableContainer component={Paper} sx={{ marginTop: 2 }} key={date}>
                                    <Typography variant="h6" sx={{ p: 2 }}>
                                        Ventas del {date}
                                    </Typography>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Descripción</TableCell>
                                                <TableCell>Monto</TableCell>
                                                <TableCell>Efectivo</TableCell>
                                                <TableCell>Transferencia</TableCell>
                                                <TableCell>Estado</TableCell>
                                                <TableCell>Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {daySales.map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell>{sale.description}</TableCell>
                                                    <TableCell>${(Number(sale.amount) || 0).toFixed(2)}</TableCell>
                                                    <TableCell>${(Number(sale.cash) || 0).toFixed(2)}</TableCell>
                                                    <TableCell>${(Number(sale.transfer) || 0).toFixed(2)}</TableCell>
                                                    <TableCell>{sale.canceled ? "Cancelada" : "Activa"}</TableCell>
                                                    <TableCell>
                                                        {sale.canceled ? (
                                                            <IconButton color="primary" onClick={() => handleReactivateClick(sale)}>
                                                                <ReplayIcon />
                                                            </IconButton>
                                                        ) : (
                                                            <IconButton color="error" onClick={() => handleCancelClick(sale)}>
                                                                <CancelIcon />
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            );
                        })
                    )}
                </>
            )}

            <Paper elevation={6} sx={{ p: 2, display: "flex", gap: 3, alignItems: "center", bgcolor: "#2e7d32", color: "#fff", mt: 2 }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ color: "#fff" }}>Totales (apertura)</Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        ${totalsForCashbox.amount.toFixed(2)}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="body2" sx={{ color: "#fff" }}>Efectivo</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>${totalsForCashbox.cash.toFixed(2)}</Typography>
                </Box>

                <Box>
                    <Typography variant="body2" sx={{ color: "#fff" }}>Transferencia</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>${totalsForCashbox.transfer.toFixed(2)}</Typography>
                </Box>


            </Paper>

            <Snackbar open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirmar cancelación</DialogTitle>
                <DialogContent>
                    <Typography>¿Seguro que deseas cancelar esta venta?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>No</Button>
                    <Button color="error" onClick={confirmCancelSale}>Sí, cancelar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
