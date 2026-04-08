
import Attendance from "../models/attendance.model.js";
import Leave from "../models/LeaveApplication.model.js";
import Employee from "../models/Employee.model.js";
import moment from "moment";

/* =========================
   GET DASHBOARD SUMMARY (TODAY)
========================= */
export const getDashboardSummary = async (req, res) => {
    try {
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();
        const startOfMonth = moment().startOf('month').toDate();

        // 1. Total Employees
        const totalEmployees = await Employee.countDocuments({ deletedAt: null, isActive: true });

        // 2. Attendance Stats for Today
        const attendanceToday = await Attendance.find({
            date: { $gte: todayStart, $lte: todayEnd }
        });

        const presentToday = attendanceToday.filter(a => a.status === "Present" || a.status === "Half Day").length;
        const lateArrivals = attendanceToday.filter(a => a.lateBy > 0).length;

        // 3. Leaves Today
        // Assuming leave requests store dates. We need to check if today falls in any approved leave range.
        // Simplifying: approximate by counting leaves with status "Approved" and matching date (if single date stored)
        // Real implementation would range query. Let's assume 'startDate' and 'endDate' in Leave model.
        // If leave model structure is complex, we adjust. Based on context, let's assume simple count for now or better query.
        // Let's use aggregation for broader stats if needed, or simple find.
        // Checking Leave model structure from context... it has 'fromDate' and 'toDate'.

        const onLeaveToday = await Leave.countDocuments({
            status: "Approved",
            fromDate: { $lte: todayEnd },
            toDate: { $gte: todayStart }
        });

        const absentToday = totalEmployees - presentToday - onLeaveToday;
        // Logic: Total - Present - OnLeave = Absent (approximately, ignores suspended etc)

        // 4. Monthly Attendance %
        // Total expected man-days = Total Employees * Work Days passed in month
        // Actual present
        // Simplified: Average present count per day / Total Employees

        // Aggregation for monthly trend
        const monthlyStats = await Attendance.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            { $group: { _id: null, totalPresent: { $sum: 1 } } }
        ]);

        const daysPassed = moment().diff(startOfMonth, 'days') + 1;
        // Removing weekends from calculation would be more accurate but let's stick to simple
        const grossAttendancePct = totalEmployees > 0 ? ((monthlyStats[0]?.totalPresent || 0) / (totalEmployees * daysPassed)) * 100 : 0;


        res.json({
            totalEmployees,
            presentToday,
            absentToday: Math.max(0, absentToday),
            onLeaveToday,
            lateArrivals,
            monthlyAttendancePct: Math.round(grossAttendancePct)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

/* =========================
   GET ATTENDANCE TRENDS (CHART)
========================= */
export const getAttendanceTrends = async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        // range: 'week' or 'month'

        let startDate;
        if (range === 'week') startDate = moment().subtract(7, 'days').toDate();
        else startDate = moment().startOf('month').toDate();

        const trends = await Attendance.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    present: {
                        $sum: { $cond: [{ $in: ["$status", ["Present", "Half Day"]] }, 1, 0] }
                    },
                    abscent: {
                        $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] }
                    },
                    late: {
                        $sum: { $cond: [{ $gt: ["$lateBy", 0] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(trends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   GET DEPARTMENT STATS
========================= */
export const getDepartmentStats = async (req, res) => {
    try {
        // 1. Get Employee Distribution
        const deptCounts = await Employee.aggregate([
            { $match: { deletedAt: null, isActive: true } },
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);

        // 2. Get Today's Attendance by Dept
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        const attendanceByDept = await Attendance.aggregate([
            { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
            {
                $lookup: {
                    from: "employees",
                    localField: "employee",
                    foreignField: "_id",
                    as: "emp"
                }
            },
            { $unwind: "$emp" },
            {
                $group: {
                    _id: "$emp.department",
                    present: {
                        $sum: { $cond: [{ $in: ["$status", ["Present", "Half Day"]] }, 1, 0] }
                    },
                    late: {
                        $sum: { $cond: [{ $gt: ["$lateBy", 0] }, 1, 0] }
                    }
                }
            }
        ]);

        // Merge Data
        const stats = deptCounts.map(d => {
            const att = attendanceByDept.find(a => a._id === d._id) || { present: 0, late: 0 };
            const presentPct = Math.round((att.present / d.count) * 100);
            return {
                department: d._id || "Unassigned",
                totalEmployees: d.count,
                presentCount: att.present,
                presentPct: isNaN(presentPct) ? 0 : presentPct,
                lateCount: att.late
            }
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   GET LEAVE ANALYTICS
========================= */
export const getLeaveAnalytics = async (req, res) => {
    try {
        const startOfMonth = moment().startOf('month').toDate();

        const leaveStats = await Leave.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: "$leaveType",
                    count: { $sum: 1 },
                    approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } }
                }
            }
        ]);

        const statusSummary = await Leave.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({ typeDistribution: leaveStats, statusDistribution: statusSummary });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
