import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '..', 'public', 'Finesse_logo.png');

export const generatePayslipPDF = (payroll, res) => {
   const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      info: {
         Title: `Payslip_${payroll.month}_${payroll.year}`,
         Author: 'Finesse Pvt Ltd'
      }
   });

   doc.pipe(res);

   const marginLeft = 50;
   const marginRight = doc.page.width - 50;
   const contentWidth = marginRight - marginLeft;

   // Colors
   const primaryColor = '#1e293b'; // Slate 800
   const secondaryColor = '#64748b'; // Slate 500
   const accentColor = '#3b82f6'; // Blue 500
   const borderColor = '#e2e8f0'; // Slate 200
   const lightBg = '#f8fafc'; // Slate 50

   // ================= HEADER =================

   // Logo and Company info
   try {
      doc.image(logoPath, marginLeft, 40, { width: 80 });
   } catch (e) {
      // Fallback if logo not found
      doc.fontSize(20).fillColor(primaryColor).font('Helvetica-Bold').text('FINESSE', marginLeft, 40);
   }

   doc.fillColor(primaryColor)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Finesse Pvt Ltd', marginLeft + 300, 40, { align: 'right' });

   doc.fillColor(secondaryColor)
      .fontSize(9)
      .font('Helvetica')
      .text('Modern Business Solutions', marginLeft + 300, 60, { align: 'right' })
      .text('info@finesse.com | www.finesse.com', marginLeft + 300, 72, { align: 'right' });

   // Title & Period Block
   doc.rect(marginLeft, 100, contentWidth, 40).fill(lightBg);
   doc.fillColor(primaryColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SALARY PAYSLIP', marginLeft + 15, 115);

   const monthName = new Date(0, payroll.month - 1).toLocaleString('en', { month: 'long' });
   doc.fillColor(secondaryColor)
      .fontSize(10)
      .font('Helvetica')
      .text(`Period: ${monthName} ${payroll.year}`, marginLeft, 115, { align: 'right', width: contentWidth - 15 });

   // ================= EMPLOYEE & PAY INFO =================

   let currentY = 160;

   // Two column layout for info
   const drawInfoRow = (label, value, x, y, width) => {
      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica').text(label.toUpperCase(), x, y);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(value || 'N/A', x, y + 12, { width: width });
   };

   // Column 1
   drawInfoRow('Employee Name', payroll.employeeDetails.fullName, marginLeft, currentY, 200);
   drawInfoRow('Employee ID', payroll.employeeDetails.employeeCode, marginLeft, currentY + 40, 200);
   drawInfoRow('Department', payroll.employeeDetails.department, marginLeft, currentY + 80, 200);

   // Column 2
   drawInfoRow('Designation', payroll.employeeDetails.designation, marginLeft + 220, currentY, 150);
   const payDate = payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending';
   drawInfoRow('Payment Date', payDate, marginLeft + 220, currentY + 40, 150);
   drawInfoRow('Status', payroll.status, marginLeft + 220, currentY + 80, 150);

   currentY += 125;

   // ================= SALARY BREAKDOWN =================

   doc.moveTo(marginLeft, currentY).lineTo(marginRight, currentY).strokeColor(borderColor).lineWidth(0.5).stroke();
   currentY += 20;

   // Table Headers
   doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold');
   doc.text('EARNINGS', marginLeft, currentY);
   doc.text('AMOUNT', marginLeft + 200, currentY, { width: 70, align: 'right' });

   doc.text('DEDUCTIONS', marginLeft + 300, currentY);
   doc.text('AMOUNT', marginRight - 70, currentY, { width: 70, align: 'right' });

   currentY += 15;
   doc.moveTo(marginLeft, currentY).lineTo(marginRight, currentY).strokeColor(primaryColor).lineWidth(1).stroke();
   currentY += 10;

   const startBreakdownY = currentY;

   // Earnings List
   const earnings = [
      { label: 'Basic Salary', amount: payroll.salaryStructure.basicSalary },
      ...(payroll.earnings || []).map(e => ({ label: e.componentName, amount: e.amount }))
   ];

   let earningsY = currentY;
   earnings.forEach(item => {
      if (item.amount > 0) {
         doc.fillColor(primaryColor).fontSize(9).font('Helvetica').text(item.label, marginLeft, earningsY);
         doc.text(`R ${item.amount.toLocaleString()}`, marginLeft + 200, earningsY, { width: 70, align: 'right' });
         earningsY += 18;
      }
   });

   // Deductions List
   const deductions = [
      { label: 'Income Tax', amount: (payroll.salaryStructure.basicSalary * payroll.taxPercentage) / 100 },
      { label: 'Provident Fund', amount: (payroll.salaryStructure.basicSalary * payroll.pfPercentage) / 100 },
      { label: 'ESI', amount: (payroll.salaryStructure.basicSalary * payroll.esiPercentage) / 100 },
      { label: 'Professional Tax', amount: payroll.professionalTax },
      { label: 'Loss of Pay (Leaves)', amount: payroll.leaveDeduction },
      ...(payroll.deductions || []).map(d => ({ label: d.componentName, amount: d.amount }))
   ];

   let deductionsY = currentY;
   deductions.forEach(item => {
      if (item.amount > 0) {
         doc.fillColor(primaryColor).fontSize(9).font('Helvetica').text(item.label, marginLeft + 300, deductionsY);
         doc.text(`R ${item.amount.toLocaleString()}`, marginRight - 70, deductionsY, { width: 70, align: 'right' });
         deductionsY += 18;
      }
   });

   // Use the longest column for final Y
   currentY = Math.max(earningsY, deductionsY) + 20;

   // Totals Row
   doc.rect(marginLeft, currentY, contentWidth, 25).fill(lightBg);
   doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold');
   
   doc.text('Total Earnings', marginLeft + 5, currentY + 8);
   doc.text(`R ${payroll.grossSalary.toLocaleString()}`, marginLeft + 200, currentY + 8, { width: 70, align: 'right' });

   doc.text('Total Deductions', marginLeft + 305, currentY + 8);
   doc.text(`R ${payroll.totalDeductions.toLocaleString()}`, marginRight - 70, currentY + 8, { width: 70, align: 'right' });

   currentY += 60;

   // ================= NET PAY SUMMARY =================

   const netPayRectHeight = 60;
   doc.roundedRect(marginLeft, currentY, contentWidth, netPayRectHeight, 8).fill(primaryColor);
   
   doc.fillColor('#ffffff').fontSize(10).font('Helvetica').text('NET TAKE HOME PAY', marginLeft + 25, currentY + 15);
   
   doc.fontSize(22).font('Helvetica-Bold')
      .text(`R ${payroll.netSalary.toLocaleString()}`, marginLeft, currentY + 28, { width: contentWidth - 25, align: 'right' });

   // ================= ATTENDANCE SUMMARY =================
   currentY += netPayRectHeight + 30;
   
   doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold').text('ATTENDANCE SUMMARY', marginLeft, currentY);
   currentY += 15;
   
   const attendanceWidth = contentWidth / 4;
   const drawAttendance = (label, value, x) => {
      doc.fillColor(secondaryColor).fontSize(7).text(label, x, currentY);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(value.toString(), x, currentY + 10);
   };

   drawAttendance('Working Days', payroll.totalWorkingDays || 0, marginLeft);
   drawAttendance('Days Present', payroll.presentDays || 0, marginLeft + attendanceWidth);
   drawAttendance('Paid Leaves', payroll.paidLeavesTaken || 0, marginLeft + attendanceWidth * 2);
   drawAttendance('Unpaid Leaves', payroll.unpaidLeaves || 0, marginLeft + attendanceWidth * 3);

   // ================= FOOTER =================

   doc.fillColor(secondaryColor)
      .fontSize(8)
      .font('Helvetica')
      .text(
         'This is a digitally generated document and does not require a physical signature.',
         marginLeft,
         750,
         { align: 'center', width: contentWidth }
      );

   doc.text(
      '© 2026 Finesse Pvt Ltd. All rights reserved.',
      marginLeft,
      762,
      { align: 'center', width: contentWidth }
   );

   doc.end();
};
