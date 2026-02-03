// import React from "react";

// const AdminDashboard = () => {
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white p-6 rounded-xl shadow">
//           <p className="text-gray-500">Total Employees</p>
//           <h2 className="text-3xl font-bold">42</h2>
//         </div>

//         <div className="bg-white p-6 rounded-xl shadow">
//           <p className="text-gray-500">Pending Leaves</p>
//           <h2 className="text-3xl font-bold">5</h2>
//         </div>

//         <div className="bg-white p-6 rounded-xl shadow">
//           <p className="text-gray-500">Today Attendance</p>
//           <h2 className="text-3xl font-bold">38</h2>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;
import React from "react";

const AdminDashboard = () => {
  const stats = [
    { label: "Total Employees", value: "114", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Monthly Payroll", value: "₹25,541", color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Leaves", value: "5", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;