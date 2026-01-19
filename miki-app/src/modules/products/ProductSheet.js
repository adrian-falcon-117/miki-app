import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Stack
} from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle'; // Agregar producto
import InventoryIcon from "@mui/icons-material/Inventory";             // Ver productos
import { useNavigate } from "react-router-dom";

export default function ProductSheet({ open, onClose }) {
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
                Opciones de Productos
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<InventoryIcon />}
                        onClick={() => {
                            onClose();
                            navigate("/products");
                        }}
                        sx={{ borderRadius: "12px", padding: "12px" }}
                    >
                        Ver Productos
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleIcon />}
                        onClick={() => {
                            onClose();
                            navigate("/products/add");
                        }}
                        sx={{ borderRadius: "12px", padding: "12px" }}
                    >
                        Agregar Producto
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
