import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Stack
} from "@mui/material";
import BarChartIcon from '@mui/icons-material/BarChart';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useNavigate } from "react-router-dom";

export default function MenuSheet({ open, onClose }) {
    const navigate = useNavigate();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            PaperProps={{
                style: {
                    position: "fixed",
                    bottom: 0,
                    margin: 0,
                    width: "100%",
                    borderTopLeftRadius: "16px",
                    borderTopRightRadius: "16px",
                    paddingBottom: "20px"
                }
            }}
        >
            <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
                Opciones de Menu
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<BarChartIcon />}
                        onClick={() => {
                            onClose();
                            navigate("/menu/statistics");
                        }}
                        sx={{ borderRadius: "12px", padding: "12px" }}
                    >
                        Estadisticas
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<MonetizationOnIcon />}
                        onClick={() => {
                            onClose();
                            navigate("/menu/sales");
                        }}
                        sx={{ borderRadius: "12px", padding: "12px" }}
                    >
                        Ventas
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<ShoppingBagIcon />}
                        onClick={() => {
                            onClose();
                            navigate("/menu/buy");
                        }}
                        sx={{ borderRadius: "12px", padding: "12px" }}
                    >
                        Comprar
                    </Button>

                </Stack>
            </DialogContent>
        </Dialog>
    );
}
