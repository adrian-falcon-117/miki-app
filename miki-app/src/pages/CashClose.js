import React, { useState } from "react";
import { Paper, Typography, Box, TextField, Button, Snackbar, Alert, Divider } from "@mui/material";
import useSnackbar from "../utils/useSnackbar";
import useCashbox from "../utils/useCashbox";

export default function CashClose() {
    const [physicalCash, setPhysicalCash] = useState("");
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();
    const { cashboxOpening, closeCashbox } = useCashbox();

    const expectedTotal = cashboxOpening
        ? Number(cashboxOpening.opening || 0) +
        Number(cashboxOpening.cashSalesTotal || 0) +
        Number(cashboxOpening.incomes || 0) -
        Number(cashboxOpening.expenses || 0)
        : 0;

    const difference = (parseFloat(physicalCash) || 0) - expectedTotal;

    const handleCloseCashbox = () => {
        if (!cashboxOpening) {
            showSnackbar("No hay caja abierta para cerrar", "warning");
            return;
        }

        const closingData = closeCashbox(physicalCash);
        if (!closingData) return;

        showSnackbar(
            `Cierre registrado. Diferencia: ${difference > 0 ? "+" : ""}${difference.toFixed(2)}`,
            difference === 0 ? "success" : (difference > 0 ? "info" : "error")
        );
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Cierre de caja</Typography>

            {!cashboxOpening ? (
                <Typography sx={{ mt: 2 }}>No hay caja abierta para cerrar.</Typography>
            ) : (
                <>
                    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                        <Typography>Abierta: {new Date(cashboxOpening.opened_at).toLocaleString()}</Typography>
                        <Typography>Inicial: ${Number(cashboxOpening.opening || 0).toFixed(2)}</Typography>
                        <Typography>Ventas en efectivo: ${Number(cashboxOpening.cashSalesTotal || 0).toFixed(2)}</Typography>
                        <Typography>Ingresos: ${Number(cashboxOpening.incomes || 0).toFixed(2)}</Typography>
                        <Typography>Egresos: ${Number(cashboxOpening.expenses || 0).toFixed(2)}</Typography>
                        <Typography sx={{ fontWeight: "bold" }}>Total esperado: ${expectedTotal.toFixed(2)}</Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label="Dinero físico contado"
                            type="number"
                            value={physicalCash}
                            onChange={(e) => setPhysicalCash(e.target.value)}
                            size="small"
                        />

                        <Box sx={{ textAlign: "left" }}>
                            <Typography variant="body2">Diferencia</Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: "bold",
                                    color:
                                        difference === 0
                                            ? "success.main"
                                            : difference > 0
                                                ? "black"
                                                : "error.main"
                                }}
                            >
                                {difference > 0 ? `+${difference.toFixed(2)}` : difference.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Button variant="contained" color="primary" fullWidth onClick={handleCloseCashbox}>
                            Cerrar caja
                        </Button>
                    </Box>
                </>
            )}

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>
        </Paper>
    );
}
