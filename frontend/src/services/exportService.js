
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { formatCurrency } from "@/lib/utils";

// --- CSV Export ---
export const exportToCSV = (transactions) => {
    // 1. Transform data for CSV
    const data = transactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString("vi-VN"),
        Description: t.description,
        Amount: t.amount,
        Currency: "VND",
        Type: t.type === 'INCOME' ? 'Thu' : 'Chi',
        Category: "Category", // Needs mapping if we had category names
        Wallet: "Wallet" // Needs mapping
    }));

    // 2. Generate CSV
    const csv = Papa.unparse(data);

    // 3. Trigger Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- PDF Export ---
export const exportToPDF = (transactions, title = "Sao Kê Giao Dịch") => {
    const doc = new jsPDF();

    // 1. Header
    doc.setFontSize(20);
    doc.text("JUNKIO EXPENSE TRACKER", 14, 22);

    doc.setFontSize(14);
    doc.text(title, 14, 32);

    doc.setFontSize(10);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, 14, 40);

    // 2. Table Data
    const tableColumn = ["Ngày", "Mô Tả", "Loại", "Số Tiền"];
    const tableRows = [];

    transactions.forEach(t => {
        const transactionData = [
            new Date(t.date).toLocaleDateString("vi-VN"),
            t.description,
            t.type === 'INCOME' ? 'Thu' : 'Chi',
            formatCurrency(t.amount)
        ];
        tableRows.push(transactionData);
    });

    // 3. Generate Table
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    // 4. Save
    doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
};
