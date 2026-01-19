import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ProductList() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:4000/products")
            .then(res => setProducts(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2>Lista de Productos</h2>
            <ul>
                {products.map(p => (
                    <li key={p.id}>
                        {p.name} - ${p.price}
                    </li>
                ))}
            </ul>
        </div>
    );
}
