import { Nav } from "react-bootstrap";
import { NavLink, } from "react-router-dom";
import { FaHome, FaUser, FaSearch, FaUsers } from "react-icons/fa";

/**
 * Left-rail navigation used by Home. Vertical layout with spacing.
 */
export default function Navigation() {

    const links = [
        { label: "Home", path: "/home", icon: FaHome, className: "nav-item-home", iconClassName: "icon-home" },
        { label: "Search", path: "/search", icon: FaSearch, className: "nav-item-search", iconClassName: "icon-search" },
        { label: "Profile", path: "/Account/Profile", icon: FaUser, className: "nav-item-profile", iconClassName: "icon-profile" },
        { label: "Users", path: "/users", icon: FaUsers, className: "nav-item-users", iconClassName: "icon-users" },
    ];

    return (
        <nav aria-label="Primary" className="navigation">
            <Nav className="flex-column dashboard-nav p-3" variant="pills">
                {links.map((link) => {
                    const IconComponent = link.icon;
                    return (
                        <Nav.Link
                            key={link.path}
                            as={NavLink}
                            to={link.path}
                            className={`${link.className} d-flex align-items-center gap-2`}
                            aria-label={link.label}
                            end={link.path === "/home"}
                        >
                            <IconComponent className={link.iconClassName} aria-hidden />
                            <span className="nav-label">{link.label}</span>
                        </Nav.Link>
                    );
                })}
            </Nav>
        </nav>
    );
}