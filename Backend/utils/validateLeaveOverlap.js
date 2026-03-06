import LeaveApplication from "../models/LeaveApplication.model.js";

export const checkLeaveOverlap = async(employeeId,startDate,endDate)=>{

const overlap=await LeaveApplication.findOne({
employeeId,
status:{$in:["Pending","Approved"]},
$or:[
{
startDate:{$lte:endDate},
endDate:{$gte:startDate}
}
]
});

return overlap;

};