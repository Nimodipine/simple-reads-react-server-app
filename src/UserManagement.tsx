import { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { FaUsers, FaTrash, FaPlus, FaEdit, FaHome, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosWithCredentials from './client';
import './UserManagement.css';

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
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await axiosWithCredentials.get('/api/profile');
            setCurrentUser(response.data);
        } catch (error: any) {
            console.error('Error fetching current user:', error);
            if (error.response?.status === 401) {
                setCurrentUser(null);
                setError('Please sign in to view this page');
                // DO NOT auto-redirect - show the sign-in required page instead
            } else {
                setError('Failed to load user profile');
            }
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axiosWithCredentials.get('/api/users');
            console.log('Users fetched:', response.data); // Debug log

            setAllUsers(response.data);
            setUsers(response.data);
        } catch (error: any) {
            console.error('Error fetching users:', error);

            if (error.response?.status === 401) {
                setError('Please sign in to view users');
            } else {
                setError(error.response?.data?.message || 'Failed to fetch users');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await axiosWithCredentials.delete(`/api/admin/users/${userId}`);
            alert('User deleted successfully!');
            fetchUsers();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete user';
            alert(`Error deleting user: ${errorMessage}`);
        } finally {
            setDeleteConfirm(null);
            setShowDeleteModal(false);
        }
    };

    const handleAddUser = async () => {
        try {
            await axiosWithCredentials.post('/api/users/signup', userForm);
            alert('User created successfully!');

            setUserForm({
                username: '',
                email: '',
                password: '',
                role: 'reader',
                bio: ''
            });
            setShowAddModal(false);
            fetchUsers();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to create user';
            alert(`Error creating user: ${errorMessage}`);
        }
    };

    const handleEditUser = async () => {
        if (!editingUser) return;

        try {
            await axiosWithCredentials.put(`/api/admin/users/${editingUser._id}`, userForm);
            alert('User updated successfully!');

            setUserForm({
                username: '',
                email: '',
                password: '',
                role: 'reader',
                bio: ''
            });
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update user';
            alert(`Error updating user: ${errorMessage}`);
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
            password: '',
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

    // Show loading state
    if (loading) {
        return (
            <div className="user-management-container">
                <div className="user-management-wrapper">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading users...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show authentication error
    if (error && error.includes('sign in')) {
        return (
            <div className="user-management-container">
                <div className="auth-message">
                    <FaUsers size={64} className="auth-icon" />
                    <h2>Authentication Required</h2>
                    <p>Please sign in to access the user management page.</p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/Account/Signin')}
                        className="auth-btn"
                        size="lg"
                    >
                        Go to Sign In
                    </Button>
                </div>
            </div>
        );
    }

    // Show if no current user
    if (!currentUser) {
        return (
            <div className="user-management-container">
                <div className="auth-message">
                    <FaUsers size={64} className="auth-icon" />
                    <h2>Authentication Required</h2>
                    <p>Please sign in to access the user management page.</p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/Account/Signin')}
                        className="auth-btn"
                        size="lg"
                    >
                        Go to Sign In
                    </Button>
                </div>
            </div>
        );
    }

    // Show access denied for non-admin
    if (currentUser.role !== 'admin') {
        return (
            <div className="user-management-container">
                <div className="auth-message">
                    <FaUsers size={64} className="auth-icon" />
                    <h2>Access Denied</h2>
                    <p>Only administrators can access the user management page.</p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/home')}
                        className="auth-btn"
                        size="lg"
                    >
                        Go to Home
                    </Button>
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
                                        <Button variant="primary" onClick={fetchUsers} className="retry-btn">
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

                                                {/* Actions */}
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