import { Button, Navbar } from "react-bootstrap";
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

export default function Header({ isLoggedIn, onLogOut }: HeaderProps) {
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            // Call the backend signout endpoint
            const response = await fetch('/api/users/signout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                // Call the optional onLogOut callback if provided
                if (onLogOut) {
                    onLogOut();
                }
                // Navigate to home page after signout
                navigate('/home');
            } else {
                console.error('Signout failed');
            }
        } catch (error) {
            console.error('Error during signout:', error);
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