import { Button, Dropdown, Image, Navbar } from "react-bootstrap";
import { FaBell, FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export interface HeaderProps {
    isLoggedIn: boolean;
    user?: {
        name: string;
        handle: string;
        avatarUrl?: string;
    };
    onLogOut?: () => void;
}

export default function Header({ isLoggedIn, user, onLogOut }: HeaderProps) {
    const navigate = useNavigate();

    return (
        <Navbar className="top-header" expand="lg" fixed="top">
            <div className="header-content">
                {/* Left side - Logo/Brand */}
                <div className="header-left">
                    <Navbar.Brand href="/home" className="brand-logo">
                        <strong>SimpleReads</strong>
                    </Navbar.Brand>
                </div>

                {/* Right side - Auth or User Menu */}
                <div className="header-right">
                    {isLoggedIn ? (
                        <div className="d-flex align-items-center gap-3">
                            {/* Notifications */}
                            <Button variant="ghost" size="sm" className="icon-btn" aria-label="Messages">
                                <FaEnvelope />
                            </Button>
                            <Button variant="ghost" size="sm" className="icon-btn" aria-label="Notifications">
                                <FaBell />
                            </Button>

                            {/* User Dropdown */}
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    as="div"
                                    className="user-menu-toggle d-flex align-items-center gap-2"
                                    role="button"
                                >
                                    <Image
                                        roundedCircle
                                        src={user?.avatarUrl || "https://placehold.co/32x32"}
                                        alt={`${user?.name || "User"}'s avatar`}
                                        width={32}
                                        height={32}
                                        className="user-avatar"
                                    />
                                    <div className="user-info d-none d-md-block">
                                        <div className="user-name">{user?.name || "User"}</div>
                                        <div className="user-handle">@{user?.handle || "user"}</div>
                                    </div>
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Item href="/profile">Profile</Dropdown.Item>
                                    <Dropdown.Item href="/settings">Settings</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={onLogOut}>Log out</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    ) : (
                        <div className="auth-buttons d-flex gap-2">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate("/Account/Signin")}
                                aria-label="Sign in"
                            >
                                Sign in
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate("/Account/Signup")}
                                aria-label="Sign up"
                            >
                                Sign up
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Navbar>
    );
}

