import { Button, Form } from "react-bootstrap";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./auth.css"; // Import the CSS file

export default function Signin() {
    const [credentials, setCredentials] = useState<{ username?: string; password?: string }>({});

    const signin = () => {
        // Just a placeholder - no actual functionality
        console.log("Sign in clicked", credentials);
    };

    return (
        <div className="auth-container signin">
            <div id="wd-signin-screen" className="auth-form">
                <div className="auth-header">
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>

                <div className="auth-field">
                    <label className="auth-label">Username</label>
                    <Form.Control
                        value={credentials.username ?? ""}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        id="wd-username"
                        placeholder="Enter your username"
                        className="auth-input signin"
                        autoComplete="username"
                    />
                </div>

                <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <Form.Control
                        value={credentials.password ?? ""}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        id="wd-password"
                        placeholder="Enter your password"
                        type="password"
                        className="auth-input signin"
                        autoComplete="current-password"
                    />
                </div>

                <Button
                    onClick={signin}
                    id="wd-signin-btn"
                    className="auth-button signin"
                >
                    Sign in
                </Button>

                <div className="auth-links">
                    <span className="auth-text">
                        Don't have an account?{" "}
                    </span>
                    <Link
                        id="wd-signup-link"
                        to="/Account/Signup"
                        className="auth-link signin"
                    >
                        Sign up
                    </Link>
                </div>

                <div className="auth-links">
                    <Link to="/home" className="auth-back-link">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}