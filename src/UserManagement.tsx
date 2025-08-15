import { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { FaUsers, FaTrash, FaPlus, FaEdit, FaHome, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
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

interface UserFormData {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'writer' | 'reader';
    bio?: string;
}

export default function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users for filtering
    const [, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState<UserFormData>({
        username: '',
        email: '',
        password: '',
        role: 'reader',
        bio: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

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
            setAllUsers(users);
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

    const handleAddUser = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userForm)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create user');
            }

            alert('User created successfully!');

            // Reset form and close modal
            setUserForm({
                username: '',
                email: '',
                password: '',
                role: 'reader',
                bio: ''
            });
            setShowAddModal(false);

            // Refresh user list
            fetchUsers();

        } catch (err: any) {
            alert(`Error creating user: ${err.message}`);
        }
    };

    const handleEditUser = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userForm)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            alert('User updated successfully!');

            // Reset form and close modal
            setUserForm({
                username: '',
                email: '',
                password: '',
                role: 'reader',
                bio: ''
            });
            setShowEditModal(false);
            setEditingUser(null);

            // Refresh user list
            fetchUsers();

        } catch (err: any) {
            alert(`Error updating user: ${err.message}`);
        }
    };

    const openAddModal = () => {
        setUserForm({
            username: '',
            email: '',
            password: '',
            role: 'reader',
            bio: ''
        });
        setShowAddModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setUserForm({
            username: user.username,
            email: user.email,
            password: '', // Don't pre-fill password
            role: user.role,
            bio: user.bio || ''
        });
        setShowEditModal(true);
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Filter users locally based on search term
        if (value.trim()) {
            const filteredUsers = allUsers.filter(user =>
                user.username.toLowerCase().includes(value.toLowerCase()) ||
                user.email.toLowerCase().includes(value.toLowerCase()) ||
                user.role.toLowerCase().includes(value.toLowerCase())
            );
            setUsers(filteredUsers);
        } else {
            setUsers(allUsers);
        }
    };

    if (error && error.includes('sign in')) {
        return (
            <div className="user-management-container">
                <div className="auth-message">
                    <FaUsers size={64} className="auth-icon" />
                    <h2>Authentication Required</h2>
                    <p>Please sign in to access the user management page.</p>
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

    if (!currentUser) {
        return (
            <div className="user-management-container">
                <div className="auth-message">
                    <FaUsers size={64} className="auth-icon" />
                    <h2>Authentication Required</h2>
                    <p>Please sign in to access the user management page.</p>
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

    if (currentUser.role !== 'admin') {
        return (
            <div className="user-management-container">
                <div className="auth-message">
                    <FaUsers size={64} className="auth-icon" />
                    <h2>Access Denied</h2>
                    <p>Only administrators can access the user management page.</p>
                    <button
                        onClick={() => window.location.href = "/#/home"}
                        className="btn-primary auth-btn"
                    >
                        Go to Home
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
                            <div className="header-title-row">
                                <div className="header-nav-buttons">
                                    <Button
                                        variant="outline-light"
                                        className="header-home-btn"
                                        onClick={() => navigate('/home')}
                                        title="Go to Home"
                                    >
                                        <FaHome />
                                    </Button>
                                    <Button
                                        variant="outline-light"
                                        className="header-profile-btn"
                                        onClick={() => navigate('/Account/Profile')}
                                        title="Go to Profile"
                                    >
                                        <FaUser />
                                    </Button>
                                </div>
                                <h1 className="page-title">
                                    <FaUsers className="title-icon" />
                                    User Management
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="users-content">
                    <div className="users-card">
                        <div className="users-table-container">
                            <div className="users-table-header">
                                <h3 className="table-title">All Users ({users.length})</h3>
                                <div className="table-actions">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            className="search-input"
                                        />
                                    </div>
                                    <button
                                        onClick={openAddModal}
                                        className="add-user-btn"
                                    >
                                        <FaPlus />
                                        Add User
                                    </button>
                                </div>
                            </div>

                            {error && !error.includes('sign in') ? (
                                <div className="error-container">
                                    <Alert variant="danger" className="error-alert">
                                        <p>Error: {error}</p>
                                        <Button variant="primary" onClick={() => fetchUsers()} className="retry-btn">
                                            Retry
                                        </Button>
                                    </Alert>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="no-users-container">
                                    <FaUsers size={64} className="no-users-icon" />
                                    <p className="no-users-text">
                                        {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                                    </p>
                                    {searchTerm && (
                                        <p className="no-users-subtext">
                                            Try adjusting your search terms or clear the search to see all users.
                                        </p>
                                    )}
                                </div>
                            ) : (
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

                                                {/* Actions - Always show for admin */}
                                                <div className="user-actions">
                                                    {user._id !== currentUser._id ? (
                                                        <div className="action-buttons">
                                                            <button
                                                                onClick={() => openEditModal(user)}
                                                                className="edit-btn"
                                                                title="Edit user"
                                                            >
                                                                <FaEdit />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDelete(user)}
                                                                className="delete-btn"
                                                                title="Delete user"
                                                            >
                                                                <FaTrash />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="current-user-label">You</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add User Modal */}
                {showAddModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="modal-icon add-icon">
                                    <FaPlus />
                                </div>
                                <div className="modal-title-section">
                                    <h3 className="modal-title">Add New User</h3>
                                    <p className="modal-subtitle">Create a new user account</p>
                                </div>
                            </div>

                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={userForm.username}
                                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter password"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'writer' | 'reader' })}
                                        className="form-input"
                                    >
                                        <option value="reader">Reader</option>
                                        <option value="writer">Writer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bio (Optional)</label>
                                    <textarea
                                        value={userForm.bio}
                                        onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter bio"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddUser}
                                    className="btn-primary"
                                >
                                    Add User
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && editingUser && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="modal-icon edit-icon">
                                    <FaEdit />
                                </div>
                                <div className="modal-title-section">
                                    <h3 className="modal-title">Edit User</h3>
                                    <p className="modal-subtitle">Update user information</p>
                                </div>
                            </div>

                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={userForm.username}
                                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password (Leave blank to keep current)</label>
                                    <input
                                        type="password"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'writer' | 'reader' })}
                                        className="form-input"
                                    >
                                        <option value="reader">Reader</option>
                                        <option value="writer">Writer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bio</label>
                                    <textarea
                                        value={userForm.bio}
                                        onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter bio"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditUser}
                                    className="btn-primary"
                                >
                                    Update User
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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