import React, { useEffect, useState } from "react";
import {
    Box, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel,
    Snackbar, Alert, useTheme, useMediaQuery
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import axios from "axios";

export default function StatisticsScreen() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [group, setGroup] = useState("month");
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [summary, setSummary] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        fetchData();
    }, [group]);

    const fetchData = async () => {
        try {
            const salesRes = await axios.get("http://localhost:4000/reports/sales", { params: { group } });
            setSalesData(salesRes.data);

            const topRes = await axios.get("http://localhost:4000/reports/top-products", { params: { groupBy: group } });
            setTopProducts(topRes.data);

            const summaryRes = await axios.get("http://localhost:4000/reports/margin-summary");
            setSummary(summaryRes.data);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Error al cargar estadísticas", severity: "error" });
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>Estadísticas</Typography>

            {/* Filtros */}
            <FormControl sx={{ minWidth: 120, mb: 2 }}>
                <InputLabel>Periodo</InputLabel>
                <Select value={group} onChange={(e) => setGroup(e.target.value)}>
                    <MenuItem value="day">Día</MenuItem>
                    <MenuItem value="month">Mes</MenuItem>
                    <MenuItem value="year">Año</MenuItem>
                </Select>
            </FormControl>

            {/* KPIs */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Ventas</Typography>
                        <Typography variant="h6">${summary.total_sales?.toFixed(2) || 0}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Compras</Typography>
                        <Typography variant="h6">${summary.total_purchases?.toFixed(2) || 0}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Margen</Typography>
                        <Typography variant="h6" sx={{ color: summary.gross_margin >= 0 ? "green" : "red" }}>
                            ${summary.gross_margin?.toFixed(2) || 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Ticket promedio</Typography>
                        <Typography variant="h6">${summary.avg_ticket?.toFixed(2) || 0}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Gráfico principal */}
            <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle1">Ventas vs Compras</Typography>
                <LineChart width={isMobile ? 320 : 800} height={300} data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#4caf50" name="Ventas" />
                    <Line type="monotone" dataKey="purchases" stroke="#f44336" name="Compras" />
                </LineChart>
            </Paper>

            {/* Top productos */}
            <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle1">Top productos</Typography>
                <BarChart width={isMobile ? 320 : 800} height={300} data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="units_sold" fill="#2196f3" name="Unidades vendidas" />
                </BarChart>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
