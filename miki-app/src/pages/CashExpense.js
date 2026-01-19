import React, { useState } from "react";
import {
    Paper, Typography, TextField, Button, Snackbar, Alert, List, ListItem, ListItemText, Box
} from "@mui/material";
import useSnackbar from "../utils/useSnackbar";
import useCashbox from "../utils/useCashbox";

export default function CashExpense() {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();
    const { cashboxOpening, setCashboxOpening, isOpen } = useCashbox();

    const expenses = cashboxOpening?.expensesList || [];

    const handleAddExpense = () => {
        if (!isOpen || !cashboxOpening) {
            showSnackbar("No hay caja abierta", "warning");
            return;
        }

        const val = parseFloat(amount);
        if (!val || val <= 0) {
            showSnackbar("Monto inválido", "error");
            return;
        }

        const newExpense = {
            id: Date.now(),
            amount: val,
            description,
            created_at: new Date().toISOString()
        };

        const updatedExpenses = [...expenses, newExpense];
        const totalExpenses = updatedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const updated = {
            ...cashboxOpening,
            expensesList: updatedExpenses,
            expenses: totalExpenses,
            expectedTotal:
                Number(cashboxOpening.opening || 0) +
                Number(cashboxOpening.cashSalesTotal || 0) +
                Number(cashboxOpening.incomes || 0) -
                totalExpenses
        };

        setCashboxOpening(updated);

        setAmount("");
        setDescription("");
        showSnackbar("Egreso registrado ✅", "success");
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Registrar egreso (pago / extracción)</Typography>

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
                <Button variant="contained" color="error" onClick={handleAddExpense}>
                    Agregar egreso
                </Button>
            </Box>

            <Typography sx={{ mt: 2, mb: 1 }}>Egresos en la apertura</Typography>
            <List>
                {expenses.map((exp) => (
                    <ListItem key={exp.id}>
                        <ListItemText
                            primary={`$${Number(exp.amount).toFixed(2)}`}
                            secondary={exp.description || new Date(exp.created_at).toLocaleString()}
                        />
                    </ListItem>
                ))}
                {expenses.length === 0 && (
                    <Typography variant="body2" sx={{ p: 1 }}>
                        No hay egresos registrados
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
