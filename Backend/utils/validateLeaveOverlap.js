import LeaveApplication from "../models/LeaveApplication.model.js";

export const checkLeaveOverlap = async (employeeId, startDate, endDate, isHalfDay = false, half = null) => {
  const overlap = await LeaveApplication.findOne({
    employeeId,
    status: { $in: ["Pending", "Approved"] },
    $and: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      },
      {
        $or: [
          // Case 1: Existing Full Day leave on these dates always overlaps
          { type: "Full Day" },
          // Case 2: If we are applying for a Full Day, and any Half Day exists on these dates, it overlaps
          { $expr: { $eq: [isHalfDay, false] } },
          // Case 3: Both are Half Days on the SAME date - overlap ONLY if same half
          {
            $and: [
              { type: "Half Day" },
              { half: half } // Same half (First/Second)
            ]
          }
        ]
      }
    ]
  });

  return overlap;
};