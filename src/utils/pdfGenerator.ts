import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePremiumPDF = (
  title: string,
  subtitle: string,
  headers: string[],
  data: any[][],
  filename: string,
  summary?: { label: string; value: string }[],
  categoryData?: { title: string; headers: string[]; data: any[][] }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add a stylish header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Add Title
  doc.setTextColor(250, 204, 21); // primary/yellow-400
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 15, 20);

  // Add Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle.toUpperCase(), 15, 30);

  // Add Date
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(8);
  doc.text(`Generated on: ${dateStr}`, pageWidth - 15, 30, { align: 'right' });

  let finalY = 50;

  // Render Category Table first if provided (to emphasize "Type-wise" as requested)
  if (categoryData) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold italic');
    doc.text(categoryData.title.toUpperCase(), 15, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [categoryData.headers],
      body: categoryData.data,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // emerald-500
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: { fontSize: 8 },
      margin: { left: 15, right: 15 }
    });
    
    finalY = (doc as any).lastAutoTable.cursor.y + 20;
  }

  // Add Main Ledger Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold italic');
  doc.text('DETAILED SETTLEMENT LEDGER', 15, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
    },
    margin: { top: 50 },
  });

  // Add Summary if provided
  if (summary && summary.length > 0) {
    const summaryY = (doc as any).lastAutoTable.cursor.y + 15;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, summaryY, pageWidth - 30, (summary.length * 10) + 10, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSOLIDATED SUMMARY', 20, summaryY + 10);

    summary.forEach((item, index) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, 20, summaryY + 22 + (index * 8));
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, pageWidth - 20, summaryY + 22 + (index * 8), { align: 'right' });
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PaddyNexus - Advanced Logistics Intelligence | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
};
