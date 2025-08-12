import { Button, Form } from "react-bootstrap";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser, setLoading, setError, clearError } from "./reducer";
import "./auth.css";

export default function Signin() {
    const [credentials, setCredentials] = useState<{ username?: string; password?: string }>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { error } = useSelector((state: any) => state.account);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!credentials.username?.trim()) {
            newErrors.username = "Username is required";
        }

        if (!credentials.password?.trim()) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const signin = async () => {
        if (!validateForm()) {
            return;
        }

        dispatch(setLoading(true));
        dispatch(clearError());

        try {
            const response = await fetch('/api/users/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for session cookies
                body: JSON.stringify({
                    username: credentials.username,
                    password: credentials.password,
                }),
            });

            if (response.ok) {
                const userData = await response.json();
                console.log("Sign in successful", userData);

                // Update Redux store with user data
                dispatch(setCurrentUser(userData));

                // Navigate to home or dashboard
                navigate('/home');
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Sign in failed';
                dispatch(setError(errorMessage));
                setErrors({ general: errorMessage });
            }
        } catch (error) {
            console.error("Sign in error:", error);
            const errorMessage = 'Network error. Please try again.';
            dispatch(setError(errorMessage));
            setErrors({ general: errorMessage });
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleInputChange = (field: 'username' | 'password', value: string) => {
        setCredentials({ ...credentials, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    return (
        <div className="auth-container signin">
            <div id="wd-signin-screen" className="auth-form">
                <div className="auth-header">
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>

                {(errors.general || error) && (
                    <div className="alert alert-danger" role="alert">
                        {errors.general || error}
                    </div>
                )}

                <div className="auth-field">
                    <label className="auth-label">Username</label>
                    <Form.Control
                        value={credentials.username ?? ""}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        id="wd-username"
                        placeholder="Enter your username"
                        className={`auth-input signin ${errors.username ? 'is-invalid' : ''}`}
                        autoComplete="username"
                    />
                    {errors.username && (
                        <div className="invalid-feedback d-block">
                            {errors.username}
                        </div>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <Form.Control
                        value={credentials.password ?? ""}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        id="wd-password"
                        placeholder="Enter your password"
                        type="password"
                        className={`auth-input signin ${errors.password ? 'is-invalid' : ''}`}
                        autoComplete="current-password"
                    />
                    {errors.password && (
                        <div className="invalid-feedback d-block">
                            {errors.password}
                        </div>
                    )}
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