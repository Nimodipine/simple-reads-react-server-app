import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaHome, FaUser } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
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

export default function UserProfileList() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axiosWithCredentials.get('/api/users');
            setAllUsers(response.data);
            setUsers(response.data);

        } catch (error: any) {
            console.error('Error fetching users:', error);

            if (error.response?.status === 401) {
                setError('Unable to load users at this time');
                // Don't auto-redirect - let the page show the error message
            } else {
                setError(error.response?.data?.message || 'Failed to fetch users');
            }
        } finally {
            setLoading(false);
        }
    };

    const getIdentityBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return { text: '👑 Admin', className: 'verified-badge-admin' };
            case 'writer':
                return { text: '✏️ Writer', className: 'verified-badge-writer' };
            case 'reader':
            default:
                return { text: '📖 Reader', className: 'verified-badge-reader' };
        }
    };

    const navigateToUserProfile = (userId: string) => {
        navigate(`/Account/Profile/${userId}`);
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

    return (
        <div className="user-management-container">
            <div className="user-management-wrapper">
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
                                    User Profiles
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

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
                                </div>
                            </div>

                            {error ? (
                                <div className="error-container">
                                    <div className="error-alert">
                                        <p>Error: {error}</p>
                                        <p className="error-subtext">
                                            This page shows all users in the community.
                                            {error.includes('Unable to load') && ' Please try again later or contact support.'}
                                        </p>
                                        <button onClick={() => fetchUsers()} className="retry-btn">
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="no-users-container">
                                    <FaUsers size={64} className="no-users-icon" />
                                    <p className="no-users-text">
                                        {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                                    </p>
                                    <p className="no-users-subtext">
                                        {searchTerm ? 'Try adjusting your search terms or clear the search to see all users.' : 'Be the first to join our community!'}
                                    </p>
                                </div>
                            ) : (
                                <div className="users-list">
                                    {users.map((user) => (
                                        <div key={user._id} className="user-item">
                                            <div className="user-item-content">
                                                <div className="user-avatar">
                                                    {user.username?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="user-info">
                                                    <div className="user-name-section">
                                                        <h4
                                                            className="user-name clickable-username"
                                                            onClick={() => navigateToUserProfile(user._id)}
                                                            role="button"
                                                            tabIndex={0}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    navigateToUserProfile(user._id);
                                                                }
                                                            }}
                                                        >
                                                            {user.username || 'Unknown'}
                                                        </h4>
                                                        <div className={getIdentityBadge(user.role).className}>
                                                            {getIdentityBadge(user.role).text}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}