import { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { FaUsers, FaTrash } from 'react-icons/fa';
import './UserManagement.css';

const API_BASE_URL = (import.meta as any)?.env?.VITE_REMOTE_SERVER || "http://localhost:4000";

interface User {
    _id: string;
    username: string;
    email: string;
    role: 'admin' | 'writer' | 'reader';
    createdAt?: string;
    avatar?: string;
    bio?: string;
    writerBadge?: boolean;
    expertise?: string[];
    lastLoginAt?: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                credentials: 'include'
            });
            if (response.ok) {
                const user = await response.json();
                setCurrentUser(user);
            } else if (response.status === 401) {
                // User is not authenticated
                setCurrentUser(null);
                setError('Please sign in to view this page');
            } else {
                throw new Error('Failed to fetch user profile');
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            setError('Failed to load user profile');
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(''); // Clear any previous errors
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please sign in to view users');
                }
                throw new Error('Failed to fetch users');
            }

            const users = await response.json();
            setUsers(users);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Always try to fetch users, regardless of authentication status
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            const result = await response.json();

            alert(`User deleted successfully: ${result.message}`);

            // Refresh user list
            fetchUsers();

        } catch (err: any) {
            alert(`Error deleting user: ${err.message}`);
        } finally {
            setDeleteConfirm(null);
            setShowDeleteModal(false);
        }
    };



    const getIdentityBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return { text: '👑 Admin', class: 'verified-badge-admin' };
            case 'writer':
                return { text: '✏️ Writer', class: 'verified-badge-writer' };
            case 'reader':
            default:
                return { text: '📖 Reader', class: 'verified-badge-reader' };
        }
    };

    const confirmDelete = (user: User) => {
        setDeleteConfirm(user);
        setShowDeleteModal(true);
    };

    if (loading) {
        return (
            <div className="user-management-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading users...</p>
                </div>
            </div>
        );
    }

    if (error && error.includes('sign in')) {
        return (
            <div className="user-management-container">
                <div className="auth-message">
                    <FaUsers size={64} className="auth-icon" />
                    <h2>Authentication Required</h2>
                    <p>Please sign in to view the user management page.</p>
                    <button
                        onClick={() => window.location.href = "/#/Account/Signin"}
                        className="btn-primary auth-btn"
                    >
                        Go to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-management-container">
            <div className="user-management-wrapper">
                {/* Header */}
                <div className="user-management-header">
                    <div className="user-management-header-bg"></div>
                    <div className="user-management-header-content">
                        <div className="header-title-section">
                            <h1 className="page-title">
                                <FaUsers className="title-icon" />
                                Users
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="users-content">
                    <div className="users-card">
                        {error && !error.includes('sign in') ? (
                            <div className="error-container">
                                <Alert variant="danger" className="error-alert">
                                    <p>Error: {error}</p>
                                    <Button variant="primary" onClick={fetchUsers} className="retry-btn">
                                        Retry
                                    </Button>
                                </Alert>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="no-users-container">
                                <FaUsers size={64} className="no-users-icon" />
                                <p className="no-users-text">No users found</p>
                            </div>
                        ) : (
                            <div className="users-table-container">
                                <div className="users-table-header">
                                    <h3 className="table-title">All Users ({users.length})</h3>
                                </div>

                                <div className="users-list">
                                    {users.map((user) => (
                                        <div key={user._id} className="user-item">
                                            <div className="user-item-content">
                                                {/* Avatar */}
                                                <div className="user-avatar">
                                                    {user.username?.charAt(0) || '?'}
                                                </div>

                                                {/* User Info */}
                                                <div className="user-info">
                                                    <div className="user-name-section">
                                                        <h4 className="user-name">{user.username || 'Unknown'}</h4>
                                                        <div className={getIdentityBadge(user.role).class}>
                                                            {getIdentityBadge(user.role).text}
                                                        </div>
                                                    </div>
                                                    <div className="user-id">
                                                        ID: {user._id}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {currentUser?.role === 'admin' && (
                                                    <div className="user-actions">
                                                        {user._id !== currentUser._id ? (
                                                            <button
                                                                onClick={() => confirmDelete(user)}
                                                                className="delete-btn"
                                                                title="Delete user"
                                                            >
                                                                <FaTrash />
                                                                Delete
                                                            </button>
                                                        ) : (
                                                            <span className="current-user-label">You</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && deleteConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="modal-icon">
                                    <FaTrash />
                                </div>
                                <div className="modal-title-section">
                                    <h3 className="modal-title">Delete User</h3>
                                    <p className="modal-subtitle">This action cannot be undone</p>
                                </div>
                            </div>

                            <div className="modal-body">
                                <p className="confirm-text">
                                    Are you sure you want to delete <strong>{deleteConfirm.username}</strong>?
                                </p>
                                <div className="warning-box">
                                    <p className="warning-title">
                                        <strong>Warning:</strong> This will permanently delete the user account.
                                    </p>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(deleteConfirm._id)}
                                    className="btn-delete"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}