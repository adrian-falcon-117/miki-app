import React, { useState } from "react";
import {
    Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
    Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Button, Stack, Grid
} from "@mui/material";
import axios from "axios";
import { useTheme, useMediaQuery } from "@mui/material";
import useSnackbar from "../utils/useSnackbar";

export default function VentasScreen() {
    const [ventas, setVentas] = useState([]);
    const [totales, setTotales] = useState({ general: 0, efectivo: 0, transferencia: 0 });
    const [month, setMonth] = useState("01");
    const [year, setYear] = useState("2026");
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const fetchVentas = async () => {
        try {
            const res = await axios.get("http://localhost:4000/reports/sales-by-month", {
                params: { month, year }
            });
            setVentas(res.data.rows);

            // calcular totales
            const general = res.data.rows.reduce((acc, v) => acc + v.amount, 0);
            const efectivo = res.data.rows.reduce((acc, v) => acc + v.cash, 0);
            const transferencia = res.data.rows.reduce((acc, v) => acc + v.transfer, 0);

            setTotales({ general, efectivo, transferencia });
        } catch (err) {
            console.error(err);
            showSnackbar("Error al cargar ventas", "error");
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>Ventas</Typography>

            {/* Filtros */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Mes</InputLabel>
                    <Select value={month} onChange={(e) => setMonth(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => {
                            const m = String(i + 1).padStart(2, "0");
                            return <MenuItem key={m} value={m}>{m}</MenuItem>;
                        })}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Año</InputLabel>
                    <Select value={year} onChange={(e) => setYear(e.target.value)}>
                        {["2024", "2025", "2026"].map(y => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button variant="contained" onClick={fetchVentas}>Buscar</Button>
            </Box>

            {/* Totales */}
            <Box sx={{ mb: 2 }}>
                <Paper sx={{ p: 2, backgroundColor: "#2e7d32", color: "white" }}>
                    <Typography variant="h6">Totales</Typography>
                    <Box sx={{ display: "flex", flexDirection: { xs: "row", sm: "row" }, gap: 2, mt: 1 }}>
                        <Box>
                            <Typography variant="subtitle2">Total General</Typography>
                            <Typography variant="h6">${totales.general.toFixed(2)}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Total Efectivo</Typography>
                            <Typography variant="h6">${totales.efectivo.toFixed(2)}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Total Transferencia</Typography>
                            <Typography variant="h6">${totales.transferencia.toFixed(2)}</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>


            {/* Tabla en desktop / tarjetas en mobile */}
            {!isMobile ? (
                <Paper>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell align="right">Monto</TableCell>
                                <TableCell align="right">Efectivo</TableCell>
                                <TableCell align="right">Transferencia</TableCell>
                                <TableCell>Fecha</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ventas.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell>{v.id}</TableCell>
                                    <TableCell>{v.description}</TableCell>
                                    <TableCell align="right">${v.amount.toFixed(2)}</TableCell>
                                    <TableCell align="right">${v.cash.toFixed(2)}</TableCell>
                                    <TableCell align="right">${v.transfer.toFixed(2)}</TableCell>
                                    <TableCell>{new Date(v.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {ventas.map((v) => (
                        <Paper key={v.id} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{v.description}</Typography>
                            <Typography>Monto: ${v.amount.toFixed(2)}</Typography>
                            <Typography>Efectivo: ${v.cash.toFixed(2)}</Typography>
                            <Typography>Transferencia: ${v.transfer.toFixed(2)}</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Fecha: {new Date(v.created_at).toLocaleString()}
                            </Typography>
                        </Paper>
                    ))}
                </Stack>
            )}

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
