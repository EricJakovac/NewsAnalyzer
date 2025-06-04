import React from "react";
import { GoHomeFill } from "react-icons/go";
import { MdBusinessCenter } from "react-icons/md";
import { BiSolidParty } from "react-icons/bi";
import { GiHealthNormal } from "react-icons/gi";
import { AiFillExperiment } from "react-icons/ai";
import { MdSportsBasketball } from "react-icons/md";
import { MdPublic } from "react-icons/md"; // Example icon for General
import "./Menu.css";

const categoryIcons = {
  General: <MdPublic className="menu-icon" size={22} />,
  Business: <MdBusinessCenter className="menu-icon" size={22} />,
  Entertainment: <BiSolidParty className="menu-icon" size={22} />,
  Health: <GiHealthNormal className="menu-icon" size={22} />,
  Science: <AiFillExperiment className="menu-icon" size={22} />,
  Sports: <MdSportsBasketball className="menu-icon" size={22} />,
};

function Menu({ onSelectMenu, selectedMenu }) {
  const newsCategories = [
    "General",
    "Business",
    "Entertainment", 
    "Health",
    "Science",
    "Sports",
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
    <menu>
      <ul id="mainMenu">
        <li
          className={`menu-item clickable ${isActive("home") ? "active" : ""}`}
          onClick={() => onSelectMenu("home")}
        >
          <GoHomeFill className="menu-icon" size={22} />
          <span className="menu-label">Home</span>
        </li>
        {newsCategories.map((category, index) => (
          <li
            key={index}
            className={`menu-item clickable ${isActive(category) ? "active" : ""}`}
            onClick={() => handleCategorySelect(category)}
          >
            {categoryIcons[category]}
            <span className="menu-label">{category}</span>
          </li>
        ))}
      </ul>
    </menu>
  );
}

export default Menu;
