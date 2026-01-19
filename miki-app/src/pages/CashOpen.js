import React, { useState } from "react";
import { TextField, Button, Stack, Typography, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useSnackbar from "../utils/useSnackbar";
import useCashbox from "../utils/useCashbox";

export default function CashOpen() {
    const [opening, setOpening] = useState("");
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();
    const { openCashbox } = useCashbox();
    const navigate = useNavigate();

    const handleOpen = () => {
        if (!opening || isNaN(Number(opening))) {
            showSnackbar("Monto inválido ❌", "error");
            return;
        }

        openCashbox(opening);
        showSnackbar("Caja abierta con éxito 🚀", "success");
        setOpening("");
        navigate("/");
    };

    return (
        <div style={{ padding: "20px" }}>
            <Typography variant="h5">Apertura de Caja</Typography>
            <Stack spacing={2}>
                <TextField
                    label="Monto inicial"
                    type="number"
                    value={opening}
                    onChange={(e) => setOpening(e.target.value)}
                    fullWidth
                />
                <Button variant="contained" color="success" onClick={handleOpen}>
                    Abrir Caja
                </Button>
            </Stack>

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
        </div>
    );
}
