// src/utils/useCashbox.js
import useLocalStorage from "./useLocalStorage";
import { useCallback } from "react";

export default function useCashbox() {
    const [cashboxOpening, setCashboxOpening] = useLocalStorage("cashbox_opening", null);
    const [cashboxClosing, setCashboxClosing] = useLocalStorage("cashbox_closing", null);

    const isOpen = !!(cashboxOpening && !cashboxOpening.closed_at);

    const openCashbox = (openingAmount) => {
        const opened_at = new Date().toISOString();
        const newOpening = {
            opening: Number(openingAmount),
            opened_at,
            incomes: 0,
            expenses: 0,
            salesTotal: 0,
            cashSalesTotal: 0,
            transferSalesTotal: 0,
            salesList: [],
            incomesList: [],
            expensesList: []
        };
        setCashboxOpening(newOpening);
        return newOpening;
    };

    const closeCashbox = (physicalCash) => {
        if (!cashboxOpening) return null;
        const expectedTotal =
            Number(cashboxOpening.opening || 0) +
            Number(cashboxOpening.cashSalesTotal || 0) +
            Number(cashboxOpening.incomes || 0) -
            Number(cashboxOpening.expenses || 0);

        const difference = Number(physicalCash) - expectedTotal;
        const closed_at = new Date().toISOString();

        const closingData = {
            ...cashboxOpening,
            closed_at,
            physicalCash: Number(physicalCash),
            expectedTotal,
            difference
        };

        setCashboxClosing(closingData);
        setCashboxOpening(null);
        return closingData;
    };

    const updateCashbox = useCallback((patch) => {
        setCashboxOpening(prev => {
            const next = { ...(prev || {}), ...patch };
            return next;
        });
    }, [setCashboxOpening]);

    const recalcTotals = useCallback((cb = cashboxOpening) => {
        if (!cb) return cb;
        const sales = cb.salesList || [];
        const incomes = cb.incomesList || [];
        const expenses = cb.expensesList || [];

        const salesTotal = sales.filter(s => !s.canceled).reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        const cashSalesTotal = sales.filter(s => !s.canceled).reduce((sum, s) => sum + (Number(s.cash) || 0), 0);
        const transferSalesTotal = sales.filter(s => !s.canceled).reduce((sum, s) => sum + (Number(s.transfer) || 0), 0);
        const incomesTotal = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const expensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const updated = {
            ...cb,
            salesList: sales,
            incomesList: incomes,
            expensesList: expenses,
            salesTotal,
            cashSalesTotal,
            transferSalesTotal,
            incomes: incomesTotal,
            expenses: expensesTotal,
            expectedTotal: Number(cb.opening || 0) + cashSalesTotal + incomesTotal - expensesTotal
        };

        setCashboxOpening(updated);
        return updated;
    }, [setCashboxOpening]);

    const addSale = useCallback((sale) => {
        setCashboxOpening(prev => {
            const base = prev || {};
            const salesList = Array.isArray(base.salesList) ? [...base.salesList, sale] : [sale];
            const next = { ...base, salesList };
            // recalc totals synchronously
            const activeSales = salesList.filter(s => !s.canceled);
            next.salesTotal = activeSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
            next.cashSalesTotal = activeSales.reduce((sum, s) => sum + (Number(s.cash) || 0), 0);
            next.transferSalesTotal = activeSales.reduce((sum, s) => sum + (Number(s.transfer) || 0), 0);
            next.expectedTotal = Number(next.opening || 0) + next.cashSalesTotal + Number(next.incomes || 0) - Number(next.expenses || 0);
            return next;
        });
    }, [setCashboxOpening]);

    const addIncome = useCallback((income) => {
        setCashboxOpening(prev => {
            const base = prev || {};
            const incomesList = Array.isArray(base.incomesList) ? [...base.incomesList, income] : [income];
            const incomesTotal = incomesList.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
            const next = { ...base, incomesList, incomes: incomesTotal };
            next.expectedTotal = Number(next.opening || 0) + Number(next.cashSalesTotal || 0) + incomesTotal - Number(next.expenses || 0);
            return next;
        });
    }, [setCashboxOpening]);

    const addExpense = useCallback((expense) => {
        setCashboxOpening(prev => {
            const base = prev || {};
            const expensesList = Array.isArray(base.expensesList) ? [...base.expensesList, expense] : [expense];
            const expensesTotal = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            const next = { ...base, expensesList, expenses: expensesTotal };
            next.expectedTotal = Number(next.opening || 0) + Number(next.cashSalesTotal || 0) + Number(next.incomes || 0) - expensesTotal;
            return next;
        });
    }, [setCashboxOpening]);

    return {
        cashboxOpening,
        cashboxClosing,
        isOpen,
        openCashbox,
        closeCashbox,
        setCashboxOpening, // <-- expongo el setter por compatibilidad
        updateCashbox,
        recalcTotals,
        addSale,
        addIncome,
        addExpense
    };
}
