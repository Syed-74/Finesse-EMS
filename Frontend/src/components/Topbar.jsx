const Topbar = ({ toggleSidebar }) => {
  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden text-2xl font-semibold focus:outline-none"
        >
          ☰
        </button>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-semibold text-gray-800">
          Employee Management System
        </h3>

        {/* Right side (optional future profile/logout) */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm text-gray-500">Welcome</span>
          <div className="w-8 h-8 rounded-full bg-indigo-500"></div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
