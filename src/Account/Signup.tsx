import { useState } from "react";
import { Link } from "react-router-dom";
import { FormControl, Button } from "react-bootstrap";
import "./auth.css"; // Import the CSS file

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
    const [loading, setLoading] = useState(false);

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

        setLoading(true);

        try {
            // Store user data in localStorage for demo purposes
            // In a real app, this would be handled by your backend and authentication system
            const userData = {
                id: 'user123',
                username: user.username,
                displayName: user.firstName, // Use firstName as displayName
                firstName: user.firstName,
                email: user.email,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                identity: user.identity,
                bio: '', // Empty bio initially
                interests: [],
                isVerified: true, // Set to true since they selected an identity
                isOnline: true,
                createdAt: new Date().toISOString()
            };

            // Store in localStorage
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true');

            console.log("Registration successful", userData);

            // TODO: Replace with actual API call
            /*
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user.username,
                    email: user.email,
                    password: user.password,
                    confirmPassword: user.confirmPassword,
                    phone: user.phone,
                    firstName: user.firstName,
                    dateOfBirth: user.dateOfBirth,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Registration successful", result);
                // TODO: Redirect to verification page or login
                // navigate('/verify-email');
            } else {
                const error = await response.json();
                setErrors({ general: error.message || 'Registration failed' });
            }
            */
        } catch (error) {
            console.error("Registration error:", error);
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
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