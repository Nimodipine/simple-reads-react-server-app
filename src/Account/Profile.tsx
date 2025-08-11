import React, { useState, useEffect } from 'react';
import './profile.css';

const ProfileHome = () => {
    const [user, setUser] = useState<any>(null);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('reviews');
    const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    type EditForm = {
        firstName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
        identity: string;
    };

    // Form state for editing
    const [editForm, setEditForm] = useState<EditForm>({
        firstName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        identity: ''
    });

    // Mock data
    const mockUser = {
        id: 'user123',
        username: 'johndoe',
        displayName: 'John Doe',
        bio: 'Full-stack developer passionate about creating amazing user experiences. Love hiking, photography, and good coffee. Always learning new technologies and sharing knowledge with the community.',
        interests: ['JavaScript', 'React', 'Photography', 'Hiking', 'Coffee', 'Open Source'],
        isVerified: true,
        isOnline: true
    };

    const mockFollowStats = {
        followersCount: 1247,
        followingCount: 389
    };

    const mockReviews = [
        {
            reviewId: '1',
            title: 'Amazing React Component Library',
            rating: 5,
            snippet: 'This library has everything I need for building modern UIs. The components are well-designed, customizable, and thoroughly documented. Highly recommended for any React project!',
            createdAt: '2024-08-01T00:00:00Z',
            itemId: 'item1',
            itemType: 'library'
        },
        {
            reviewId: '2',
            title: 'Blue Bottle Coffee - Mission District',
            rating: 4,
            snippet: 'Perfect place for working remotely. Great atmosphere, excellent single-origin coffee, and reliable WiFi. Can get crowded during peak hours.',
            createdAt: '2024-07-25T00:00:00Z',
            itemId: 'item2',
            itemType: 'venue'
        },
        {
            reviewId: '3',
            title: 'Figma to React Component Tool',
            rating: 4,
            snippet: 'Saves me hours of development time by converting Figma designs to React components. Could use better documentation and TypeScript support.',
            createdAt: '2024-07-20T00:00:00Z',
            itemId: 'item3',
            itemType: 'tool'
        }
    ];

    const mockFollowers = [
        { userId: '1', displayName: 'Alice Smith', username: 'alice_dev' },
        { userId: '2', displayName: 'Bob Johnson', username: 'bob_designs' },
        { userId: '3', displayName: 'Carol Wilson', username: 'carol_pm' },
        { userId: '4', displayName: 'David Brown', username: 'david_ux' },
        { userId: '5', displayName: 'Emma Davis', username: 'emma_frontend' }
    ];

    useEffect(() => {
        // Load user data from localStorage (from signup)
        const currentUser = localStorage.getItem('currentUser');
        const isLoggedIn = localStorage.getItem('isLoggedIn');

        setTimeout(() => {
            if (currentUser && isLoggedIn) {
                // Use actual user data from signup
                const userData = JSON.parse(currentUser);
                setUser(userData);
                setFollowStats(mockFollowStats);
                setEditForm({
                    firstName: userData.displayName || userData.firstName,
                    email: userData.email || '',
                    phone: userData.phone || '',
                    dateOfBirth: userData.dateOfBirth || '',
                    identity: userData.identity || 'reader'
                });
            } else {
                // Fallback to mock data if no user is logged in
                setUser(mockUser);
                setFollowStats(mockFollowStats);
                setEditForm({
                    firstName: mockUser.displayName,
                    email: '',
                    phone: '',
                    dateOfBirth: '',
                    identity: 'reader'
                });
            }
            setLoading(false);
        }, 1000);
    }, []);

    const handleEditProfile = () => {
        const updatedUser = {
            ...user,
            displayName: editForm.firstName,
            firstName: editForm.firstName,
            email: editForm.email,
            phone: editForm.phone,
            dateOfBirth: editForm.dateOfBirth,
            identity: editForm.identity
        };
        setUser(updatedUser);

        // Update localStorage with new data
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        setIsEditing(false);
    };

    const getIdentityBadge = (identity: string) => {
        switch (identity) {
            case 'admin':
                return { text: '👑 Admin', class: 'verified-badge-admin' };
            case 'writer':
                return { text: '✍️ Writer', class: 'verified-badge-writer' };
            case 'reader':
            default:
                return { text: '📖 Reader', class: 'verified-badge-reader' };
        }
    };

    const handleFollow = () => {
        setIsFollowing(!isFollowing);
        setFollowStats(prev => ({
            ...prev,
            followersCount: prev.followersCount + (isFollowing ? -1 : 1)
        }));
    };

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <span
                key={i}
                style={{
                    color: i < rating ? '#fbbf24' : '#d1d5db',
                    fontSize: '14px'
                }}
            >
                ★
            </span>
        ));
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-wrapper">

                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-header-bg"></div>

                    <div className="profile-header-content">
                        {/* Avatar */}
                        <div className="avatar-container">
                            <div className="avatar">
                                {user?.displayName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            {user?.isOnline && (
                                <div className="online-indicator"></div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="profile-info">
                            {isEditing ? (
                                <div className="edit-form">
                                    <div className="auth-field">
                                        <label className="auth-label">
                                            First Name <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            className="edit-name-input"
                                            placeholder="First Name"
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">
                                            Email Address <span className="required">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="edit-name-input"
                                            placeholder="Email Address"
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">
                                            Phone Number <span className="required">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="edit-name-input"
                                            placeholder="Phone Number"
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">
                                            Date of Birth <span className="required">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={editForm.dateOfBirth}
                                            onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                            className="edit-name-input"
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">
                                            Identity <span className="required">*</span>
                                        </label>
                                        <select
                                            value={editForm.identity}
                                            onChange={(e) => setEditForm({ ...editForm, identity: e.target.value })}
                                            className="edit-name-input"
                                        >
                                            <option value="reader">Reader</option>
                                            <option value="writer">Writer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <div className="edit-buttons">
                                        <button
                                            onClick={handleEditProfile}
                                            className="btn-save"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="btn-cancel"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="profile-name-section">
                                        <h1 className="profile-name">
                                            {user?.displayName || user?.firstName}
                                        </h1>
                                        {user?.isVerified && (
                                            <div className={getIdentityBadge(user?.identity || 'reader').class}>
                                                {getIdentityBadge(user?.identity || 'reader').text}
                                            </div>
                                        )}
                                    </div>

                                    <div className="profile-stats">
                                        <div className="stat-item">
                                            <div className="stat-number">
                                                {followStats.followersCount}
                                            </div>
                                            <div className="stat-label">Followers</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-number">
                                                {followStats.followingCount}
                                            </div>
                                            <div className="stat-label">Following</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-number">
                                                {mockReviews.length}
                                            </div>
                                            <div className="stat-label">Reviews</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {!isEditing && (
                            <div className="action-buttons">
                                {isOwnProfile ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-primary"
                                    >
                                        ✏️ Edit Info
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleFollow}
                                            className={`btn-primary ${isFollowing ? 'btn-unfollow' : ''}`}
                                        >
                                            {isFollowing ? '👤- Unfollow' : '👤+ Follow'}
                                        </button>
                                        <button className="btn-secondary">
                                            💬 Message
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="nav-tabs-container">
                    <div className="nav-tabs">
                        {['followers', 'following', 'reviews', 'info'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-layout">

                    {/* Main Content */}
                    <div className="main-content">

                        {activeTab === 'followers' && (
                            <div className="card">
                                <h3 className="card-title">
                                    👥 Followers
                                </h3>

                                <div className="followers-list">
                                    {mockFollowers.map((follower) => (
                                        <div key={follower.userId} className="follower-item">
                                            <div className="follower-avatar followers">
                                                {follower.displayName?.[0] || follower.username?.[0]}
                                            </div>
                                            <div className="follower-info">
                                                <p className="follower-name">
                                                    {follower.displayName || follower.username}
                                                </p>
                                                <p className="follower-username">
                                                    @{follower.username}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'following' && (
                            <div className="card">
                                <h3 className="card-title">
                                    👤 Following
                                </h3>

                                <div className="followers-list">
                                    {mockFollowers.slice(0, 3).map((following) => (
                                        <div key={following.userId + '_following'} className="follower-item">
                                            <div className="follower-avatar following">
                                                {following.displayName?.[0] || following.username?.[0]}
                                            </div>
                                            <div className="follower-info">
                                                <p className="follower-name">
                                                    {following.displayName || following.username}
                                                </p>
                                                <p className="follower-username">
                                                    @{following.username}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="card">
                                <h3 className="card-title">
                                    ⭐ All Reviews
                                </h3>

                                <div className="content-items">
                                    {mockReviews.map((review) => (
                                        <div key={review.reviewId} className="content-detail-item">
                                            <div className="content-detail-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex' }}>
                                                        {renderStars(review.rating)}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#6b7280',
                                                        background: '#f3f4f6',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {review.itemType}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h4 className="content-detail-title">
                                                    {review.title}
                                                </h4>
                                            </div>
                                            <p className="content-detail-snippet">
                                                {review.snippet}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="card">
                                <h3 className="card-title">
                                    📋 Personal Information
                                </h3>

                                <div className="content-items">
                                    <div className="info-section">
                                        <div className="info-item">
                                            <div className="info-label">👤 Full Name</div>
                                            <div className="info-value">{user?.displayName || user?.firstName || 'Not provided'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">📧 Email Address</div>
                                            <div className="info-value">{user?.email || 'Not provided'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">📱 Phone Number</div>
                                            <div className="info-value">{user?.phone || 'Not provided'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">🎂 Date of Birth</div>
                                            <div className="info-value">
                                                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'Not provided'}
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">🏷️ Username</div>
                                            <div className="info-value">@{user?.username || 'Not provided'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">🆔 Identity</div>
                                            <div className="info-value">{user?.identity?.charAt(0).toUpperCase() + user?.identity?.slice(1) || 'Reader'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">📅 Member Since</div>
                                            <div className="info-value">
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'Not provided'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar removed - no interests section */}
                </div>
            </div>
        </div>
    );
};

export default ProfileHome;