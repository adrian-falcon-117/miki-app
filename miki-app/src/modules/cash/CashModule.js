import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CashModule() {
    const [balance, setBalance] = useState(0);

    // Cargar balance inicial
    useEffect(() => {
        axios.get("http://localhost:4000/cash")
            .then(res => setBalance(res.data.balance))
            .catch(err => console.error(err));
    }, []);

    const addCash = (amount) => {
        axios.post("http://localhost:4000/cash/add", { amount })
            .then(() => setBalance(balance + amount));
    };

    const removeCash = (amount) => {
        axios.post("http://localhost:4000/cash/remove", { amount })
            .then(() => setBalance(balance - amount));
    };

    return (
        <div>
            <h2>Gestión de Caja</h2>
            <p>Balance actual: ${balance}</p>
            <button onClick={() => addCash(100)}>+100</button>
            <button onClick={() => removeCash(50)}>-50</button>
        </div>
    );
}
