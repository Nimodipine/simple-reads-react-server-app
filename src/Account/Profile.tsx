import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { setCurrentUser, setLoading, setError } from "./reducer";
import "./profile.css";

const API_BASE_URL =
    import.meta.env.VITE_REMOTE_SERVER || "http://localhost:4000";

type EditForm = {
    email: string;
    identity: string;
    bio: string;
};

type User = {
    _id: string;
    username: string;
    email?: string;
    identity?: string;
    role?: string;
    bio?: string;
    isOnline?: boolean;
    createdAt?: string;
    interests?: string[];
};

type FollowDoc = {
    _id: string;
    follower?: User; // for followers tab
    following?: User; // for following tab
};

type Review = {
    _id: string;
    title: string;
    content: string;
    rating: number;
    createdAt: string;
    book?: string; // This should be the googleId to navigate to BookInfo
};

type Favorite = {
    _id: string;
    user: string;
    book: string; // This is the googleId to navigate to BookInfo
    addedAt: string;
};

const ProfileHome = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>(); // Get userId from URL params
    const { currentUser, loading } = useSelector((state: any) => state.account);

    const [profileUser, setProfileUser] = useState<User | null>(null); // The user whose profile we're viewing
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("reviews");
    const [followStats, setFollowStats] = useState({
        followersCount: 0,
        followingCount: 0,
    });
    const [followers, setFollowers] = useState<FollowDoc[]>([]);
    const [following, setFollowing] = useState<FollowDoc[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    // Book titles by googleId for favorites and reviews
    const [bookTitles, setBookTitles] = useState<{ [googleId: string]: string }>(
        {}
    );

    // Form state for editing
    const [editForm, setEditForm] = useState<EditForm>({
        email: "",
        identity: "",
        bio: "",
    });

    // Add formatDate function to match BookInfo formatting
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    useEffect(() => {
        const viewingUserId = userId || currentUser?._id;
        const isOwn = !userId || userId === currentUser?._id;

        setIsOwnProfile(isOwn);

        if (viewingUserId) {
            fetchUserProfile(viewingUserId, isOwn); // pass fresh value
            fetchProfileData(viewingUserId);
            // (optional) keep follow state in sync when switching profiles
            checkFollowStatus(viewingUserId);
        }
    }, [userId, currentUser]);

    // Fetch book titles for favorites and reviews when they change
    useEffect(() => {
        // Collect all googleIds from favorites and reviews
        const googleIds = [
            ...favorites.map((fav) => fav.book),
            ...reviews.map((rev) => rev.book || ""),
        ].filter((id) => id && !bookTitles[id]);

        // Fetch missing titles
        googleIds.forEach((googleId) => {
            fetch(`${API_BASE_URL}/api/books/${googleId}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data && data.success && data.book && data.book.title) {
                        setBookTitles((prev) => ({ ...prev, [googleId]: data.book.title }));
                    } else {
                        setBookTitles((prev) => ({ ...prev, [googleId]: "Unknown Book" }));
                    }
                })
                .catch(() => {
                    setBookTitles((prev) => ({ ...prev, [googleId]: "Unknown Book" }));
                });
        });
    }, [favorites, reviews]);

    const checkFollowStatus = async (viewingUserId: string) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/follow/status/${viewingUserId}`,
                {
                    credentials: "include",
                }
            );
            if (response.ok) {
                const { isFollowing } = await response.json();
                setIsFollowing(isFollowing);
            }
        } catch (error) {
            console.error("Error checking follow status:", error);
        }
    };

    const fetchUserProfile = async (viewingUserId: string, isOwn: boolean) => {
        try {
            if (isOwn && currentUser) {
                setProfileUser(currentUser);
                setEditForm({
                    email: currentUser.email || "",
                    identity: currentUser.identity || currentUser.role || "",
                    bio: currentUser.bio || "",
                });
            } else {
                const response = await fetch(
                    `${API_BASE_URL}/api/profile/${viewingUserId}`,
                    { credentials: "include" }
                );
                if (response.ok) {
                    const userData = await response.json();
                    setProfileUser(userData);
                }
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const navigateToUserProfile = (clickedUserId: string) => {
        if (clickedUserId === currentUser?._id) {
            // Navigate to own profile
            navigate("/Account/Profile");
        } else {
            // Navigate to other user's profile
            navigate(`/Account/Profile/${clickedUserId}`);
        }
    };

    // Navigation functions for new buttons
    const navigateToHome = () => {
        navigate("/home");
    };

    const navigateToOwnProfile = () => {
        navigate("/Account/Profile");
    };

    // Navigation to BookInfo page
    const navigateToBookInfo = (googleId: string) => {
        navigate(`/details/${googleId}`);
    };

    const fetchProfileData = async (viewingUserId: string) => {
        try {
            dispatch(setLoading(true));

            // Use the correct endpoints that exist in routes.js
            const [
                followersCountRes,
                followingCountRes,
                followersRes,
                followingRes,
                reviewsRes,
                favoritesRes,
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/api/profile/${viewingUserId}/followers/count`, {
                    credentials: "include",
                }),
                fetch(`${API_BASE_URL}/api/profile/${viewingUserId}/following/count`, {
                    credentials: "include",
                }),
                fetch(`${API_BASE_URL}/api/profile/${viewingUserId}/followers`, {
                    credentials: "include",
                }),
                fetch(`${API_BASE_URL}/api/profile/${viewingUserId}/following`, {
                    credentials: "include",
                }),
                fetch(`${API_BASE_URL}/api/profile/${viewingUserId}/reviews`, {
                    credentials: "include",
                }),
                fetch(`${API_BASE_URL}/api/favorites/user/${viewingUserId}`, {
                    credentials: "include",
                }),
            ]);

            // Handle follow stats - combine the count responses
            const followStats = { followersCount: 0, followingCount: 0 };

            if (followersCountRes.ok) {
                const { followerCount } = await followersCountRes.json();
                followStats.followersCount = followerCount;
            }

            if (followingCountRes.ok) {
                const { followingCount } = await followingCountRes.json();
                followStats.followingCount = followingCount;
            }

            setFollowStats(followStats);

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

            if (favoritesRes.ok) {
                const favoritesData = await favoritesRes.json();
                setFavorites(favoritesData);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
            dispatch(setError("Failed to load profile data"));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleEditProfile = async () => {
        try {
            dispatch(setLoading(true));

            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email: editForm.email,
                    role: editForm.identity,
                    bio: editForm.bio,
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                dispatch(setCurrentUser(updatedUser));
                setProfileUser(updatedUser);
                setIsEditing(false);
            } else {
                const error = await response.json();
                dispatch(setError(error.message || "Failed to update profile"));
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            dispatch(setError("Network error. Please try again."));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const getIdentityBadge = (identity: string) => {
        switch (identity) {
            case "admin":
                return { text: "👑 Admin", class: "verified-badge-admin" };
            case "writer":
                return { text: "✍️ Writer", class: "verified-badge-writer" };
            case "reader":
            default:
                return { text: "📖 Reader", class: "verified-badge-reader" };
        }
    };

    const handleFollow = async () => {
        if (!profileUser || !currentUser || followLoading) return;

        setFollowLoading(true);

        try {
            const url = `${API_BASE_URL}/api/follow/${profileUser._id}`;
            const method = isFollowing ? "DELETE" : "POST";

            const response = await fetch(url, {
                method,
                credentials: "include",
            });

            if (response.ok) {
                // Update local state
                const newFollowingState = !isFollowing;
                setIsFollowing(newFollowingState);

                // Update follower count
                setFollowStats((prev) => ({
                    ...prev,
                    followersCount: prev.followersCount + (newFollowingState ? 1 : -1),
                }));

                // Refresh followers list to reflect the change
                const followersRes = await fetch(
                    `${API_BASE_URL}/api/followers/user/${profileUser._id}`,
                    { credentials: "include" }
                );
                if (followersRes.ok) {
                    const followersData = await followersRes.json();
                    setFollowers(followersData);
                }
            } else {
                const error = await response.json();
                dispatch(setError(error.message || "Failed to update follow status"));
            }
        } catch (error) {
            console.error("Error updating follow status:", error);
            dispatch(setError("Network error. Please try again."));
        } finally {
            setFollowLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <span
                key={i}
                style={{
                    color: i < rating ? "#fbbf24" : "#d1d5db",
                    fontSize: "14px",
                }}
            >
                ⭐
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

    if (!currentUser && !userId) {
        return (
            <div className="profile-container">
                <div className="auth-message">
                    <h2>Please sign in to view your profile</h2>
                    <button
                        onClick={() => navigate("/Account/Signin")}
                        className="btn-primary"
                        style={{
                            marginTop: "1rem",
                            padding: "0.75rem 1.5rem",
                            fontSize: "1rem",
                        }}
                    >
                        Sign In
                    </button>
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
                                {profileUser?.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            {profileUser?.isOnline && (
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
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, email: e.target.value })
                                            }
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
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, identity: e.target.value })
                                            }
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
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, bio: e.target.value })
                                            }
                                            className="edit-name-input"
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="edit-buttons">
                                        <button onClick={handleEditProfile} className="btn-save">
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
                                        <h1 className="profile-name">{profileUser?.username}</h1>
                                        <div
                                            className={
                                                getIdentityBadge(
                                                    profileUser?.identity || profileUser?.role || "reader"
                                                ).class
                                            }
                                        >
                                            {
                                                getIdentityBadge(
                                                    profileUser?.identity || profileUser?.role || "reader"
                                                ).text
                                            }
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
                                            <div className="stat-number">{reviews.length}</div>
                                            <div className="stat-label">Reviews</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-number">{favorites.length}</div>
                                            <div className="stat-label">Favorites</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {!isEditing && (
                            <div className="action-buttons">
                                {/* Main Action Button */}
                                {isOwnProfile ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-primary"
                                    >
                                        ✏️ Edit Info
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        className={`btn-primary ${isFollowing ? "btn-unfollow" : ""
                                            }`}
                                    >
                                        {followLoading
                                            ? "..."
                                            : isFollowing
                                                ? "👤- Unfollow"
                                                : "👤+ Follow"}
                                    </button>
                                )}

                                {/* Navigation Icon Buttons - Fixed Logic */}
                                <div className="nav-icon-buttons">
                                    <button
                                        onClick={navigateToHome}
                                        className="icon-btn home-btn"
                                        title="Go to Home"
                                    >
                                        🏠
                                    </button>
                                    {currentUser && !isOwnProfile && (
                                        <button
                                            onClick={navigateToOwnProfile}
                                            className="icon-btn profile-btn"
                                            title="Go to My Profile"
                                        >
                                            👤
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="nav-tabs-container">
                    <div className="nav-tabs">
                        {["followers", "following", "favorites", "reviews", "info"].map(
                            (tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`nav-tab ${activeTab === tab ? "active" : ""}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-layout">
                    {/* Main Content */}
                    <div className="main-content">
                        {activeTab === "followers" && (
                            <div className="card">
                                <h3 className="card-title">👥 Followers</h3>
                                <div className="followers-list">
                                    {followers.length > 0 ? (
                                        followers.map((f) => {
                                            const user = f.follower;
                                            if (!user) return null;
                                            return (
                                                <div
                                                    key={user._id}
                                                    className="follower-item"
                                                    onClick={() => navigateToUserProfile(user._id)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <div className="follower-avatar followers">
                                                        {user.username?.[0] || "U"}
                                                    </div>
                                                    <div className="follower-info">
                                                        <p className="follower-name">{user.username}</p>
                                                        <p className="follower-username">
                                                            @{user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p>No followers yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "following" && (
                            <div className="card">
                                <h3 className="card-title">👤 Following</h3>
                                <div className="followers-list">
                                    {following.length > 0 ? (
                                        following.map((f) => {
                                            const user = f.following;
                                            if (!user) return null;
                                            return (
                                                <div
                                                    key={user._id}
                                                    className="follower-item"
                                                    onClick={() => navigateToUserProfile(user._id)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <div className="follower-avatar following">
                                                        {user.username?.[0] || "U"}
                                                    </div>
                                                    <div className="follower-info">
                                                        <p className="follower-name">{user.username}</p>
                                                        <p className="follower-username">
                                                            @{user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p>Not following anyone yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "favorites" && (
                            <div className="card">
                                <h3 className="card-title">❤️ Favorite Books</h3>
                                <div className="content-items">
                                    {favorites.length > 0 ? (
                                        favorites.map((favorite) => (
                                            <div
                                                key={favorite._id}
                                                className="content-detail-item favorite-book-item"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => navigateToBookInfo(favorite.book)}
                                            >
                                                <div className="content-detail-header">
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "12px",
                                                            marginBottom: "12px",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: "16px",
                                                                color: "#dc2626",
                                                            }}
                                                        >
                                                            ❤️
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "#6b7280",
                                                                background: "#fef3c7",
                                                                padding: "2px 8px",
                                                                borderRadius: "4px",
                                                            }}
                                                        >
                                                            {bookTitles[favorite.book] ||
                                                                "Book ID: " + favorite.book}
                                                        </span>
                                                        <span
                                                            style={{ fontSize: "12px", color: "#6b7280" }}
                                                        >
                                                            Added: {formatDate(favorite.addedAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="content-detail-snippet">
                                                    Click to view book details
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No favorite books yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="card">
                                <h3 className="card-title">⭐ All Reviews</h3>
                                <div className="content-items">
                                    {reviews.length > 0 ? (
                                        reviews.map((review) => (
                                            <div
                                                key={review._id}
                                                className="content-detail-item"
                                                style={{ cursor: "pointer" }}
                                                onClick={() =>
                                                    review.book && navigateToBookInfo(review.book)
                                                }
                                            >
                                                <div className="content-detail-header">
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "12px",
                                                            marginBottom: "12px",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex" }}>
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <span
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "#6b7280",
                                                                background: "#f3f4f6",
                                                                padding: "2px 8px",
                                                                borderRadius: "4px",
                                                            }}
                                                        >
                                                            {bookTitles[review.book || ""] ||
                                                                "Book ID: " + (review.book || "Unknown")}
                                                        </span>
                                                        <span
                                                            style={{ fontSize: "12px", color: "#6b7280" }}
                                                        >
                                                            {formatDate(review.createdAt)}
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
                                        ))
                                    ) : (
                                        <p>No reviews yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "info" && (
                            <div className="card">
                                <h3 className="card-title">📋 Personal Information</h3>
                                <div className="content-items">
                                    <div className="info-section">
                                        <div className="info-item">
                                            <div className="info-label">👤 Username</div>
                                            <div className="info-value">
                                                @{profileUser?.username || "Not provided"}
                                            </div>
                                        </div>

                                        {/* Show email only if viewing own profile */}
                                        {isOwnProfile && (
                                            <div className="info-item">
                                                <div className="info-label">📧 Email Address</div>
                                                <div className="info-value">
                                                    {profileUser?.email || "Not provided"}
                                                </div>
                                            </div>
                                        )}

                                        {/* Identity always shown */}
                                        <div className="info-item">
                                            <div className="info-label">🆔 Identity</div>
                                            <div className="info-value">
                                                {(() => {
                                                    const identity =
                                                        profileUser?.identity ||
                                                        profileUser?.role ||
                                                        "reader";
                                                    return (
                                                        identity.charAt(0).toUpperCase() + identity.slice(1)
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Always show bio */}
                                        <div className="info-item">
                                            <div className="info-label">📝 Bio</div>
                                            <div className="info-value">
                                                {profileUser?.bio || "Not provided"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* End main-content */}
                </div>
                {/* End content-layout */}
            </div>
            {/* End profile-wrapper */}
        </div>
        // End profile-container
    );
};

export default ProfileHome;