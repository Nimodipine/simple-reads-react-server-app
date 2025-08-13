import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Card, Button, Alert, Spinner, Form, Modal } from "react-bootstrap";
import { FaArrowLeft, FaStar, FaUser, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import "./detail.css";
import "./bookinfo.css";

const API_BASE_URL =
    (import.meta as any)?.env?.VITE_REMOTE_SERVER || "http://localhost:4000";

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

    // add the fields you actually render:
    image?: string;      // used in JSX
    thumbnail?: string;  // keep if backend sometimes sends this
    isbn10?: string;     // used in JSX
    isbn13?: string;     // used in JSX

    googleRating?: number;
    googleRatingsCount?: number;
    internalRating?: number;
    internalRatingsCount?: number;
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

interface BookDetailsSuccess {
    success: true;
    book: Book;
}
interface BookDetailsError {
    success: false;
    message?: string;
}
type BookDetailsResponse = BookDetailsSuccess | BookDetailsError;

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
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [newReview, setNewReview] = useState({ rating: 5, title: "", content: "" });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    // --------- Fetchers ----------
    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/account/profile`, { credentials: "include" });
            const isJSON = res.headers.get("content-type")?.includes("application/json");
            if (res.ok && isJSON) setCurrentUser(await res.json());
        } catch (e) {
            console.error("profile", e);
        }
    };

    const fetchBookDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch(`${API_BASE_URL}/api/books/${googleId}`);
            const isJSON = res.headers.get("content-type")?.includes("application/json");

            if (!res.ok) {
                const data = isJSON ? ((await res.json()) as BookDetailsResponse) : undefined;
                setError(
                    (data && "message" in data && data.message) ||
                    (res.status === 404 ? "Book not found" : "Failed to load book details")
                );
                return;
            }
            if (!isJSON) {
                setError("Failed to load book details");
                return;
            }
            const data = (await res.json()) as BookDetailsResponse;
            if (data.success === true) setBook(data.book);
            else setError(data.message ?? "Book not found");
        } catch (e) {
            console.error("book", e);
            setError("Failed to load book details");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookReviews = async () => {
        try {
            setReviewsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/reviews/book/${googleId}`);
            const isJSON = res.headers.get("content-type")?.includes("application/json");
            setReviews(res.ok && isJSON ? await res.json() : []);
        } catch {
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    const checkIfFavorited = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/favorites`, { credentials: "include" });
            const isJSON = res.headers.get("content-type")?.includes("application/json");
            if (res.ok && isJSON) {
                const favorites = await res.json();
                setIsFavorited(Array.isArray(favorites) && favorites.some((f: any) => f.book === googleId));
            }
        } catch { }
    };

    // --------- Effects ----------
    useEffect(() => {
        if (!googleId) return;
        fetchCurrentUser();
        fetchBookDetails();
        fetchBookReviews();
        // don't check favorites until we know the user
    }, [googleId]);

    useEffect(() => {
        if (googleId && currentUser) checkIfFavorited();
    }, [googleId, currentUser]);

    // --------- Helpers ----------
    const renderStars = (
        rating: number,
        ratingsCount?: number,
        showCount = true,
        interactive = false,
        onRatingChange?: (rating: number) => void
    ) => {
        if (!rating && !interactive) return null;
        const stars = [];
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            const isActive = interactive && i < newReview.rating;
            const starClass = interactive
                ? isActive
                    ? "star-interactive-active"
                    : "star-interactive"
                : i < full
                    ? "star-filled"
                    : i === full && half
                        ? "star-half"
                        : "star-empty";
            stars.push(
                <FaStar
                    key={i}
                    className={starClass}
                    onClick={interactive && onRatingChange ? () => onRatingChange(i + 1) : undefined}
                    style={interactive ? { cursor: "pointer" } : {}}
                />
            );
        }

        return (
            <div className="rating-display">
                <div className="stars">{stars}</div>
                {showCount && !interactive && (
                    <span className="rating-text">
                        {rating.toFixed(1)} {ratingsCount && `(${ratingsCount} reviews)`}
                    </span>
                )}
                {interactive && <span className="rating-value">({rating}/5)</span>}
            </div>
        );
    };

    const formatDate = (s: string) => {
        try {
            return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        } catch {
            return s;
        }
    };

    const userHasReviewed = !!reviews.find((r) => currentUser && r.user._id === currentUser._id);

    // --------- Early states ----------
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

    if (error || !book) {
        return (
            <Container className="mt-4">
                <Alert variant="danger" className="error-alert">
                    <h4>📚 Oops! Book Not Found</h4>
                    <p>{error || "The book you're looking for doesn't exist or has been removed."}</p>
                    <div className="mt-3">
                        <Button variant="outline-danger" onClick={() => navigate("/search")} className="me-2">
                            <FaArrowLeft className="me-2" />
                            Back to Search
                        </Button>
                        <Button variant="primary" onClick={() => navigate("/")}>Go to Home</Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    // --------- Main render ----------
    return (
        <div className="book-info-page">
            <Container className="py-4">
                {/* SECTION 1: Book Info */}
                <section className="book-info-card p-4 mb-4">
                    <header className="book-header">
                        <h1 className="book-title">{book.title || "Untitled"}</h1>
                        <div className="book-authors">
                            <span className="authors-label">By </span>
                            {(book.authors?.length ? book.authors : ["Unknown author"]).map((a, i) => (
                                <span key={i}>
                                    <a className="author-link" href={`#/Search?author=${encodeURIComponent(a)}`}>{a}</a>
                                    {i < (book.authors?.length ?? 1) - 1 ? ", " : ""}
                                </span>
                            ))}
                        </div>
                    </header>

                    <div className="row mt-3">
                        {/* Image */}
                        <div className="col-12 col-md-4 mb-3">
                            {book.image || book.thumbnail ? (
                                <img className="book-cover-image" src={book.image || book.thumbnail!} alt={book.title} />
                            ) : (
                                <div className="book-cover-placeholder">📚</div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="col-12 col-md-8">
                            <div className="book-metadata">
                                <div className="metadata-item">
                                    <span className="metadata-label">Published:</span>
                                    <span className="metadata-value">{book.publishedDate ?? "—"}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Pages:</span>
                                    <span className="metadata-value">{book.pageCount ?? "—"}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Publisher:</span>
                                    <span className="metadata-value">{book.publisher ?? "—"}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Language:</span>
                                    <span className="metadata-value">{book.language?.toUpperCase?.() ?? "—"}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">ISBN:</span>
                                    <span className="metadata-value">{book.isbn13 ?? book.isbn10 ?? "—"}</span>
                                </div>

                                <div className="categories-section mt-3">
                                    <div className="section-title">Categories</div>
                                    <div className="categories-list">
                                        {(book.categories?.length ? book.categories : ["Uncategorized"]).map((c, i) => (
                                            <a key={i} href={`#/Search?category=${encodeURIComponent(c)}`} className="category-tag">
                                                <span className="badge category-badge">{c}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {book.description && (
                                <div className="book-description">
                                    <div className="section-title">Description</div>
                                    <div className="description-content" dangerouslySetInnerHTML={{ __html: book.description }} />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* SECTION 2: Add Review */}
                <section className="reviews-card">
                    <div className="reviews-header p-3">
                        <div className="reviews-header-content">
                            <h5 className="reviews-title m-0">Add your review</h5>
                            {currentUser && !userHasReviewed && (
                                <Button variant="light" size="sm" onClick={() => setShowReviewModal(true)} className="write-review-btn">
                                    <FaPlus className="me-1" />
                                    Write Review
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="reviews-body">
                        {/* Community Reviews */}
                        <Card className="mt-3">
                            <Card.Header>
                                <FaUser className="me-2" />
                                Community Reviews ({reviews.length})
                            </Card.Header>
                            <Card.Body>
                                {reviewsLoading ? (
                                    <div className="text-center py-4">
                                        <Spinner animation="border" size="sm" />
                                        <span className="ms-2">Loading reviews...</span>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="no-reviews">
                                        <div className="no-reviews-icon">📝</div>
                                        <h6>No reviews yet</h6>
                                        <p>Be the first to share your thoughts about this book!</p>
                                        {currentUser && (
                                            <Button variant="primary" onClick={() => setShowReviewModal(true)}>
                                                Write the First Review
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="reviews-list">
                                        {reviews.map((review) => (
                                            <div key={review._id} className="review-item">
                                                <div className="review-header">
                                                    <div className="reviewer-info">
                                                        <Link to={`/profile/${review.user._id}`} className="reviewer-name">
                                                            {review.user.firstName} {review.user.lastName}
                                                        </Link>
                                                        <span className="review-date">{formatDate(review.createdAt)}</span>
                                                    </div>
                                                    <div className="review-actions">
                                                        {renderStars(review.rating, undefined, false)}
                                                        {currentUser && currentUser._id === review.user._id && (
                                                            <div className="user-actions">
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingReview(review);
                                                                        setNewReview({ rating: review.rating, title: review.title, content: review.content });
                                                                        setShowReviewModal(true);
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
                                                                            const res = await fetch(`${API_BASE_URL}/api/reviews/${review._id}`, { method: "DELETE" });
                                                                            if (res.ok) {
                                                                                fetchBookReviews();
                                                                                fetchBookDetails();
                                                                            } else {
                                                                                const d = await res.json();
                                                                                alert(d.message || "Error deleting review");
                                                                            }
                                                                        } catch (e) {
                                                                            alert("Error deleting review");
                                                                        }
                                                                    }}
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

            {/* Review Modal (inside same root) */}
            <Modal
                show={showReviewModal}
                onHide={() => {
                    setShowReviewModal(false);
                    setEditingReview(null);
                    setNewReview({ rating: 5, title: "", content: "" });
                }}
                size="lg"
                className="review-modal"
            >
                <Modal.Header closeButton className="review-modal-header">
                    <Modal.Title>{editingReview ? "Edit Your Review" : "Write a Review"}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="review-modal-body">
                    <div className="review-book-info">
                        {(book.image || book.thumbnail) && (
                            <img src={book.image || book.thumbnail!} alt={book.title} className="review-book-cover" />
                        )}
                        <div>
                            <h6>{book.title}</h6>
                            <p className="text-muted">by {(book.authors || []).join(", ")}</p>
                        </div>
                    </div>

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="review-form-label">Your Rating</Form.Label>
                            <div className="rating-input">
                                {renderStars(newReview.rating, undefined, false, true, (r) => setNewReview((p) => ({ ...p, rating: r })))}
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="review-form-label">Review Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={newReview.title}
                                onChange={(e) => setNewReview((p) => ({ ...p, title: e.target.value }))}
                                placeholder="Give your review a title..."
                                className="review-form-input"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="review-form-label">Your Review</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={newReview.content}
                                onChange={(e) => setNewReview((p) => ({ ...p, content: e.target.value }))}
                                placeholder="What did you think of this book? Share your thoughts..."
                                className="review-form-input"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="review-modal-footer">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowReviewModal(false);
                            setEditingReview(null);
                            setNewReview({ rating: 5, title: "", content: "" });
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={async () => {
                            if (!currentUser) return alert("Please log in to write a review");
                            if (!newReview.title.trim() || !newReview.content.trim()) return;

                            try {
                                setSubmitLoading(true);
                                const method = editingReview ? "PUT" : "POST";
                                const url = editingReview
                                    ? `${API_BASE_URL}/api/reviews/${editingReview._id}`
                                    : `${API_BASE_URL}/api/reviews`;

                                const res = await fetch(url, {
                                    method,
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        book: googleId,
                                        rating: newReview.rating,
                                        title: newReview.title,
                                        content: newReview.content,
                                    }),
                                });

                                if (res.ok) {
                                    setShowReviewModal(false);
                                    setEditingReview(null);
                                    setNewReview({ rating: 5, title: "", content: "" });
                                    fetchBookReviews();
                                    fetchBookDetails();
                                } else {
                                    const d = await res.json();
                                    alert(d.message || "Error submitting review");
                                }
                            } catch (e) {
                                alert("Error submitting review");
                            } finally {
                                setSubmitLoading(false);
                            }
                        }}
                        disabled={submitLoading || !newReview.title.trim() || !newReview.content.trim()}
                    >
                        {submitLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                {editingReview ? "Updating..." : "Submitting..."}
                            </>
                        ) : editingReview ? (
                            "Update Review"
                        ) : (
                            "Submit Review"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default BookInfo;
