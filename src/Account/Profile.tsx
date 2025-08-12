import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentUser, setLoading, setError } from './reducer';
import './profile.css';

const API_BASE_URL = import.meta.env.VITE_REMOTE_SERVER || 'http://localhost:4000';

const ProfileHome = () => {
    const dispatch = useDispatch();
    const { currentUser, loading } = useSelector((state: any) => state.account);

    const [isOwnProfile] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('reviews');
    const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);

    type EditForm = {
        email: string;
        identity: string;
        bio: string;
    };

    // Form state for editing
    const [editForm, setEditForm] = useState<EditForm>({
        email: '',
        identity: '',
        bio: ''
    });

    useEffect(() => {
        if (currentUser) {
            // Set edit form with current user data
            setEditForm({
                email: currentUser.email || '',
                identity: currentUser.identity || currentUser.role || '',
                bio: currentUser.bio || ''
            });

            // Fetch additional profile data
            fetchProfileData();
        }
    }, [currentUser]);

    const fetchProfileData = async () => {
        if (!currentUser?._id) return;

        try {
            dispatch(setLoading(true));

            // Fetch follow stats, followers, following, and reviews
            const [statsRes, followersRes, followingRes, reviewsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/users/${currentUser._id}/stats`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/users/${currentUser._id}/followers`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/users/${currentUser._id}/following`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/users/${currentUser._id}/reviews`, { credentials: 'include' })
            ]);

            if (statsRes.ok) {
                const stats = await statsRes.json();
                setFollowStats(stats);
            }

            if (followersRes.ok) {
                const followersData = await followersRes.json();
                setFollowers(followersData);
            }

            if (followingRes.ok) {
                const followingData = await followingRes.json();
                setFollowing(followingData);
            }

            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setReviews(reviewsData);
            }

        } catch (error) {
            console.error('Error fetching profile data:', error);
            dispatch(setError('Failed to load profile data'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleEditProfile = async () => {
        try {
            dispatch(setLoading(true));

            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: editForm.email,
                    role: editForm.identity,
                    bio: editForm.bio
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                dispatch(setCurrentUser(updatedUser));
                setIsEditing(false);
            } else {
                const error = await response.json();
                dispatch(setError(error.message || 'Failed to update profile'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            dispatch(setError('Network error. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
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

    if (!currentUser) {
        return (
            <div className="profile-container">
                <div className="auth-message">
                    <h2>Please sign in to view your profile</h2>
                    <a href="/Account/Signin">Sign In</a>
                </div>
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
                                {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            {currentUser?.isOnline && (
                                <div className="online-indicator"></div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="profile-info">
                            {isEditing ? (
                                <div className="edit-form">
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

                                    <div className="auth-field">
                                        <label className="auth-label">Bio</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            className="edit-name-input"
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                        />
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
                                            {currentUser?.username}
                                        </h1>
                                        <div className={getIdentityBadge(currentUser?.identity || currentUser?.role || 'reader').class}>
                                            {getIdentityBadge(currentUser?.identity || currentUser?.role || 'reader').text}
                                        </div>
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
                                                {reviews.length}
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
                                    {followers.length > 0 ? followers.map((follower: any) => (
                                        <div key={follower._id} className="follower-item">
                                            <div className="follower-avatar followers">
                                                {follower.username?.[0] || 'U'}
                                            </div>
                                            <div className="follower-info">
                                                <p className="follower-name">
                                                    {follower.username}
                                                </p>
                                                <p className="follower-username">
                                                    @{follower.username}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p>No followers yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'following' && (
                            <div className="card">
                                <h3 className="card-title">
                                    👤 Following
                                </h3>

                                <div className="followers-list">
                                    {following.length > 0 ? following.map((followingUser: any) => (
                                        <div key={followingUser._id} className="follower-item">
                                            <div className="follower-avatar following">
                                                {followingUser.username?.[0] || 'U'}
                                            </div>
                                            <div className="follower-info">
                                                <p className="follower-name">
                                                    {followingUser.username}
                                                </p>
                                                <p className="follower-username">
                                                    @{followingUser.username}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p>Not following anyone yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="card">
                                <h3 className="card-title">
                                    ⭐ All Reviews
                                </h3>

                                <div className="content-items">
                                    {reviews.length > 0 ? reviews.map((review: any) => (
                                        <div key={review._id} className="content-detail-item">
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
                                                        {review.book?.title || 'Book'}
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
                                                {review.content}
                                            </p>
                                        </div>
                                    )) : (
                                        <p>No reviews yet</p>
                                    )}
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
                                            <div className="info-label">👤 Username</div>
                                            <div className="info-value">@{currentUser?.username || 'Not provided'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">📧 Email Address</div>
                                            <div className="info-value">{currentUser?.email || 'Not provided'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">🆔 Identity</div>
                                            <div className="info-value">{(currentUser?.identity || currentUser?.role)?.charAt(0).toUpperCase() + (currentUser?.identity || currentUser?.role)?.slice(1) || 'Reader'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">📝 Bio</div>
                                            <div className="info-value">{currentUser?.bio || 'No bio added yet'}</div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">📅 Member Since</div>
                                            <div className="info-value">
                                                {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'Not provided'}
                                            </div>
                                        </div>

                                        {currentUser?.interests && currentUser.interests.length > 0 && (
                                            <div className="info-item">
                                                <div className="info-label">🎯 Interests</div>
                                                <div className="info-value">
                                                    {currentUser.interests.join(', ')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHome;