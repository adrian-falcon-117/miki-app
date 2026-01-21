import React, { useState } from "react";
import {
    Paper, Typography, TextField, Button, Snackbar, Alert, List, ListItem, ListItemText, Box
} from "@mui/material";
import useSnackbar from "../utils/useSnackbar";
import useCashbox from "../utils/useCashbox";

export default function CashIncome() {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();
    const { cashboxOpening, setCashboxOpening, isOpen } = useCashbox();

    const incomes = cashboxOpening?.incomesList || [];

    const handleAddIncome = () => {
        if (!isOpen || !cashboxOpening) {
            showSnackbar("No hay caja abierta", "warning");
            return;
        }

        const val = parseFloat(amount);
        if (!val || val <= 0) {
            showSnackbar("Monto inválido", "error");
            return;
        }

        const newIncome = {
            id: Date.now(),
            amount: val,
            description,
            created_at: new Date().toISOString()
        };

        const updatedIncomes = [...incomes, newIncome];
        const totalIncomes = updatedIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

        const updated = {
            ...cashboxOpening,
            incomesList: updatedIncomes,
            incomes: totalIncomes,
            expectedTotal:
                Number(cashboxOpening.opening || 0) +
                Number(cashboxOpening.cashSalesTotal || 0) +
                totalIncomes -
                Number(cashboxOpening.expenses || 0)
        };

        setCashboxOpening(updated);

        setAmount("");
        setDescription("");
        showSnackbar("Ingreso registrado", "success");
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Registrar ingreso (aporte a caja)</Typography>

            <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap", flexDirection: "column" }}>
                <TextField
                    label="Monto"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    size="small"
                />
                <TextField
                    label="Descripción"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                />
                <Button variant="contained" color="success" onClick={handleAddIncome}>
                    Agregar ingreso
                </Button>
            </Box>

            <Typography sx={{ mt: 2, mb: 1 }}>Ingresos en la apertura</Typography>
            <List>
                {incomes.map((inc) => (
                    <ListItem key={inc.id}>
                        <ListItemText
                            primary={`$${Number(inc.amount).toFixed(2)}`}
                            secondary={inc.description || new Date(inc.created_at).toLocaleString()}
                        />
                    </ListItem>
                ))}
                {incomes.length === 0 && (
                    <Typography variant="body2" sx={{ p: 1 }}>
                        No hay ingresos registrados
                    </Typography>
                )}
            </List>

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
        </Paper>
    );
}
