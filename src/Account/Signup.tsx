import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormControl, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser, setLoading, setError, clearError } from "./reducer";
import axiosWithCredentials from "../client";
import type { RootState, AppDispatch } from "../store";
import "./auth.css";

interface SignupForm {
    username?: string;
    password?: string;
    confirmPassword?: string;
    email?: string;
    identity?: string;
}

export default function Signup() {
    const [user, setUser] = useState<SignupForm>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { loading } = useSelector((state: RootState) => state.account);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!user.username?.trim()) {
            newErrors.username = "Username is required";
        } else if (user.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        }

        if (!user.email?.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!user.identity) {
            newErrors.identity = "Please select your identity";
        }

        if (!user.password) {
            newErrors.password = "Password is required";
        }

        if (!user.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (user.password !== user.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const signup = async () => {
        if (!validateForm()) {
            return;
        }

        dispatch(setLoading(true));
        dispatch(clearError());

        try {
            const response = await axiosWithCredentials.post('/api/users/signup', {
                username: user.username,
                email: user.email,
                password: user.password,
                role: user.identity, // Map identity to role for backend
            });

            console.log("Registration successful", response.data);
            dispatch(setCurrentUser(response.data));
            navigate('/home');

        } catch (error: any) {
            console.error("Registration error:", error);

            let errorMessage = 'Registration failed';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = 'Network error. Please try again.';
            }

            dispatch(setError(errorMessage));
            setErrors({ general: errorMessage });
            // DO NOT auto-redirect on error - let user see the error and try again
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleInputChange = (field: keyof SignupForm, value: string) => {
        setUser({ ...user, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    return (
        <div className="auth-container signup">
            <div className="wd-signup-screen auth-form">
                <div className="auth-header">
                    <h1 className="auth-title">Join us today</h1>
                    <p className="auth-subtitle">Create your new account</p>
                </div>

                {errors.general && (
                    <div className="alert alert-danger" role="alert">
                        {errors.general}
                    </div>
                )}

                <div className="auth-field">
                    <label className="auth-label">
                        Username <span className="required">*</span>
                    </label>
                    <FormControl
                        value={user.username ?? ""}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Choose a username"
                        className={`auth-input signup ${errors.username ? 'is-invalid' : ''}`}
                        autoComplete="username"
                        required
                    />
                    {errors.username && (
                        <div className="invalid-feedback d-block">
                            {errors.username}
                        </div>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        Email Address <span className="required">*</span>
                    </label>
                    <FormControl
                        type="email"
                        value={user.email ?? ""}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        className={`auth-input signup ${errors.email ? 'is-invalid' : ''}`}
                        autoComplete="email"
                        required
                    />
                    {errors.email && (
                        <div className="invalid-feedback d-block">
                            {errors.email}
                        </div>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        Identity <span className="required">*</span>
                    </label>
                    <FormControl
                        as="select"
                        value={user.identity ?? ""}
                        onChange={(e) => handleInputChange('identity', e.target.value)}
                        className={`auth-input signup ${errors.identity ? 'is-invalid' : ''}`}
                        required
                    >
                        <option value="">Select your identity</option>
                        <option value="reader">Reader</option>
                        <option value="writer">Writer</option>
                        <option value="admin">Admin</option>
                    </FormControl>
                    {errors.identity && (
                        <div className="invalid-feedback d-block">
                            {errors.identity}
                        </div>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        Password <span className="required">*</span>
                    </label>
                    <FormControl
                        value={user.password ?? ""}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a password"
                        type="password"
                        className={`auth-input signup ${errors.password ? 'is-invalid' : ''}`}
                        autoComplete="new-password"
                        required
                    />
                    {errors.password && (
                        <div className="invalid-feedback d-block">
                            {errors.password}
                        </div>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        Confirm Password <span className="required">*</span>
                    </label>
                    <FormControl
                        value={user.confirmPassword ?? ""}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        type="password"
                        className={`auth-input signup ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        autoComplete="new-password"
                        required
                    />
                    {errors.confirmPassword && (
                        <div className="invalid-feedback d-block">
                            {errors.confirmPassword}
                        </div>
                    )}
                </div>

                <Button
                    onClick={signup}
                    className="auth-button signup"
                    disabled={loading}
                >
                    {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="auth-links">
                    <span className="auth-text">
                        Already have an account?{" "}
                    </span>
                    <Link
                        className="wd-signin-link auth-link signup"
                        to="/Account/Signin"
                    >
                        Sign in
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