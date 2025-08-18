import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import {
    FaArrowLeft,
    FaStar,
    FaUser,
    FaEdit,
    FaTrash,
    FaHeart,
    FaRegHeart,
    FaLock,
    FaHome,
} from "react-icons/fa";
import axiosWithCredentials from "../client";
import "./detail.css";
import "./bookinfo.css";

// ---- Types ----
interface Book {
    _id: string;
    googleId: string;
    title: string;
    authors: string[];
    description: string;
    publishedDate: string;
    categories: string[];
    pageCount: number;
    language: string;
    publisher?: string;
    image?: string;
    thumbnail?: string;
    isbn10?: string;
    isbn13?: string;
    googleRating?: number;
    googleRatingsCount?: number;
    viewCount?: number;
    favoriteCount?: number;
    previewLink?: string;
    infoLink?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface Review {
    _id: string;
    book: string;
    user: { _id: string; firstName: string; lastName: string; username: string };
    rating: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface CurrentUser {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    role?: string;
}

// BookDetailsResponse types removed - no longer needed with axios

const BookInfo: React.FC = () => {
    const { googleId } = useParams<{ googleId: string }>();
    const navigate = useNavigate();

    const [book, setBook] = useState<Book | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    // Authentication states
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Review form state
    const [reviewTitle, setReviewTitle] = useState("");
    const [reviewContent, setReviewContent] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
    const [isEditingReview, setIsEditingReview] = useState(false);

    // --------- Authentication Check ----------
    const checkAuthentication = async () => {
        try {
            setAuthLoading(true);
            console.log("Checking authentication status...");

            const response = await axiosWithCredentials.get('/api/profile');
            console.log("User authenticated:", response.data);
            setIsAuthenticated(true);
            setCurrentUser(response.data);

        } catch (error: any) {
            console.log("User not authenticated");
            setIsAuthenticated(false);
            setCurrentUser(null);
        } finally {
            setAuthLoading(false);
        }
    };

    // --------- Navigation Helper ----------
    const navigateToUserProfile = (userId: string) => {
        if (userId === currentUser?._id) {
            navigate("/Account/Profile");
        } else {
            navigate(`/Account/Profile/${userId}`);
        }
    };

    const handleBackNavigation = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/search');
        }
    };

    const handleSignIn = () => {
        navigate('/Account/Signin', {
            state: {
                returnTo: `/details/${googleId}`,
                bookTitle: book?.title
            }
        });
    };

    // --------- Fetchers ----------
    const fetchBookDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await axiosWithCredentials.get(`/api/books/${googleId}`);

            if (response.data.success === true) {
                setBook(response.data.book);
            } else {
                setError(response.data.message ?? "Book not found");
            }
        } catch (error: any) {
            console.error("Error fetching book details:", error);
            if (error.response?.status === 404) {
                setError("Book not found");
            } else {
                setError("Failed to load book details");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookReviews = async () => {
        try {
            setReviewsLoading(true);
            const response = await axiosWithCredentials.get(`/api/reviews/book/${googleId}`);
            setReviews(response.data || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    const checkIfFavorited = async () => {
        try {
            const response = await axiosWithCredentials.get('/api/favorites');
            const favorites = response.data;
            setIsFavorited(
                Array.isArray(favorites) &&
                favorites.some((f: any) => f.book === googleId)
            );
        } catch (error) {
            console.error("Error checking favorites:", error);
            setIsFavorited(false);
        }
    };

    // --------- Favorite Toggle ----------
    const handleToggleFavorite = async () => {
        if (!currentUser) {
            alert("Please sign in to add books to favorites");
            return;
        }

        setIsTogglingFavorite(true);

        try {
            const method = isFavorited ? 'delete' : 'post';
            await axiosWithCredentials[method](`/api/favorites/${googleId}`);

            setIsFavorited(!isFavorited);
            console.log(isFavorited ? "Removed from favorites" : "Added to favorites");

        } catch (error: any) {
            console.error("Error toggling favorite:", error);

            if (error.response?.status === 401) {
                alert("Please sign in again to manage favorites");
            } else {
                alert(error.response?.data?.message || "Failed to update favorites");
            }
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    // --------- Review Submission & Editing ----------
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reviewTitle.trim() || !reviewContent.trim() || reviewRating === 0) {
            setReviewError("Please fill in all fields and select a rating");
            return;
        }

        setIsSubmittingReview(true);
        setReviewError(null);

        const userReview = reviews.find(
            (r) => currentUser && r.user._id === currentUser._id
        );
        const isEditing = isEditingReview && !!userReview;

        try {
            const reviewData = {
                title: reviewTitle.trim(),
                content: reviewContent.trim(),
                rating: reviewRating,
            };

            if (isEditing && userReview) {
                await axiosWithCredentials.put(`/api/reviews/${userReview._id}`, reviewData);
            } else {
                await axiosWithCredentials.post('/api/reviews', {
                    ...reviewData,
                    book: googleId,
                });
            }

            setReviewTitle("");
            setReviewContent("");
            setReviewRating(0);
            setIsEditingReview(false);
            await fetchBookReviews();
            await fetchBookDetails();
            setReviewError(null);
            setReviewSuccess(
                isEditing ? "Review updated successfully!" : "Review submitted successfully!"
            );

        } catch (error: any) {
            console.error("Error submitting review:", error);

            if (error.response?.status === 401) {
                setReviewError("Authentication required. Please sign in again and try submitting your review.");
            } else {
                setReviewError(
                    error.response?.data?.message || `Failed to submit review (${error.response?.status || 'Network Error'})`
                );
            }
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // --------- Effects ----------
    useEffect(() => {
        if (!googleId) return;
        checkAuthentication();
    }, [googleId]);

    useEffect(() => {
        if (!googleId || isAuthenticated === null) return;

        if (isAuthenticated) {
            fetchBookDetails();
            fetchBookReviews();
            checkIfFavorited();
        }
    }, [googleId, isAuthenticated]);

    // --------- Helpers ----------
    const renderStars = (
        rating: number,
        ratingsCount?: number,
        showCount = true
    ) => {
        if (!rating) return null;
        const stars = [];
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            const starClass =
                i < full
                    ? "star-filled"
                    : i === full && half
                        ? "star-half"
                        : "star-empty";
            stars.push(<FaStar key={i} className={starClass} />);
        }

        return (
            <div className="rating-display">
                <div className="stars">{stars}</div>
                {showCount && (
                    <span className="rating-text">
                        {rating.toFixed(1)} {ratingsCount && `(${ratingsCount} reviews)`}
                    </span>
                )}
            </div>
        );
    };

    const renderInteractiveStars = (
        currentRating: number,
        onRatingChange: (rating: number) => void
    ) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar
                    key={i}
                    className={
                        i <= currentRating ? "star-interactive-active" : "star-interactive"
                    }
                    onClick={() => onRatingChange(i)}
                    style={{ cursor: "pointer", fontSize: "1.5rem", marginRight: "5px" }}
                />
            );
        }
        return <div className="interactive-stars">{stars}</div>;
    };

    const formatDate = (s: string) => {
        try {
            return new Date(s).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return s;
        }
    };

    const userHasReviewed = !!reviews.find(
        (r) => currentUser && r.user._id === currentUser._id
    );

    // --------- Authentication Loading State ----------
    if (authLoading) {
        return (
            <Container className="mt-4">
                <div className="text-center loading-container">
                    <Spinner animation="border" role="status" className="loading-spinner">
                        <span className="visually-hidden">Checking authentication...</span>
                    </Spinner>
                    <p className="mt-3 loading-text">Verifying access...</p>
                </div>
            </Container>
        );
    }

    // --------- Authentication Required State ----------
    if (isAuthenticated === false) {
        return (
            <Container className="mt-4">
                <Alert variant="warning" className="auth-required-alert" style={{ marginTop: '40px', marginLeft: '40px' }}>
                    <div className="text-center">
                        <FaLock size={48} className="mb-3 text-warning" />
                        <h4>Sign In Required</h4>
                        <p className="mb-4" style={{ marginTop: '20px', marginLeft: '20px' }}>
                            You need to be signed in to view detailed book information,
                            write reviews, and manage your favorites.
                        </p>
                        <div className="d-flex gap-3 justify-content-center" style={{ marginTop: '30px' }}>
                            <Button
                                variant="primary"
                                onClick={handleSignIn}
                                size="lg"
                                style={{ marginRight: '15px' }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant="outline-secondary"
                                onClick={handleBackNavigation}
                                size="lg"
                            >
                                <FaArrowLeft className="me-2" />
                                Go Back
                            </Button>
                        </div>
                    </div>
                </Alert>
            </Container>
        );
    }

    // --------- Book Loading State ----------
    if (isLoading) {
        return (
            <Container className="mt-4">
                <div className="text-center loading-container">
                    <Spinner animation="border" role="status" className="loading-spinner">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-3 loading-text">Loading book details...</p>
                </div>
            </Container>
        );
    }

    // --------- Error State ----------
    if (error || !book) {
        return (
            <Container className="mt-4">
                <Alert variant="danger" className="error-alert">
                    <h4>📚 Oops! Book Not Found</h4>
                    <p>
                        {error ||
                            "The book you're looking for doesn't exist or has been removed."}
                    </p>
                    <div className="mt-3">
                        <Button
                            variant="outline-danger"
                            onClick={() => navigate("/Account/Profile")}
                            style={{ marginRight: '1rem' }}
                        >
                            <FaArrowLeft className="me-2" />
                            Back to Profile
                        </Button>
                        <Button variant="primary" onClick={() => navigate("/home")}>
                            <FaHome className="me-2" />
                            Go to Home
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    // --------- Main render ----------
    return (
        <div className="book-info-page">
            <Container className="py-4">
                {/* Navigation Buttons */}
                <div style={{ position: 'relative' }}>
                    <Button
                        variant="outline-primary"
                        onClick={handleBackNavigation}
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
                        title="Go Back"
                    >
                        <FaArrowLeft style={{ fontSize: '20px' }} />
                    </Button>

                    <Button
                        variant="outline-primary"
                        onClick={() => navigate('/home')}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '90px',
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
                        <FaHome style={{ fontSize: '20px' }} />
                    </Button>
                </div>

                {/* Book Info Section */}
                <section className="book-info-card p-4 mb-4">
                    <header className="book-header">
                        <h1 className="book-title">{book.title || "Untitled"}</h1>
                        <div className="book-authors">
                            <span className="authors-label">By </span>
                            {(book.authors?.length ? book.authors : ["Unknown author"]).map(
                                (a, i) => (
                                    <span key={i}>
                                        <a
                                            className="author-link"
                                            href={`#/Search?author=${encodeURIComponent(a)}`}
                                        >
                                            {a}
                                        </a>
                                        {i < (book.authors?.length ?? 1) - 1 ? ", " : ""}
                                    </span>
                                )
                            )}
                        </div>
                    </header>

                    <div className="book-content-row mt-3">
                        <div className="book-image-metadata-section">
                            <div className="book-image-column">
                                {book.image || book.thumbnail ? (
                                    <img
                                        className="book-cover-image"
                                        src={book.image || book.thumbnail!}
                                        alt={book.title}
                                    />
                                ) : (
                                    <div className="book-cover-placeholder">📚</div>
                                )}
                            </div>

                            <div className="metadata-section">
                                <div className="book-metadata">
                                    <div className="metadata-item">
                                        <span className="metadata-label">Published:</span>
                                        <span className="metadata-value">
                                            {book.publishedDate ?? "—"}
                                        </span>
                                    </div>
                                    <div className="metadata-item">
                                        <span className="metadata-label">Pages:</span>
                                        <span className="metadata-value">
                                            {book.pageCount ?? "—"}
                                        </span>
                                    </div>
                                    <div className="metadata-item">
                                        <span className="metadata-label">Publisher:</span>
                                        <span className="metadata-value">
                                            {book.publisher ?? "—"}
                                        </span>
                                    </div>
                                    <div className="metadata-item">
                                        <span className="metadata-label">Language:</span>
                                        <span className="metadata-value">
                                            {book.language?.toUpperCase?.() ?? "—"}
                                        </span>
                                    </div>
                                    <div className="metadata-item">
                                        <span className="metadata-label">ISBN:</span>
                                        <span className="metadata-value">
                                            {book.isbn13 ?? book.isbn10 ?? "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="book-details-column">
                            <div className="categories-section">
                                <div className="section-title">Categories</div>
                                <div className="categories-list">
                                    {(book.categories?.length
                                        ? book.categories
                                        : ["Uncategorized"]
                                    ).map((c, i) => (
                                        <a
                                            key={i}
                                            href={`#/Search?category=${encodeURIComponent(c)}`}
                                            className="category-tag"
                                        >
                                            <span className="badge category-badge">{c}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="favorite-section">
                                <Button
                                    variant={isFavorited ? "danger" : "outline-danger"}
                                    onClick={handleToggleFavorite}
                                    disabled={isTogglingFavorite}
                                    className="favorite-toggle-btn"
                                >
                                    {isTogglingFavorite ? (
                                        <Spinner animation="border" size="sm" className="me-2" />
                                    ) : (
                                        <>
                                            {isFavorited ? (
                                                <FaHeart className="me-2" />
                                            ) : (
                                                <FaRegHeart className="me-2" />
                                            )}
                                        </>
                                    )}
                                    {isTogglingFavorite
                                        ? "Updating..."
                                        : isFavorited
                                            ? " Remove from Favorites"
                                            : "Add to Favorites"}
                                </Button>
                            </div>

                            {book.description && (
                                <div className="book-description">
                                    <div className="section-title">Description</div>
                                    <div
                                        className="description-content"
                                        dangerouslySetInnerHTML={{ __html: book.description }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* User's Review Section */}
                {currentUser && userHasReviewed && (
                    <section className="user-review-card mb-4">
                        <Card>
                            <Card.Header>
                                <h5 className="m-0">Your Review</h5>
                            </Card.Header>
                            <Card.Body>
                                {reviews
                                    .filter((review) => review.user._id === currentUser._id)
                                    .map((review) => (
                                        <div key={review._id} className="review-item">
                                            <div className="review-header">
                                                <div className="reviewer-info">
                                                    <span className="reviewer-name">
                                                        {review.user.firstName} {review.user.lastName}
                                                    </span>
                                                    <span className="review-date">
                                                        {formatDate(review.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="review-actions">
                                                    {renderStars(review.rating, undefined, false)}
                                                    <div className="user-actions">
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setReviewTitle(review.title);
                                                                setReviewContent(review.content);
                                                                setReviewRating(review.rating);
                                                                setIsEditingReview(true);
                                                            }}
                                                            className="me-2"
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={async () => {
                                                                if (!confirm("Delete this review?")) return;
                                                                try {
                                                                    await axiosWithCredentials.delete(`/api/reviews/${review._id}`);
                                                                    fetchBookReviews();
                                                                    fetchBookDetails();
                                                                } catch (error: any) {
                                                                    alert(error.response?.data?.message || "Error deleting review");
                                                                }
                                                            }}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="review-content">
                                                <h6 className="review-title">{review.title}</h6>
                                                <p className="review-text">{review.content}</p>
                                            </div>
                                        </div>
                                    ))}
                            </Card.Body>
                        </Card>
                    </section>
                )}

                {/* Add/Edit Review Form */}
                {currentUser && (!userHasReviewed || isEditingReview) ? (
                    <section className="add-review-card mb-4">
                        <Card>
                            <Card.Header>
                                <h5 className="m-0">
                                    {isEditingReview ? "Edit Your Review" : "Add Your Review"}
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleSubmitReview}>
                                    {reviewError && (
                                        <Alert variant="danger" className="mb-3">
                                            {reviewError}
                                        </Alert>
                                    )}
                                    {reviewSuccess && (
                                        <Alert variant="success" className="mb-3">
                                            {reviewSuccess}
                                        </Alert>
                                    )}

                                    <Form.Group className="mb-3 rating-form-group">
                                        <Form.Label>Rating</Form.Label>
                                        <div>
                                            {renderInteractiveStars(reviewRating, setReviewRating)}
                                        </div>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Review Title</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter a title for your review"
                                            value={reviewTitle}
                                            onChange={(e) => setReviewTitle(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Your Review</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            placeholder="Share your thoughts about this book..."
                                            value={reviewContent}
                                            onChange={(e) => setReviewContent(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isSubmittingReview}
                                        >
                                            {isSubmittingReview ? (
                                                <>
                                                    <Spinner
                                                        animation="border"
                                                        size="sm"
                                                        className="me-2"
                                                    />
                                                    {isEditingReview ? "Updating..." : "Submitting..."}
                                                </>
                                            ) : (
                                                isEditingReview ? "Update Review" : "Submit Review"
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline-secondary"
                                            style={{ marginTop: "16px", marginLeft: "16px" }}
                                            onClick={() => {
                                                setReviewTitle("");
                                                setReviewContent("");
                                                setReviewRating(0);
                                                setReviewError(null);
                                                setReviewSuccess(null);
                                                setIsEditingReview(false);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </section>
                ) : null}

                {/* All Reviews Section */}
                <section className="reviews-card">
                    <div className="reviews-header p-3">
                        <div className="reviews-header-content">
                            <h5 className="reviews-title m-0">
                                Community Reviews ({reviews.length})
                            </h5>
                        </div>
                    </div>
                    <div className="reviews-body">
                        <Card className="mt-3">
                            <Card.Header>
                                <FaUser className="me-2" />
                                All Reviews ({reviews.length})
                            </Card.Header>
                            <Card.Body>
                                {reviewsLoading ? (
                                    <div className="text-center py-4">
                                        <Spinner animation="border" size="sm" />
                                        <span className="ms-2">Loading reviews...</span>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="no-reviews">
                                        <div className="no-reviews-icon">📖</div>
                                        <h6>No reviews yet</h6>
                                        <p>Be the first to share your thoughts about this book!</p>
                                    </div>
                                ) : (
                                    <div className="reviews-list">
                                        {reviews.map((review) => (
                                            <div key={review._id} className="review-item">
                                                <div className="review-header">
                                                    <div className="reviewer-info">
                                                        <span
                                                            className="reviewer-name"
                                                            onClick={() => navigateToUserProfile(review.user._id)}
                                                            style={{
                                                                cursor: "pointer",
                                                                color: "#007bff",
                                                                textDecoration: "none"
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.textDecoration = "underline";
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.textDecoration = "none";
                                                            }}
                                                        >
                                                            @{review.user.username}
                                                        </span>
                                                        <span className="review-date">
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="review-actions">
                                                        {renderStars(review.rating, undefined, false)}
                                                        {currentUser && (
                                                            currentUser.role === "writer" ||
                                                            review.user._id === currentUser._id
                                                        ) && (
                                                                <div className="user-actions ms-2">
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={async () => {
                                                                            const confirmMessage = review.user._id === currentUser._id
                                                                                ? "Delete your review?"
                                                                                : `Delete review by @${review.user.username}?`;

                                                                            if (!confirm(confirmMessage)) return;

                                                                            try {
                                                                                await axiosWithCredentials.delete(`/api/reviews/${review._id}`);
                                                                                fetchBookReviews();
                                                                                fetchBookDetails();
                                                                            } catch (error: any) {
                                                                                alert(error.response?.data?.message || "Error deleting review");
                                                                            }
                                                                        }}
                                                                        title={review.user._id === currentUser._id
                                                                            ? "Delete your review"
                                                                            : "Delete this review (Writer privilege)"}
                                                                    >
                                                                        <FaTrash />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                                <div className="review-content">
                                                    <h6 className="review-title">{review.title}</h6>
                                                    <p className="review-text">{review.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </section>
            </Container>
        </div>
    );
};

export default BookInfo;