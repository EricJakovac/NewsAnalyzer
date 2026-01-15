import React, { useState, useEffect, useRef } from "react";
import { GoHomeFill } from "react-icons/go";
import { MdBusinessCenter } from "react-icons/md";
import { BiSolidParty } from "react-icons/bi";
import { GiHealthNormal } from "react-icons/gi";
import { AiFillExperiment } from "react-icons/ai";
import { MdSportsBasketball } from "react-icons/md";
import { MdPublic } from "react-icons/md";
import { FaComputer } from "react-icons/fa6";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { FaSignInAlt } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";
import "./Menu.css";

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
  const [showProfileCard, setShowProfileCard] = useState(false);
  const profileRef = useRef(null);

  const newsCategories = [
    "General",
    "Business",
    "Entertainment",
    "Health",
    "Science",
    "Sports",
    "Technology",
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileCard(false);
      }
    };
    if (showProfileCard) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileCard]);

  const isActive = (menuItem) =>
    menuItem === "home"
      ? selectedMenu === "home"
      : selectedMenu === menuItem.toLowerCase();

  return (
    <menu className={isCollapsed ? "collapsed" : ""}>
      <ul id="mainMenu">
        <li
          className="menu-item clickable menu-toggle"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? <GiHamburgerMenu size={22} /> : <IoClose size={22} />}
          {!isCollapsed && <span className="menu-label">Menu</span>}
        </li>

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
          <li
            className="user-section-wrapper"
            ref={profileRef}
            style={{ position: "relative" }}
          >
            <div
              className={`menu-item clickable ${
                showProfileCard ? "active" : ""
              }`}
              onClick={() => setShowProfileCard(!showProfileCard)}
            >
              {user.picture ? (
                <img src={user.picture} alt="User" className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.name?.charAt(0)}
                </div>
              )}
              {!isCollapsed && <span className="menu-label">{user.name}</span>}
            </div>

            {showProfileCard && (
              <>
                {/* Ovaj div će CSS sakriti na desktopu, a prikazati na mobitelu */}
                <div
                  className="mobile-overlay-backdrop"
                  onClick={() => setShowProfileCard(false)}
                />

                <div className="user-profile-card">
                  <div className="card-header">
                    <img src={user.picture} alt="User" />
                    <div>
                      <p className="user-card-name">{user.name}</p>
                      <p className="user-card-email">
                        {user.email || "Google Account"}
                      </p>
                    </div>
                  </div>
                  <hr className="menu-divider" />
                  <button
                    className="card-logout-btn"
                    onClick={() => {
                      onLogout();
                      setShowProfileCard(false);
                    }}
                  >
                    <FaSignOutAlt size={14} /> Odjavi se
                  </button>
                </div>
              </>
            )}
          </li>
        )}

        {user && (
          <>
            <li
              className={`menu-item clickable ${
                selectedMenu === "analytics" ? "active" : ""
              }`}
              onClick={() => onSelectMenu("analytics")}
            >
              <IoStatsChart className="menu-icon" size={22} />
              {!isCollapsed && <span className="menu-label">Analytics</span>}
            </li>

            <li
              className={`menu-item clickable ${
                selectedMenu === "recommendation" ? "active" : ""
              }`}
              onClick={() => onSelectMenu("recommendation")}
            >
              <HiSparkles className="menu-icon" size={22} />
              {!isCollapsed && <span className="menu-label">Recommendations</span>}
            </li>
          </>
        )}

        <li
          className={`menu-item clickable ${isActive("home") ? "active" : ""}`}
          onClick={() => onSelectMenu("home")}
        >
          <GoHomeFill className="menu-icon" size={22} />
          {!isCollapsed && <span className="menu-label">Home</span>}
        </li>

        {newsCategories.map((cat, i) => (
          <li
            key={i}
            className={`menu-item clickable ${isActive(cat) ? "active" : ""}`}
            onClick={() => onSelectMenu(cat.toLowerCase())}
          >
            {categoryIcons[cat]}
            {!isCollapsed && <span className="menu-label">{cat}</span>}
          </li>
        ))}
      </ul>
    </menu>
  );
}

export default Menu;
