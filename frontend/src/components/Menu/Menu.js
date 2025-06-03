import React from "react";
import { GoHomeFill } from "react-icons/go";
import { MdBusinessCenter } from "react-icons/md";
import { BiSolidParty } from "react-icons/bi";
import { GiHealthNormal } from "react-icons/gi";
import { AiFillExperiment } from "react-icons/ai";
import { MdSportsBasketball } from "react-icons/md";
import "./Menu.css";

const categoryIcons = {
  Business: <MdBusinessCenter className="menu-icon" size={22} />,
  Entertainment: <BiSolidParty className="menu-icon" size={22} />,
  Health: <GiHealthNormal className="menu-icon" size={22} />,
  Science: <AiFillExperiment className="menu-icon" size={22} />,
  Sport: <MdSportsBasketball className="menu-icon" size={22} />,
};

function Menu({ onSelectMenu }) {
  const newsCategories = [
    "Business",
    "Entertainment",
    "Health",
    "Science",
    "Sport",
  ];

  const handleCategorySelect = (category) => {
    onSelectMenu(category.toLowerCase());
  };

  return (
    <menu>
      <ul id="mainMenu">
        <li
          className="menu-item clickable"
          onClick={() => onSelectMenu("home")}
        >
          <GoHomeFill className="menu-icon" size={22} />
          <span className="menu-label">Home</span>
        </li>
        {newsCategories.map((category, index) => (
          <li
            key={index}
            className="menu-item clickable"
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
