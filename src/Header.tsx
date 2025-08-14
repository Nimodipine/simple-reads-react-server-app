import { Button, Navbar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "./Account/reducer";
import type { AppDispatch } from "./store";

export interface HeaderProps {
    isLoggedIn: boolean;
    user?: {
        name: string;
        handle: string;
        avatarUrl?: string;
    };
}

const API_BASE_URL =
    import.meta.env.VITE_REMOTE_SERVER || "http://localhost:4000";

export default function Header({ isLoggedIn, user }: HeaderProps) {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const handleSignOut = async () => {
        try {
            // Call the backend signout endpoint
            const response = await fetch(`${API_BASE_URL}/api/users/signout`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok || response.status === 500) {
                // Clear Redux state regardless of response
                // (session might already be expired)
                dispatch(setCurrentUser(null));

                // Navigate to home page after signout
                navigate("/home");
            } else {
                console.error("Signout failed with status:", response.status);
                // Still clear local state even if server call fails
                dispatch(setCurrentUser(null));
                navigate("/home");
            }
        } catch (error) {
            console.error("Error during signout:", error);
            // Clear local state even on network error
            dispatch(setCurrentUser(null));
            navigate("/home");
        }
    };

    return (
        <Navbar className="top-header" expand="lg" fixed="top">
            <div className="header-content">
                {/* Left side - Logo/Brand */}
                <div className="header-left">
                    <Navbar.Brand href="/home" className="brand-logo">
                        <strong>SimpleReads</strong>
                    </Navbar.Brand>
                </div>

                {/* Right side - Auth Buttons */}
                <div className="header-right">
                    {isLoggedIn ? (
                        <div className="auth-buttons d-flex gap-2">
                            {user && (
                                <span className="navbar-text me-2">Welcome, {user.name}!</span>
                            )}
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={handleSignOut}
                                aria-label="Sign out"
                            >
                                Sign out
                            </Button>
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
