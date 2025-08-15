import { Button, Navbar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "./Account/reducer";
import axiosWithCredentials from "./client";
import type { AppDispatch } from "./store";

export interface HeaderProps {
    isLoggedIn: boolean;
    user?: {
        name: string;
        handle: string;
        avatarUrl?: string;
    };
}

export default function Header({ isLoggedIn, user }: HeaderProps) {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const handleSignOut = async () => {
        try {
            // Call the backend signout endpoint
            await axiosWithCredentials.post('/api/users/signout');

            // Clear Redux state
            dispatch(setCurrentUser(null));
            navigate("/home");

        } catch (error: any) {
            console.error("Error during signout:", error);

            // Clear local state even on network error
            // (session might already be expired)
            dispatch(setCurrentUser(null));
            navigate("/home");
            // Don't show error to user for signout - just complete the action
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