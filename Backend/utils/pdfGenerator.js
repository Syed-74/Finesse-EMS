import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '..', 'public', 'Finesse_logo.png');

export const generatePayslipPDF = (payroll, res) => {
   const doc = new PDFDocument({ margin: 50, size: 'A4' });

   doc.pipe(res);

   const marginLeft = 50;
   const marginRight = doc.page.width - 50;

   // ================= HEADER =================

   // Light Header Background
   doc.rect(0, 0, doc.page.width, 110).fill('#f9fafb');
   doc.fillColor('#000000');

   // Logo
   doc.image(logoPath, marginLeft, 30, { width: 100 });

   // Title
   doc
      .fontSize(18)
      .fillColor('#111827')
      .text('FInesse Pvt Ltd', 160, 40);

   doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Salary Payslip', 160, 60);

   // Divider
   doc
      .moveTo(marginLeft, 100)
      .lineTo(marginRight, 100)
      .lineWidth(1)
      .strokeColor('#e5e7eb')
      .stroke();

   doc.y = 120;

   // ================= EMPLOYEE INFORMATION =================

   doc.fillColor('#444444')
      .fontSize(12)
      .text('EMPLOYEE INFORMATION', marginLeft, 120, { underline: true });

   doc.fontSize(10);
   const infoY = 145;

   doc.text(`Full Name:`, marginLeft, infoY)
      .font('Helvetica-Bold')
      .text(`${payroll.employeeDetails.fullName}`, marginLeft + 80, infoY)
      .font('Helvetica');

   doc.text(`Employee Code:`, marginLeft, infoY + 15)
      .text(`${payroll.employeeDetails.employeeCode}`, marginLeft + 100, infoY + 15);

   doc.text(`Department:`, marginLeft, infoY + 30)
      .text(`${payroll.employeeDetails.department}`, marginLeft + 80, infoY + 30);

   doc.text(`Designation:`, marginLeft, infoY + 45)
      .text(`${payroll.employeeDetails.designation}`, marginLeft + 85, infoY + 45);

   // ================= PAY SUMMARY TABLE =================

   const tableTop = 120;
   const colWidth = 80;
   const colX = [marginRight - 240, marginRight - 155, marginRight - 70];

   doc.rect(colX[0], tableTop, colWidth, 20).fill('#141d38');
   doc.rect(colX[1], tableTop, colWidth, 20).fill('#141d38');
   doc.rect(colX[2], tableTop, colWidth, 20).fill('#141d38');

   doc.fillColor('#ffffff').fontSize(8);
   doc.text('PAY DATE', colX[0], tableTop + 7, { width: colWidth, align: 'center' });
   doc.text('PAY PERIOD', colX[1], tableTop + 7, { width: colWidth, align: 'center' });
   doc.text('STATUS', colX[2], tableTop + 7, { width: colWidth, align: 'center' });

   doc.fillColor('#444444').fontSize(9);

   const payDate = payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'N/A';
   const monthName = new Date(0, payroll.month - 1).toLocaleString('en', { month: 'long' });
   const payPeriod = `${monthName} ${payroll.year}`;

   doc.rect(colX[0], tableTop + 20, colWidth, 20).stroke('#eeeeee');
   doc.rect(colX[1], tableTop + 20, colWidth, 20).stroke('#eeeeee');
   doc.rect(colX[2], tableTop + 20, colWidth, 20).stroke('#eeeeee');

   doc.text(payDate, colX[0], tableTop + 26, { width: colWidth, align: 'center' });
   doc.text(payPeriod, colX[1], tableTop + 26, { width: colWidth, align: 'center' });
   doc.text(payroll.status, colX[2], tableTop + 26, { width: colWidth, align: 'center' });

   // ================= EARNINGS =================

   let currentY = 220;

   doc.fillColor('#000000')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('EARNINGS', marginLeft, currentY);

   doc.rect(marginLeft, currentY + 15, marginRight - marginLeft, 20).fill('#f3f4f6');
   doc.fillColor('#000000').fontSize(9)
      .text('DESCRIPTION', marginLeft + 10, currentY + 22);
   doc.text('AMOUNT', marginRight - 70, currentY + 22, { align: 'right' });

   currentY += 35;

   const items = [
      { label: 'Basic Salary', amount: payroll.salaryStructure.basicSalary },
      ...(payroll.earnings || []).map(e => ({ label: e.componentName, amount: e.amount }))
   ];

   doc.font('Helvetica');

   items.forEach(item => {
      if (item.amount > 0) {
         doc.text(item.label, marginLeft + 10, currentY);
         doc.text(`Rs ${item.amount.toLocaleString()}`, marginRight - 70, currentY, { align: 'right' });
         currentY += 20;

         doc.strokeColor('#eeeeee')
            .moveTo(marginLeft, currentY - 5)
            .lineTo(marginRight, currentY - 5)
            .stroke();
      }
   });

   doc.font('Helvetica-Bold')
      .rect(marginLeft, currentY, marginRight - marginLeft, 25)
      .fill('#f9fafb');

   doc.fillColor('#000000')
      .text('GROSS PAY', marginLeft + 10, currentY + 8);

   doc.text(`Rs ${payroll.grossSalary.toLocaleString()}`, marginRight - 70, currentY + 8, { align: 'right' });

   currentY += 40;

   // ================= DEDUCTIONS =================

   doc.fillColor('#000000')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('DEDUCTIONS', marginLeft, currentY);

   doc.rect(marginLeft, currentY + 15, marginRight - marginLeft, 20).fill('#f3f4f6');
   doc.fillColor('#000000').fontSize(9)
      .text('DESCRIPTION', marginLeft + 10, currentY + 22);
   doc.text('AMOUNT', marginRight - 70, currentY + 22, { align: 'right' });

   currentY += 35;

   const deductionItems = [
      { label: `Tax (${payroll.taxPercentage}%)`, amount: (payroll.salaryStructure.basicSalary * payroll.taxPercentage) / 100 },
      { label: `PF (${payroll.pfPercentage}%)`, amount: (payroll.salaryStructure.basicSalary * payroll.pfPercentage) / 100 },
      { label: `ESI (${payroll.esiPercentage}%)`, amount: (payroll.salaryStructure.basicSalary * payroll.esiPercentage) / 100 },
      { label: 'Professional Tax', amount: payroll.professionalTax },
      { label: 'Unpaid Leaves', amount: payroll.leaveDeduction },
      ...(payroll.deductions || []).map(d => ({ label: d.componentName, amount: d.amount }))
   ];

   doc.font('Helvetica');

   deductionItems.forEach(item => {
      if (item.amount > 0) {
         doc.text(item.label, marginLeft + 10, currentY);
         doc.text(`Rs ${item.amount.toLocaleString()}`, marginRight - 70, currentY, { align: 'right' });
         currentY += 20;

         doc.strokeColor('#eeeeee')
            .moveTo(marginLeft, currentY - 5)
            .lineTo(marginRight, currentY - 5)
            .stroke();
      }
   });

   doc.font('Helvetica-Bold')
      .rect(marginLeft, currentY, marginRight - marginLeft, 25)
      .fill('#f9fafb');

   doc.fillColor('#000000')
      .text('TOTAL DEDUCTIONS', marginLeft + 10, currentY + 8);

   doc.text(`Rs ${payroll.totalDeductions.toLocaleString()}`, marginRight - 70, currentY + 8, { align: 'right' });

   currentY += 40;

   // ================= NET PAY =================

   doc.rect(marginLeft, currentY, marginRight - marginLeft, 40).fill('#141d38');

   doc.fillColor('#ffffff')
      .fontSize(14)
      .text('NET PAY', marginLeft + 20, currentY + 13);

   doc.text(`Rs ${payroll.netSalary.toLocaleString()}`, marginRight - 70, currentY + 13, { align: 'right' });

   // ================= FOOTER =================

   doc.fillColor('#999999')
      .fontSize(8)
      .text(
         'This is a computer generated payslip and does not require a signature.',
         marginLeft,
         780,
         { align: 'center', width: marginRight - marginLeft }
      );

   doc.end();
};
