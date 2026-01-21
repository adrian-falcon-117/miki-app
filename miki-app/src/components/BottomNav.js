import React, { useState } from "react";
import { BottomNavigation, BottomNavigationAction, useTheme, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";   // Caja
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Proveedores
import SearchIcon from "@mui/icons-material/Search";             // Buscar
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart"; // Productos
import MenuIcon from "@mui/icons-material/Menu";                 // Menú
import SuppliersSheet from "../modules/suppliers/SuppliersSheet";
import CashSheet from "../modules/cash/CashSheet";
import ProductSheet from "../modules/products/ProductSheet";
import MenuSheet from "../modules/menu/MenuSheet";

export default function BottomNav() {
    const [value, setValue] = useState(0);
    const [showSuppliers, setShowSuppliers] = useState(false);
    const [showCash, setShowCash] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <>
            <BottomNavigation
                showLabels={!isMobile} // en móvil solo íconos, en desktop íconos + labels
                value={value}
                onChange={(event, newValue) => setValue(newValue)}
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "#930fff",
                    borderTopLeftRadius: "16px",
                    borderTopRightRadius: "16px",
                    overflow: "hidden",
                    height: isMobile ? 56 : 64, // altura más compacta en móvil
                }}
            >
                <BottomNavigationAction
                    label="Buscar"
                    icon={<SearchIcon fontSize={isMobile ? "small" : "medium"} />}
                    onClick={() => navigate("/")}
                    sx={{ color: "white", minWidth: isMobile ? 50 : 80 }}
                />
                <BottomNavigationAction
                    label="Caja"
                    icon={<PointOfSaleIcon fontSize={isMobile ? "small" : "medium"} />}
                    onClick={() => setShowCash(true)}
                    sx={{ color: "white", minWidth: isMobile ? 50 : 80 }}
                />
                <BottomNavigationAction
                    label="Proveedores"
                    icon={<LocalShippingIcon fontSize={isMobile ? "small" : "medium"} />}
                    onClick={() => setShowSuppliers(true)}
                    sx={{ color: "white", minWidth: isMobile ? 50 : 80 }}
                />
                <BottomNavigationAction
                    label="Productos"
                    icon={<AddShoppingCartIcon fontSize={isMobile ? "small" : "medium"} />}
                    onClick={() => setShowProducts(true)}
                    sx={{ color: "white", minWidth: isMobile ? 50 : 80 }}
                />
                <BottomNavigationAction
                    label="Menú"
                    icon={<MenuIcon fontSize={isMobile ? "small" : "medium"} />}
                    onClick={() => setShowMenu(true)}
                    sx={{ color: "white", minWidth: isMobile ? 50 : 80 }}
                />
            </BottomNavigation>

            {/* Sheets */}
            <SuppliersSheet open={showSuppliers} onClose={() => setShowSuppliers(false)} />
            <CashSheet open={showCash} onClose={() => setShowCash(false)} />
            <ProductSheet open={showProducts} onClose={() => setShowProducts(false)} />
            <MenuSheet open={showMenu} onClose={() => setShowMenu(false)} />
        </>
    );
}
