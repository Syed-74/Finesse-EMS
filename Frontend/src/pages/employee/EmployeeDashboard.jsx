// // import Layout from "../../components/Layout";

// // const EmployeeDashboard = () => {
// //   return (
// //     <Layout role="employee">
// //       <h2 className="text-2xl font-bold mb-4">Employee Dashboard</h2>

// //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //         <div className="bg-white p-4 rounded shadow">
// //           <p className="text-gray-500">Attendance</p>
// //           <h3 className="text-xl font-bold">Present</h3>
// //         </div>

// //         <div className="bg-white p-4 rounded shadow">
// //           <p className="text-gray-500">Leaves Remaining</p>
// //           <h3 className="text-xl font-bold">4</h3>
// //         </div>
// //       </div>
// //     </Layout>
// //   );
// // };

// // export default EmployeeDashboard;


// import React from "react";

// const EmployeeDashboard = () => {
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-white p-6 rounded-xl shadow">
//           <p className="text-gray-500">Today Status</p>
//           <h2 className="text-xl font-semibold text-green-600">
//             Checked In
//           </h2>
//         </div>

//         <div className="bg-white p-6 rounded-xl shadow">
//           <p className="text-gray-500">Leave Balance</p>
//           <h2 className="text-3xl font-bold">12</h2>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeDashboard;



const EmployeeDashboard = () => {
  const stats = [
    { label: "Present Days", value: "22", sub: "This Month" },
    { label: "Leaves Taken", value: "2", sub: "Annual Balance: 10" },
    { label: "Net Salary", value: "₹40,000", sub: "Last Paid: Jan 31" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back!</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-indigo-600">{stat.label}</p>
            <p className="text-4xl font-extrabold text-gray-800 my-2">{stat.value}</p>
            <p className="text-xs text-gray-400 font-medium tracking-tight">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


export default EmployeeDashboard;