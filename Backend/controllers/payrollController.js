import Payroll from "../models/Payroll.model.js";
import Employee from "../models/employee.model.js";
import { generatePayslipPDF } from "../utils/pdfGenerator.js";

/*
==================================================
  HELPER: SALARY CALCULATION FUNCTION
==================================================
*/
const calculateSalary = (data) => {
  const {
    salaryStructure,
    earnings = [],
    deductions = [],
    taxPercentage = 0,
    pfPercentage = 0,
    esiPercentage = 0,
    professionalTax = 0,
    unpaidLeaves = 0,
    totalWorkingDays = 30,
  } = data;

  const basicSalary = parseFloat(salaryStructure.basicSalary) || 0;

  // Leave deduction (ONLY from Basic)
  const perDaySalary = basicSalary / totalWorkingDays;
  const leaveDeduction = perDaySalary * unpaidLeaves;

  // Dynamic earnings
  const extraEarnings = earnings.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

  // Percentage deductions (Calculated from Basic)
  const taxAmount = (basicSalary * taxPercentage) / 100;
  const pfAmount = (basicSalary * pfPercentage) / 100;
  const esiAmount = (basicSalary * esiPercentage) / 100;

  // Dynamic deductions
  const extraDeductions = deductions.reduce(
    (acc, item) => acc + (parseFloat(item.amount) || 0),
    0
  );

  const totalDeductions =
    taxAmount +
    pfAmount +
    esiAmount +
    (parseFloat(professionalTax) || 0) +
    leaveDeduction +
    extraDeductions;

  const grossSalary = basicSalary + extraEarnings;
  let netSalary = grossSalary - totalDeductions;

  // Rounding and positive check
  netSalary = Math.max(0, parseFloat(netSalary.toFixed(2)));

  return {
    grossSalary,
    totalEarnings: grossSalary,
    totalDeductions,
    netSalary,
  };
};

/*
==================================================
  MAIN CONTROLLER
==================================================
*/

export const payrollController = {
  /*
  -----------------------------------
  Generate Payroll (Admin)
  -----------------------------------
  */
  generate: async (req, res) => {
    try {
      const {
        employeeId,
        month,
        year,
        salaryStructure,
        earnings,
        deductions,
        taxPercentage,
        pfPercentage,
        esiPercentage,
        professionalTax,
        unpaidLeaves,
        totalWorkingDays,
      } = req.body;

      const employee = await Employee.findById(employeeId);
      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      const existing = await Payroll.findOne({ employeeId, month, year });
      if (existing)
        return res
          .status(400)
          .json({ message: "Payroll already exists for this month" });

      // Override salaryStructure from DB for security
      const finalPayload = {
        ...req.body,
        salaryStructure: {
          basicSalary: employee.salaryStructure.basicSalary
        }
      };

      const salaryData = calculateSalary(finalPayload);

      const payroll = await Payroll.create({
        employeeId,
        employeeDetails: {
          employeeCode: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          designation: employee.designation,
        },
        month,
        year,
        salaryStructure,
        earnings,
        deductions,
        taxPercentage,
        pfPercentage,
        esiPercentage,
        professionalTax,
        unpaidLeaves,
        totalWorkingDays,
        ...salaryData,
      });

      res.status(201).json({ message: "Payroll generated", payroll });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Get All Payrolls (Admin)
  -----------------------------------
  */
  getAll: async (req, res) => {
    try {
      const payrolls = await Payroll.find().populate("employeeId");
      res.json(payrolls);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Get My Payrolls (Employee)
  -----------------------------------
  */
  getMy: async (req, res) => {
    try {
      // Use req.employee._id from protectEmployee middleware
      const payrolls = await Payroll.find({ employeeId: req.employee._id });
      res.json(payrolls);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Get Single Payroll
  -----------------------------------
  */
  getOne: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);
      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      // Ownership check for employees
      if (req.employee && payroll.employeeId.toString() !== req.employee._id.toString()) {
        return res.status(403).json({ message: "Unauthorized access to this payroll" });
      }

      res.json(payroll);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Update Payroll (Draft Only)
  -----------------------------------
  */
  update: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);
      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "DRAFT")
        return res
          .status(400)
          .json({ message: "Only draft payroll can be edited" });

      Object.assign(payroll, req.body);

      const salaryData = calculateSalary(payroll);
      Object.assign(payroll, salaryData);

      await payroll.save();

      res.json({ message: "Payroll updated", payroll });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Approve Payroll
  -----------------------------------
  */
  approve: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);
      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "DRAFT")
        return res.status(400).json({ message: "Already processed" });

      payroll.status = "APPROVED";
      await payroll.save();

      res.json({ message: "Payroll approved", payroll });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Mark Payroll as Paid
  -----------------------------------
  */
  markAsPaid: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);
      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "APPROVED")
        return res
          .status(400)
          .json({ message: "Payroll must be approved first" });

      payroll.status = "PAID";
      payroll.paymentDate = new Date();
      payroll.payslipGenerated = true;
      payroll.payslipGeneratedAt = new Date();

      await payroll.save();

      res.json({ message: "Payroll marked as PAID", payroll });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Delete Payroll (Draft Only)
  -----------------------------------
  */
  delete: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);
      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "DRAFT")
        return res
          .status(400)
          .json({ message: "Only draft payroll can be deleted" });

      await payroll.deleteOne();

      res.json({ message: "Payroll deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /*
  -----------------------------------
  Download Payslip PDF
  -----------------------------------
  */
  downloadPayslip: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);
      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      // Ownership check for employees
      if (req.employee && payroll.employeeId.toString() !== req.employee._id.toString()) {
        return res.status(403).json({ message: "Unauthorized access to this payslip" });
      }

      // Status check
      if (payroll.status !== "PAID") {
        return res.status(400).json({ message: "Payslip not available until salary is marked as PAID" });
      }

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=payslip_${payroll.month}_${payroll.year}.pdf`);

      // Generate and stream PDF
      generatePayslipPDF(payroll, res);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
