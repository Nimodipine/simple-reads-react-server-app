import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';
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

export default function UserProfileList() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(''); // Clear any previous errors

            // Try to fetch users without requiring authentication
            const response = await fetch(`${API_BASE_URL}/api/users`);

            if (!response.ok) {
                // If it fails, still try to show users but handle gracefully
                if (response.status === 401) {
                    // For public access, we might want to show users anyway
                    // You may need to create a public endpoint or modify the backend
                    throw new Error('Unable to load users at this time');
                }
                throw new Error('Failed to fetch users');
            }

            const users = await response.json();
            setUsers(users);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
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

    const navigateToUserProfile = (userId: string) => {
        navigate(`/Account/Profile/${userId}`);
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
                                User Profiles
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Users List */}
                <div className="users-content">
                    <div className="users-card">
                        {error ? (
                            <div className="error-container">
                                <div className="error-alert">
                                    <p>Error: {error}</p>
                                    <p className="error-subtext">
                                        This page shows all users in the community.
                                        {error.includes('Unable to load') && ' Please try again later or contact support.'}
                                    </p>
                                    <button onClick={fetchUsers} className="retry-btn">
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="no-users-container">
                                <FaUsers size={64} className="no-users-icon" />
                                <p className="no-users-text">No users found</p>
                                <p className="no-users-subtext">
                                    Be the first to join our community!
                                </p>
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

                                                {/* User Info - Make username clickable */}
                                                <div className="user-info">
                                                    <div className="user-name-section">
                                                        <h4
                                                            className="user-name clickable-username"
                                                            onClick={() => navigateToUserProfile(user._id)}
                                                        >
                                                            {user.username || 'Unknown'}
                                                        </h4>
                                                        <div className={getIdentityBadge(user.role).class}>
                                                            {getIdentityBadge(user.role).text}
                                                        </div>
                                                    </div>
                                                    {/* No user ID displayed */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}