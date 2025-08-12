import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormControl, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser, setLoading, setError, clearError } from "./reducer";
import type { RootState, AppDispatch } from "../store";
import "./auth.css";

const API_BASE_URL = import.meta.env.VITE_REMOTE_SERVER || 'http://localhost:4000';

interface SignupForm {
    username?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
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

        // Required field validations
        if (!user.firstName?.trim()) {
            newErrors.firstName = "First name is required";
        } else if (user.firstName.length < 2) {
            newErrors.firstName = "First name must be at least 2 characters";
        }

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

        if (!user.phone?.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(user.phone.replace(/[\s\-\(\)]/g, ""))) {
            newErrors.phone = "Please enter a valid phone number";
        }

        if (!user.dateOfBirth) {
            newErrors.dateOfBirth = "Date of birth is required";
        } else {
            const birthDate = new Date(user.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 13) {
                newErrors.dateOfBirth = "You must be at least 13 years old to register";
            }
        }

        if (!user.identity) {
            newErrors.identity = "Please select your identity";
        }

        if (!user.password) {
            newErrors.password = "Password is required";
        } else if (user.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
            newErrors.password = "Password must contain uppercase, lowercase, and number";
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
            const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: user.username,
                    email: user.email,
                    password: user.password,
                    firstName: user.firstName,
                    phone: user.phone,
                    dateOfBirth: user.dateOfBirth,
                    role: user.identity, // Map identity to role for backend
                }),
            });

            if (response.ok) {
                const userData = await response.json();
                console.log("Registration successful", userData);

                // Update Redux store with user data
                dispatch(setCurrentUser(userData));

                // Navigate to home or dashboard
                navigate('/home');
            } else {
                const error = await response.json();
                dispatch(setError(error.message || 'Registration failed'));
                setErrors({ general: error.message || 'Registration failed' });
            }
        } catch (error) {
            console.error("Registration error:", error);
            const errorMessage = 'Network error. Please try again.';
            dispatch(setError(errorMessage));
            setErrors({ general: errorMessage });
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
                        First Name <span className="required">*</span>
                    </label>
                    <FormControl
                        value={user.firstName ?? ""}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter your first name"
                        className={`auth-input signup ${errors.firstName ? 'is-invalid' : ''}`}
                        autoComplete="given-name"
                        required
                    />
                    {errors.firstName && (
                        <div className="invalid-feedback d-block">
                            {errors.firstName}
                        </div>
                    )}
                </div>

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
                        Phone Number <span className="required">*</span>
                    </label>
                    <FormControl
                        type="tel"
                        value={user.phone ?? ""}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className={`auth-input signup ${errors.phone ? 'is-invalid' : ''}`}
                        autoComplete="tel"
                        required
                    />
                    {errors.phone && (
                        <div className="invalid-feedback d-block">
                            {errors.phone}
                        </div>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        Date of Birth <span className="required">*</span>
                    </label>
                    <FormControl
                        type="date"
                        value={user.dateOfBirth ?? ""}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className={`auth-input signup ${errors.dateOfBirth ? 'is-invalid' : ''}`}
                        autoComplete="bday"
                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                        required
                    />
                    {errors.dateOfBirth && (
                        <div className="invalid-feedback d-block">
                            {errors.dateOfBirth}
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
                    <br />
                    <small className="form-text text-muted">
                        Password must be at least 8 characters with uppercase, lowercase, and number
                    </small>
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