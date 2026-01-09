import React from "react";
import { GoHomeFill } from "react-icons/go";
import { MdBusinessCenter } from "react-icons/md";
import { BiSolidParty } from "react-icons/bi";
import { GiHealthNormal } from "react-icons/gi";
import { AiFillExperiment } from "react-icons/ai";
import { MdSportsBasketball } from "react-icons/md";
import { MdPublic } from "react-icons/md";
import { FaComputer } from "react-icons/fa6";
import "./Menu.css";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { FaSignInAlt } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";

const categoryIcons = {
  General: <MdPublic className="menu-icon" size={22} />,
  Business: <MdBusinessCenter className="menu-icon" size={22} />,
  Entertainment: <BiSolidParty className="menu-icon" size={22} />,
  Health: <GiHealthNormal className="menu-icon" size={22} />,
  Science: <AiFillExperiment className="menu-icon" size={22} />,
  Sports: <MdSportsBasketball className="menu-icon" size={22} />,
  Technology: <FaComputer className="menu-icon" size={22} />,
};

function Menu({
  onSelectMenu,
  selectedMenu,
  isCollapsed,
  setIsCollapsed,
  user,
  onLogout,
}) {
  const newsCategories = [
    "General",
    "Business",
    "Entertainment",
    "Health",
    "Science",
    "Sports",
    "Technology", // Add this line
  ];

  const handleCategorySelect = (category) => {
    onSelectMenu(category.toLowerCase());
  };

  // Check if menu item is active
  const isActive = (menuItem) => {
    if (menuItem === "home") {
      return selectedMenu === "home";
    }
    return selectedMenu === menuItem.toLowerCase();
  };

  return (
    <menu className={isCollapsed ? "collapsed" : ""}>
      <ul id="mainMenu">
        {/* TOGGLE STAVKA */}
        <li
          className="menu-item clickable menu-toggle"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? (
            <GiHamburgerMenu className="menu-icon" size={22} />
          ) : (
            <IoClose className="menu-icon" size={22} />
          )}
          {!isCollapsed && <span className="menu-label">Menu</span>}
        </li>

        {/* DINAMIČKI AUTH ILI USER PROFILE */}
        {!user ? (
          <li
            className={`menu-item clickable ${
              selectedMenu === "auth" ? "active" : ""
            }`}
            onClick={() => onSelectMenu("auth")}
          >
            <FaSignInAlt className="menu-icon" size={22} />
            {!isCollapsed && <span className="menu-label">Login</span>}
          </li>
        ) : (
          <>
            {/* Prikaz korisnika */}
            <li className="menu-item user-profile">
              {user.picture ? (
                <img src={user.picture} alt="User" className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.name?.charAt(0)}
                </div>
              )}
              {!isCollapsed && <span className="menu-label">{user.name}</span>}
            </li>

            {/* Logout gumb */}
            <li className="menu-item clickable logout-item" onClick={onLogout}>
              <FaSignOutAlt className="menu-icon" size={22} color="#ff4d4d" />
              {!isCollapsed && <span className="menu-label">Logout</span>}
            </li>
          </>
        )}

        {/* HOME */}
        <li
          className={`menu-item clickable ${isActive("home") ? "active" : ""}`}
          onClick={() => onSelectMenu("home")}
        >
          <GoHomeFill className="menu-icon" size={22} />
          {!isCollapsed && <span className="menu-label">Home</span>}
        </li>

        {/* OSTALE KATEGORIJE */}
        {newsCategories.map((category, index) => (
          <li
            key={index}
            className={`menu-item clickable ${
              isActive(category) ? "active" : ""
            }`}
            onClick={() => handleCategorySelect(category)}
          >
            {categoryIcons[category]}
            {!isCollapsed && <span className="menu-label">{category}</span>}
          </li>
        ))}
      </ul>
    </menu>
  );
}

export default Menu;
