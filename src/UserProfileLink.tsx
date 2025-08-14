import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaHome } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
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
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/api/users`);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unable to load users at this time');
                }
                throw new Error('Failed to fetch users');
            }

            const users = await response.json();
            setAllUsers(users);
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
                return { text: '✍️ Writer', class: 'verified-badge-writer' };
            case 'reader':
            default:
                return { text: '📖 Reader', class: 'verified-badge-reader' };
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

    return (
        <div className="user-management-container">
            <Button
                variant="outline-primary"
                className="home-btn"
                onClick={() => navigate('/home')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '10px',
                    marginLeft: '10px'
                }}
                title="Go to Home"
            >
                <FaHome style={{ fontSize: '18px' }} />
            </Button>

            <div className="user-management-wrapper">
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
                                        {searchTerm
                                            ? 'Try adjusting your search terms or clear the search to see all users.'
                                            : 'Be the first to join our community!'}
                                    </p>
                                </div>
                            ) : (
                                <div className="users-list">
                                    {users.map((user) => (
                                        <div key={user._id} className="user-item">
                                            <div className="user-item-content">
                                                <div className="user-avatar">
                                                    {user.username?.charAt(0) || '?'}
                                                </div>
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
