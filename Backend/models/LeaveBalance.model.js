import mongoose from "mongoose";

const LeaveBalanceSchema = new mongoose.Schema(
{
    employeeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Employee",
        required:true
    },

    leaveType:{
        type:String,
        required:true
    },

    totalAllocated:{
        type:Number,
        required:true
    },

    usedLeaves:{
        type:Number,
        default:0
    },

    remainingLeaves:{
        type:Number,
        required:true
    },

    year:{
        type:Number,
        required:true
    }
},
{timestamps:true}
);

export default mongoose.model("LeaveBalance",LeaveBalanceSchema);