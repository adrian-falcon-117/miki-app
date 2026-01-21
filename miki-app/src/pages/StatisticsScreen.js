import React, { useEffect, useState } from "react";
import {
    Box, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel,
    Snackbar, Alert, useTheme, useMediaQuery
} from "@mui/material";
import {
    CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import axios from "axios";
import useSnackbar from "../utils/useSnackbar";


export default function StatisticsScreen() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [paymentData, setPaymentData] = useState([]);
    const COLORS = ["#4caf50", "#ff9800"]; // verde = efectivo, naranja = transferencia

    const [year, setYear] = useState(new Date().getFullYear());
    const [combinedData, setCombinedData] = useState([]);
    const [summary, setSummary] = useState({});
    const [topProducts, setTopProducts] = useState([]);
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        fetchData();
    }, [year]);

    const fetchData = async () => {
        try {
            const salesRes = await axios.get("http://localhost:4000/reports/sales", { params: { year } });
            const purchasesRes = await axios.get("http://localhost:4000/reports/purchases", { params: { year } });
            const summaryRes = await axios.get("http://localhost:4000/reports/margin-summary", { params: { year } });
            const topRes = await axios.get("http://localhost:4000/reports/top-products", { params: { year } });
            const paymentRes = await axios.get("http://localhost:4000/reports/payment-methods", { params: { year } });

            setPaymentData([
                { name: "Efectivo", value: paymentRes.data.total_cash },
                { name: "Transferencia", value: paymentRes.data.total_transfer }
            ]);

            setSummary(summaryRes.data);
            setTopProducts(topRes.data);

            const salesData = salesRes.data;
            const purchasesData = purchasesRes.data;

            const combined = Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, "0");
                const saleRow = salesData.find(r => r.month === month);
                const purchaseRow = purchasesData.find(r => r.month === month);

                return {
                    month,
                    total_sales: saleRow ? saleRow.total_sales : 0,
                    total_purchases: purchaseRow ? purchaseRow.total_purchases : 0
                };
            });

            setCombinedData(combined);
        } catch (err) {
            console.error(err);
            showSnackbar("Error al cargar estadísticas", "error" );
        }
    };

    return (
        <Box sx={{ p: 2, backgroundColor: "#e3f2fd", borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>Estadísticas</Typography>

            {/* Filtro por año */}
            <FormControl sx={{ minWidth: 120, mb: 2 }}>
                <InputLabel>Año</InputLabel>
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                    {[2022, 2023, 2024, 2025, 2026].map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* KPIs */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Ventas</Typography>
                        <Typography variant="h6">${summary.total_sales?.toFixed(2) || 0}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Compras</Typography>
                        <Typography variant="h6">${summary.total_purchases?.toFixed(2) || 0}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Margen</Typography>
                        <Typography variant="h6" sx={{ color: summary.gross_margin >= 0 ? "green" : "red" }}>
                            ${(summary.gross_margin || 0).toFixed(2)}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Gráfico combinado */}
            <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle1">Ventas vs Compras por mes</Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_sales" fill="#4caf50" name="Ventas" />
                        <Bar dataKey="total_purchases" fill="#ff9800" name="Compras" />
                    </BarChart>
                </ResponsiveContainer>
            </Paper>

            {/* Gráfico de producto más vendido */}
            <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle1">Productos más vendidos</Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="times_sold" fill="#2196f3" name="Veces vendido" />
                    </BarChart>
                </ResponsiveContainer>
            </Paper>

            {/* Gráfico de métodos de pago */}
            <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle1">Métodos de pago</Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={isMobile ? 80 : 100}
                            dataKey="value"
                        >
                            {paymentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Paper>

            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
