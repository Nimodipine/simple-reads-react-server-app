import { Button, Form } from "react-bootstrap";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser, setLoading, setError, clearError } from "./reducer";
import "./auth.css";
import type { AppDispatch, RootState } from "../store";
import axiosWithCredentials from '../client';


export default function Signin() {
    const [credentials, setCredentials] = useState<{ username?: string; password?: string }>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    const { error } = useSelector((state: RootState) => state.account);

    // Get the return URL from navigation state
    const returnTo = location.state?.returnTo;
    const bookTitle = location.state?.bookTitle;

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
            console.log('Attempting to signin with:', credentials.username);

            const response = await axiosWithCredentials.post('/api/users/signin', {
                username: credentials.username,
                password: credentials.password,
            });

            console.log("Sign in successful", response.data);
            dispatch(setCurrentUser(response.data));

            // Navigate back to the book page if returnTo exists, otherwise go to home
            if (returnTo) {
                console.log('Redirecting back to:', returnTo);
                navigate(returnTo);
            } else {
                navigate('/home');
            }

        } catch (error: any) {
            console.error("Sign in error:", error);

            let errorMessage = 'Sign in failed';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Invalid username or password';
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = 'Network error. Please check if the server is running.';
            }

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
                    <p className="auth-subtitle">
                        {returnTo && bookTitle
                            ? `Sign in to view "${bookTitle}" and access all features`
                            : "Sign in to your account"
                        }
                    </p>
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
                    <Link
                        to={returnTo || "/home"}
                        className="auth-back-link"
                    >
                        ← Back to {returnTo ? "book" : "home"}
                    </Link>
                </div>
            </div>
        </div>
    );
}