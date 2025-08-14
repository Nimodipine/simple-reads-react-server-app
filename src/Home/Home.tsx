import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
    Card,
    Col,
    Container,
    Form,
    FormControl,
    ListGroup,
    Row,
} from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navigation from "../Navigation";
import Header from "../Header";
import "./home.css";

const API_BASE_URL =
    import.meta.env.VITE_REMOTE_SERVER || "http://localhost:4000";

// Removed HomeProps, use Redux state instead

interface Book {
    _id: string;
    googleId: string;
    title: string;
    authors: string[];
    thumbnail?: string;
    categories?: string[];
    internalRatingsCount?: number;
    viewCount?: number;
    favoriteCount?: number;
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    language?: string;
    averageRating?: number;
    ratingsCount?: number;
    previewLink?: string;
    infoLink?: string;
}

interface Review {
    _id: string;
    title: string;
    content: string;
    rating: number;
    createdAt: string;
    user: {
        _id: string;
        username: string;
    };
    book:
    | {
        _id: string;
        googleId: string;
        title: string;
    }
    | string;
}

export default function Home() {
    const currentUser = useSelector((state: any) => state.account.currentUser);
    const isLoggedIn = !!currentUser;
    const user = currentUser
        ? {
            _id: currentUser._id,
            name: currentUser.name || currentUser.username,
            handle: currentUser.handle || currentUser.username,
            avatarUrl: currentUser.avatarUrl,
        }
        : undefined;
    const [searchQuery, setSearchQuery] = useState("");
    const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
    const [topReviews, setTopReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Store book titles for reviews by googleId
    const [reviewBookTitles, setReviewBookTitles] = useState<{
        [googleId: string]: string;
    }>({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchHomeData();
    }, [isLoggedIn, currentUser?._id]);

    // Fetch book titles for reviews when topReviews changes
    useEffect(() => {
        if (!topReviews || topReviews.length === 0) return;

        topReviews.forEach((review) => {
            // Handle both cases: book as string or book as object
            const googleId =
                typeof review.book === "string" ? review.book : review.book?.googleId;

            if (!googleId || reviewBookTitles[googleId]) return;

            // Fetch each book title individually and update state incrementally
            fetch(`${API_BASE_URL}/api/books/${googleId}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data && data.success && data.book && data.book.title) {
                        setReviewBookTitles((prev) => ({
                            ...prev,
                            [googleId]: data.book.title,
                        }));
                    }
                })
                .catch(() => {
                    setReviewBookTitles((prev) => ({
                        ...prev,
                        [googleId]: "Unknown Book",
                    }));
                });
        });
    }, [topReviews]);

    const fetchHomeData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch trending books and top reviews in parallel
            const [booksResponse, reviewsResponse] = await Promise.all([
                fetchTrendingBooks(),
                fetchTopReviews(),
            ]);

            setTrendingBooks(booksResponse);
            setTopReviews(reviewsResponse);
        } catch (err) {
            console.error("Error fetching home data:", err);
            setError("Failed to load content. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingBooks = async (): Promise<Book[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/books/top-engagement`, {
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                return data.books || [];
            }
            return [];
        } catch (error) {
            console.error("Error fetching trending books:", error);
            return [];
        }
    };

    const fetchTopReviews = async (): Promise<Review[]> => {
        try {
            let response;

            if (isLoggedIn && user?._id) {
                // Fetch reviews from users that the current user is following
                response = await fetch(
                    `${API_BASE_URL}/api/profile/${user._id}/following/reviews`,
                    {
                        credentials: "include",
                    }
                );
            } else {
                // Fetch random reviews for non-logged-in users or users without _id
                response = await fetch(`${API_BASE_URL}/api/reviews/random`, {
                    credentials: "include",
                });
            }

            if (response.ok) {
                const data = await response.json();
                const reviews = Array.isArray(data) ? data : data.reviews || [];

                // The endpoints should already return 3-5 reviews as specified
                // but we can limit them here as a safety measure
                return reviews.slice(0, isLoggedIn ? 5 : 3);
            }

            // Fallback: if the new endpoints fail, try the random reviews endpoint
            if (isLoggedIn) {
                const fallbackResponse = await fetch(
                    `${API_BASE_URL}/api/reviews/random`,
                    {
                        credentials: "include",
                    }
                );

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    const fallbackReviews = Array.isArray(fallbackData)
                        ? fallbackData
                        : fallbackData.reviews || [];
                    return fallbackReviews.slice(0, 3);
                }
            }

            return [];
        } catch (error) {
            console.error("Error fetching reviews:", error);
            return [];
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const url = `${API_BASE_URL}/api/books/search?q=${encodeURIComponent(
                searchQuery.trim()
            )}&maxResults=1`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Search failed");

            const data = await res.json();
            if (data.success && data.books.length > 0) {
                // Navigate to the first matching book's details page
                navigate(`/details/${data.books[0].googleId}`);
            } else {
                // No book found — optionally show message or fall back to search page
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
        } catch (err) {
            console.error("Error searching:", err);
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleBookClick = (book: Book) => {
        // Navigate to details page with the book's Google ID
        navigate(`/details/${book.googleId}`);
    };

    const renderStars = (rating: number, ratingsCount?: number) => {
        if (!rating) return null;

        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <span key={i} className="star-filled">
                        ★
                    </span>
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <span key={i} className="star-half">
                        ★
                    </span>
                );
            } else {
                stars.push(
                    <span key={i} className="star-empty">
                        ☆
                    </span>
                );
            }
        }

        return (
            <div className="book-rating">
                <div className="stars">{stars}</div>
                <span className="rating-text">
                    {rating.toFixed(1)} {ratingsCount && `(${ratingsCount})`}
                </span>
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    if (loading) {
        return (
            <div className="app-layout">
                <div className="left-rail">
                    <Navigation />
                </div>
                <Header isLoggedIn={isLoggedIn} user={user} />
                <div className="home-layout">
                    <Container fluid>
                        <div
                            className="d-flex justify-content-center align-items-center"
                            style={{ height: "400px" }}
                        >
                            <div className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading content...</p>
                            </div>
                        </div>
                    </Container>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            {/* Fixed Navigation */}
            <div className="left-rail">
                <Navigation />
            </div>

            {/* Top Header */}
            <Header isLoggedIn={isLoggedIn} user={user} />

            {/* Main Content */}
            <div className="home-layout">
                <Container fluid>
                    <Row className="g-0">
                        <Col xs={12} className="center-feed">
                            {/* Large Search Bar Section */}
                            <section className="search-section p-5 mb-4" aria-label="Search">
                                <div className="section-header-search">
                                    <h2 className="section-title">
                                        Discover Your Next Great Read
                                    </h2>
                                    <p className="section-subtitle">
                                        Search for books, authors, reviews, and more
                                    </p>
                                </div>

                                {/* Enhanced Search Form */}
                                <Form
                                    role="search"
                                    className="d-flex justify-content-center search-form"
                                    onSubmit={handleSearch}
                                >
                                    <div className="search-input-container">
                                        <FormControl
                                            id="home-search-input"
                                            name="searchQuery"
                                            type="search"
                                            placeholder="Search for books, authors, genres..."
                                            aria-label="Search books"
                                            className="search-input-enhanced"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#667eea";
                                                e.target.style.boxShadow =
                                                    "0 8px 24px rgba(102, 126, 234, 0.15)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "#e2e8f0";
                                                e.target.style.boxShadow =
                                                    "0 4px 12px rgba(0, 0, 0, 0.1)";
                                            }}
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                className="clear-search-btn"
                                                onClick={() => setSearchQuery("")}
                                                aria-label="Clear search"
                                            >
                                                <FaTimes />
                                            </button>
                                        )}
                                    </div>
                                </Form>
                            </section>

                            {/* Error Message */}
                            {error && (
                                <div className="alert alert-warning mx-3 mb-4" role="alert">
                                    {error}
                                    <button
                                        className="btn btn-link p-0 ms-2"
                                        onClick={fetchHomeData}
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {/* Two Column Layout for Explore and Community */}
                            <Row className="g-3 px-3">
                                {/* Explore Section - Trending Books */}
                                <Col xs={12} md={6}>
                                    <section
                                        className="explore-section p-4"
                                        aria-label="Trending Books"
                                    >
                                        <div className="section-header">
                                            <h3 className="section-title">Trending Books</h3>
                                            <p className="section-subtitle-small">
                                                {trendingBooks.length > 0
                                                    ? "Popular books in our community"
                                                    : "Discover great books"}
                                            </p>
                                        </div>
                                        <div className="trending-books-container">
                                            {trendingBooks.length > 0 ? (
                                                trendingBooks.map((book, index) => (
                                                    <div key={book._id} className="book-card">
                                                        <Card
                                                            className="h-100 book-card-clickable"
                                                            onClick={() => handleBookClick(book)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <Card.Body className="p-3">
                                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                                    <span className="badge bg-primary rounded-circle ranking-badge">
                                                                        {index + 1}
                                                                    </span>
                                                                    {book.categories &&
                                                                        book.categories.length > 0 && (
                                                                            <span className="badge bg-light text-dark genre-badge">
                                                                                {book.categories[0]}
                                                                            </span>
                                                                        )}
                                                                </div>
                                                                <div className="book-cover-placeholder">
                                                                    {book.thumbnail ? (
                                                                        <img
                                                                            src={book.thumbnail}
                                                                            alt={book.title}
                                                                            className="book-cover-image"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = "none";
                                                                                const nextElement = e.currentTarget
                                                                                    .nextElementSibling as HTMLElement;
                                                                                if (nextElement) {
                                                                                    nextElement.style.display = "block";
                                                                                }
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <span
                                                                        className="book-cover-emoji"
                                                                        style={{
                                                                            display: book.thumbnail
                                                                                ? "none"
                                                                                : "block",
                                                                        }}
                                                                    >
                                                                        📖
                                                                    </span>
                                                                </div>
                                                                <h6 className="book-title" title={book.title}>
                                                                    {truncateText(book.title, 50)}
                                                                </h6>
                                                                <p className="book-author">
                                                                    by {book.authors.join(", ")}
                                                                </p>
                                                            </Card.Body>
                                                        </Card>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-muted">
                                                        No trending books available yet.
                                                    </p>
                                                    <small>Check back later for popular titles!</small>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </Col>

                                {/* Community Section - Top Book Reviews */}
                                <Col xs={12} md={6}>
                                    <section
                                        className="community-section p-4"
                                        aria-label="Community Reviews"
                                    >
                                        <div className="section-header">
                                            <h3 className="section-title">
                                                {isLoggedIn
                                                    ? "Reviews from People You Follow"
                                                    : "Community Reviews"}
                                            </h3>
                                            <p className="section-subtitle-small">
                                                {isLoggedIn
                                                    ? "Latest reviews from users you follow"
                                                    : "Discover what other readers are saying"}
                                            </p>
                                        </div>
                                        <div className="reviews-container">
                                            <ListGroup variant="flush">
                                                {topReviews.length > 0 ? (
                                                    topReviews.map((review, index) => (
                                                        <ListGroup.Item
                                                            key={review._id}
                                                            className="px-0 py-3 border-0 border-bottom review-list-item"
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => {
                                                                const googleId =
                                                                    typeof review.book === "string"
                                                                        ? review.book
                                                                        : review.book?.googleId;
                                                                navigate(`/details/${googleId}`);
                                                            }}
                                                        >
                                                            <div className="review-item-content">
                                                                <div className="review-badge-container">
                                                                    <span className="badge bg-success rounded-circle ranking-badge">
                                                                        {index + 1}
                                                                    </span>
                                                                </div>
                                                                <div className="review-content">
                                                                    <div className="review-header d-flex align-items-center justify-content-between">
                                                                        <h1 className="review-book-title mb-0">
                                                                            {truncateText(
                                                                                (() => {
                                                                                    // Get googleId whether book is string or object
                                                                                    const googleId =
                                                                                        typeof review.book === "string"
                                                                                            ? review.book
                                                                                            : review.book?.googleId;

                                                                                    // Return the title
                                                                                    return (
                                                                                        reviewBookTitles[googleId] ||
                                                                                        (typeof review.book === "object"
                                                                                            ? review.book?.title
                                                                                            : null) ||
                                                                                        "Unknown Book"
                                                                                    );
                                                                                })(),
                                                                                40
                                                                            )}
                                                                        </h1>
                                                                        <div className="review-stars d-flex align-items-center">
                                                                            {renderStars(review.rating)}
                                                                        </div>
                                                                    </div>
                                                                    <p className="review-meta">
                                                                        Review by{" "}
                                                                        <span
                                                                            className="review-reviewer clickable"
                                                                            style={{
                                                                                color: "#2563eb",
                                                                                textDecoration: "underline",
                                                                                cursor: "pointer",
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (review.user?._id) {
                                                                                    navigate(
                                                                                        `/Account/Profile/${review.user._id}`
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            @{review.user?.username || "Anonymous"}
                                                                        </span>
                                                                        <span className="review-date">
                                                                            {" "}
                                                                            • {formatDate(review.createdAt)}
                                                                        </span>
                                                                        {isLoggedIn && (
                                                                            <span className="following-badge">
                                                                                {" "}
                                                                                • Following
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <h6 className="review-title">
                                                                        {review.title}
                                                                    </h6>
                                                                    <p className="review-snippet">
                                                                        {truncateText(review.content, 120)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <p className="text-muted">
                                                            {isLoggedIn
                                                                ? "No reviews from people you follow yet."
                                                                : "No reviews available yet."}
                                                        </p>
                                                        <small>
                                                            {isLoggedIn
                                                                ? "Follow some users to see their reviews here!"
                                                                : "Be the first to write a review!"}
                                                        </small>
                                                    </div>
                                                )}
                                            </ListGroup>
                                        </div>
                                    </section>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
}
