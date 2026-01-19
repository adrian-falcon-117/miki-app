import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Stack,
    Typography
} from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import useCashbox from "../../utils/useCashbox";


export default function CashSheet({ open, onClose }) {
    const navigate = useNavigate();
    const { isOpen: isCashboxOpen } = useCashbox(); // ✅ ya chequea null internamente

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
                Opciones de Caja
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {/* Apertura */}
                    <div>
                        <Button
                            variant="contained"
                            startIcon={<MonetizationOnIcon />}
                            onClick={() => {
                                onClose();
                                navigate("/cash/open");
                            }}
                            sx={{
                                borderRadius: "12px",
                                padding: "12px",
                                width: "100%",
                                bgcolor: isCashboxOpen ? "grey.400" : "primary.main",
                                color: "#fff"
                            }}
                            disabled={isCashboxOpen}
                        >
                            Apertura de Caja
                        </Button>
                        {isCashboxOpen && (
                            <Typography
                                variant="caption"
                                sx={{ color: "error.main", mt: 1, display: "block", textAlign: "center" }}
                            >
                                La caja ya está abierta
                            </Typography>
                        )}
                    </div>

                    {/* Ventas */}
                    <div>
                        <Button
                            variant="contained"
                            startIcon={<ListAltIcon />}
                            onClick={() => {
                                onClose();
                                navigate("/cash/sales");
                            }}
                            sx={{
                                borderRadius: "12px",
                                padding: "12px",
                                width: "100%",
                                bgcolor: !isCashboxOpen ? "grey.400" : "secondary.main",
                                color: "#fff"
                            }}
                            disabled={!isCashboxOpen}
                        >
                            Ventas Hechas
                        </Button>
                        {!isCashboxOpen && (
                            <Typography
                                variant="caption"
                                sx={{ color: "error.main", mt: 1, display: "block", textAlign: "center" }}
                            >
                                Disponible solo con caja abierta
                            </Typography>
                        )}
                    </div>

                    {/* Ingreso */}
                    <div>
                        <Button
                            variant="contained"
                            startIcon={<AddCircleRoundedIcon />}
                            onClick={() => {
                                onClose();
                                navigate("/cash/income");
                            }}
                            sx={{
                                borderRadius: "12px",
                                padding: "12px",
                                width: "100%",
                                bgcolor: !isCashboxOpen ? "grey.400" : "success.main",
                                color: "#fff"
                            }}
                            disabled={!isCashboxOpen}
                        >
                            Registrar Ingreso
                        </Button>
                        {!isCashboxOpen && (
                            <Typography
                                variant="caption"
                                sx={{ color: "error.main", mt: 1, display: "block", textAlign: "center" }}
                            >
                                Disponible solo con caja abierta
                            </Typography>
                        )}
                    </div>

                    {/* Egreso */}
                    <div>
                        <Button
                            variant="contained"
                            startIcon={<RemoveCircleIcon />}
                            onClick={() => {
                                onClose();
                                navigate("/cash/expense");
                            }}
                            sx={{
                                borderRadius: "12px",
                                padding: "12px",
                                width: "100%",
                                bgcolor: !isCashboxOpen ? "grey.400" : "warning.main",
                                color: "#fff"
                            }}
                            disabled={!isCashboxOpen}
                        >
                            Registrar Egreso
                        </Button>
                        {!isCashboxOpen && (
                            <Typography
                                variant="caption"
                                sx={{ color: "error.main", mt: 1, display: "block", textAlign: "center" }}
                            >
                                Disponible solo con caja abierta
                            </Typography>
                        )}
                    </div>

                    {/* Cierre */}
                    <div>
                        <Button
                            variant="contained"
                            startIcon={<CloseIcon />}
                            onClick={() => {
                                onClose();
                                navigate("/cash/close");
                            }}
                            sx={{
                                borderRadius: "12px",
                                padding: "12px",
                                width: "100%",
                                bgcolor: !isCashboxOpen ? "grey.400" : "error.main",
                                color: "#fff"
                            }}
                            disabled={!isCashboxOpen}
                        >
                            Cierre de Caja
                        </Button>
                        {!isCashboxOpen && (
                            <Typography
                                variant="caption"
                                sx={{ color: "error.main", mt: 1, display: "block", textAlign: "center" }}
                            >
                                No hay caja abierta para cerrar
                            </Typography>
                        )}
                    </div>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
