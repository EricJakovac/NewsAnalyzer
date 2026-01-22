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

// MenuItem komponenta - DODANO sve potrebne klase i isCollapsed
const MenuItem = ({
  label,
  menu,
  selected,
  onClick,
  icon,
  user,
  isCollapsed,
}) => {
  const sessionId = localStorage.getItem("news_session_id") || "no_session";
  const trackCategoryClick = async () => {
    onClick(menu);

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "category_click",
          category: menu,
          page: menu === "home" ? "/" : `/${menu}`,
          user_id: user?.id || user?.sub || "anonymous",
          session_id: sessionId || "no_session",
          flow_type: "direct_navigation",
          device: window.innerWidth < 768 ? "mobile" : "desktop",
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(`[Analytics] Tracked category click: ${menu}`);
    } catch (err) {
      console.error("Error tracking category click:", err);
    }
  };

  return (
    <li className={`menu-item clickable ${selected ? "active" : ""}`}>
      <button onClick={trackCategoryClick} className="menu-button">
        <span className="menu-icon">{icon}</span>
        {!isCollapsed && <span className="menu-label">{label}</span>}
      </button>
    </li>
  );
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

  return (
    <menu className={isCollapsed ? "collapsed" : ""}>
      <ul id="mainMenu">
        {/* MENU TOGGLE */}
        <li
          className="menu-item clickable menu-toggle"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? <GiHamburgerMenu size={22} /> : <IoClose size={22} />}
          {!isCollapsed && <span className="menu-label">Menu</span>}
        </li>

        {/* LOGIN/LOGOUT */}
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
                    <FaSignOutAlt size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </li>
        )}

        {user && (
          <>
            {/* ANALYTICS */}
            <MenuItem
              label="Analytics"
              menu="analytics"
              selected={selectedMenu === "analytics"}
              onClick={onSelectMenu}
              icon={<IoStatsChart className="menu-icon" size={22} />}
              user={user}
              isCollapsed={isCollapsed} // DODANO
            />

            {/* RECOMMENDATIONS */}
            <MenuItem
              label="Recommendations"
              menu="recommendation"
              selected={selectedMenu === "recommendation"}
              onClick={onSelectMenu}
              icon={<HiSparkles className="menu-icon" size={22} />}
              user={user}
              isCollapsed={isCollapsed} // DODANO
            />
          </>
        )}

        {/* HOME */}
        <MenuItem
          label="Home"
          menu="home"
          selected={selectedMenu === "home"}
          onClick={onSelectMenu}
          icon={<GoHomeFill className="menu-icon" size={22} />}
          user={user}
          isCollapsed={isCollapsed} // DODANO
        />

        {/* NEWS CATEGORIES */}
        {newsCategories.map((cat, i) => (
          <MenuItem
            key={i}
            label={cat}
            menu={cat.toLowerCase()}
            selected={selectedMenu === cat.toLowerCase()}
            onClick={onSelectMenu}
            icon={categoryIcons[cat]}
            user={user}
            isCollapsed={isCollapsed} // DODANO
          />
        ))}
      </ul>
    </menu>
  );
}

export default Menu;
