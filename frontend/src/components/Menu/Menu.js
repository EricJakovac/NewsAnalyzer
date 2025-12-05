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

const categoryIcons = {
  General: <MdPublic className="menu-icon" size={22} />,
  Business: <MdBusinessCenter className="menu-icon" size={22} />,
  Entertainment: <BiSolidParty className="menu-icon" size={22} />,
  Health: <GiHealthNormal className="menu-icon" size={22} />,
  Science: <AiFillExperiment className="menu-icon" size={22} />,
  Sports: <MdSportsBasketball className="menu-icon" size={22} />,
  Technology: <FaComputer className="menu-icon" size={22} />,
};

function Menu({ onSelectMenu, selectedMenu, isCollapsed, setIsCollapsed }) {
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
