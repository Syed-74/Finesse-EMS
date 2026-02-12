import React from "react";

/**
 * ProfileAvatar Component
 * 
 * Reusable component to render employee/admin profile images with consistent styling and fallback logic.
 * 
 * Props:
 * @param {Object} user - The user object (admin or employee) containing firstName, lastName, and profileImage.
 * @param {string} className - Optional additional CSS classes.
 * @param {boolean} showStatus - Optional indicator to show online status (future proofing).
 * @param {string} uploadPath - Base URL for uploads. Defaults to http://localhost:5000.
 */
const ProfileAvatar = ({ user, className = "", showStatus = false, uploadPath = "http://localhost:5000" }) => {
    // Construct image URL safely
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        // Remove double slashes if path starts with slash
        return `${uploadPath}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const imageUrl = getImageUrl(user?.profileImage);
    const initials = user?.firstName ? user.firstName[0].toUpperCase() : "U";

    // Color generation based on name for fallback
    const getFallbackColor = () => {
        const colors = ["bg-indigo-600", "bg-emerald-600", "bg-rose-600", "bg-cyan-600", "bg-amber-600", "bg-purple-600"];
        if (!user?.firstName) return "bg-gray-400";
        const charCode = user.firstName.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <div className={`
        relative overflow-hidden rounded-full border border-white shadow-sm transition-all
        ${className.includes("w-") ? "" : "w-10 h-10"} 
        ${imageUrl ? "bg-gray-100" : getFallbackColor()}
      `}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none'; // Hide broken image
                            e.target.parentElement.classList.add(getFallbackColor()); // Add color to parent
                            e.target.parentElement.setAttribute("data-fallback", initials); // Fallback trick if needed, or we rely on the logic below
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold uppercase select-none">
                        {initials}
                    </div>
                )}
            </div>

            {/* Online Status Indicator (Optional) */}
            {showStatus && (
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            )}
        </div>
    );
};

export default ProfileAvatar;
