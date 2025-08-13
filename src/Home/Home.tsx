import React, { useState, useEffect } from "react";
import { Card, Col, Container, Form, FormControl, ListGroup, Row } from "react-bootstrap";
import Navigation from "../Navigation";
import Header from "../Header";
import './home.css';

const API_BASE_URL = import.meta.env.VITE_REMOTE_SERVER || 'http://localhost:4000';

export interface HomeProps {
    isLoggedIn: boolean;
    user?: {
        name: string;
        handle: string;
        avatarUrl?: string;
    };
    genericFeed?: React.ReactNode;
    personalizedFeed?: React.ReactNode;
    onSignUp?: () => void;
    onLogIn?: () => void;
    onLogOut?: () => void;
}

interface Book {
    _id: string;
    googleId: string;
    title: string;
    authors: string[];
    thumbnail?: string;
    categories?: string[];
    internalRating?: number;
    internalRatingsCount?: number;
    viewCount?: number;
    favoriteCount?: number;
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
    book: {
        _id: string;
        googleId: string;
        title: string;
    };
}

export default function Home({ isLoggedIn, user, onLogOut }: HomeProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
    const [topReviews, setTopReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch trending books and top reviews in parallel
            const [booksResponse, reviewsResponse] = await Promise.all([
                fetchTrendingBooks(),
                fetchTopReviews()
            ]);

            setTrendingBooks(booksResponse);
            setTopReviews(reviewsResponse);
        } catch (err) {
            console.error('Error fetching home data:', err);
            setError('Failed to load content. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingBooks = async (): Promise<Book[]> => {
        try {
            // Use the existing search endpoint to get popular books
            const response = await fetch(`${API_BASE_URL}/api/books/search?q=bestseller&maxResults=5`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                return data.books || [];
            }

            // Alternative fallback searches
            const fallbackResponse = await fetch(`${API_BASE_URL}/api/books/search?q=popular&maxResults=5`, {
                credentials: 'include'
            });

            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                return fallbackData.books || [];
            }

            return [];
        } catch (error) {
            console.error('Error fetching trending books:', error);
            return [];
        }
    };

    const fetchTopReviews = async (): Promise<Review[]> => {
        try {
            // Use admin reviews endpoint for both logged-in and non-logged-in users
            const response = await fetch(`${API_BASE_URL}/api/admin/reviews`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const allReviews = Array.isArray(data) ? data : data.reviews || [];

                // Sort by creation date (most recent first)
                const sortedReviews = allReviews
                    .sort((a: { createdAt: string | number | Date; }, b: { createdAt: string | number | Date; }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                if (isLoggedIn) {
                    // If logged in, return 4 most recent reviews
                    return sortedReviews.slice(0, 4);
                } else {
                    // If not logged in, return 3 reviews (could be recent or random selection)
                    if (sortedReviews.length <= 3) {
                        return sortedReviews;
                    }

                    // Get 3 random reviews from the most recent 10 to add some variety
                    const recentTen = sortedReviews.slice(0, Math.min(10, sortedReviews.length));
                    const shuffled = recentTen.sort(() => 0.5 - Math.random());
                    return shuffled.slice(0, 3);
                }
            }

            return [];
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to search results page or implement search functionality
            window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <span
                key={i}
                className={i < rating ? 'star-rating' : 'star-rating-empty'}
            >
                ★
            </span>
        ));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <div className="app-layout">
                <div className="left-rail">
                    <Navigation />
                </div>
                <Header isLoggedIn={isLoggedIn} user={user} onLogOut={onLogOut} />
                <div className="home-layout">
                    <Container fluid>
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
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
            <Header
                isLoggedIn={isLoggedIn}
                user={user}
                onLogOut={onLogOut}
            />

            {/* Main Content */}
            <div className="home-layout">
                <Container fluid>
                    <Row className="g-0">
                        <Col xs={12} className="center-feed">

                            {/* Large Search Bar Section */}
                            <section className="search-section p-5 mb-4" aria-label="Search">
                                <div className="section-header-search">
                                    <h2 className="section-title">Discover Your Next Great Read</h2>
                                    <p className="section-subtitle">Search for books, authors, reviews, and more</p>
                                </div>
                                <Form role="search" className="d-flex justify-content-center search-form" onSubmit={handleSearch}>
                                    <div className="search-input-container">
                                        <FormControl
                                            type="search"
                                            placeholder="Search for books, authors, genres..."
                                            aria-label="Search books"
                                            className="search-input-enhanced"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                            }}
                                        />
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
                                    <section className="explore-section p-4" aria-label="Trending Books">
                                        <div className="section-header">
                                            <h3 className="section-title">Trending Books</h3>
                                            <p className="section-subtitle-small">
                                                {trendingBooks.length > 0 ? 'Popular books in our community' : 'Discover great books'}
                                            </p>
                                        </div>
                                        <div className="trending-books-container">
                                            {trendingBooks.length > 0 ? (
                                                trendingBooks.map((book, index) => (
                                                    <div key={book._id} className="book-card">
                                                        <Card className="h-100 book-card-clickable">
                                                            <Card.Body className="p-3">
                                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                                    <span className="badge bg-primary rounded-circle ranking-badge">
                                                                        {index + 1}
                                                                    </span>
                                                                    {book.categories && book.categories.length > 0 && (
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
                                                                                e.currentTarget.style.display = 'none';
                                                                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                                                if (nextElement) {
                                                                                    nextElement.style.display = 'block';
                                                                                }
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <span className="book-cover-emoji" style={{ display: book.thumbnail ? 'none' : 'block' }}>
                                                                        📖
                                                                    </span>
                                                                </div>
                                                                <h6 className="book-title" title={book.title}>
                                                                    {truncateText(book.title, 50)}
                                                                </h6>
                                                                <p className="book-author">
                                                                    by {book.authors.join(', ')}
                                                                </p>
                                                                {book.internalRating && book.internalRating > 0 && (
                                                                    <div className="book-rating">
                                                                        {renderStars(Math.round(book.internalRating))}
                                                                        <span className="rating-text">
                                                                            ({book.internalRatingsCount || 0})
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </Card.Body>
                                                        </Card>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-muted">No trending books available yet.</p>
                                                    <small>Check back later for popular titles!</small>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </Col>

                                {/* Community Section - Top Book Reviews */}
                                <Col xs={12} md={6}>
                                    <section className="community-section p-4" aria-label="Community Reviews">
                                        <div className="section-header">
                                            <h3 className="section-title">
                                                {isLoggedIn ? 'Reviews from People You Follow' : 'Community Reviews'}
                                            </h3>
                                            <p className="section-subtitle-small">
                                                {isLoggedIn
                                                    ? 'Latest reviews from users you follow'
                                                    : 'Discover what other readers are saying'
                                                }
                                            </p>
                                        </div>
                                        <div className="reviews-container">
                                            <ListGroup variant="flush">
                                                {topReviews.length > 0 ? (
                                                    topReviews.map((review, index) => (
                                                        <ListGroup.Item key={review._id} className="px-0 py-3 border-0 border-bottom">
                                                            <div className="review-item-content">
                                                                <div className="review-badge-container">
                                                                    <span className="badge bg-success rounded-circle ranking-badge">
                                                                        {index + 1}
                                                                    </span>
                                                                </div>
                                                                <div className="review-content">
                                                                    <div className="review-header">
                                                                        <h6 className="review-book-title">
                                                                            {truncateText(review.book?.title || 'Unknown Book', 40)}
                                                                        </h6>
                                                                        <div className="review-stars">
                                                                            {renderStars(review.rating)}
                                                                        </div>
                                                                    </div>
                                                                    <p className="review-meta">
                                                                        Review by <span className="review-reviewer">@{review.user?.username || 'Anonymous'}</span>
                                                                        <span className="review-date"> • {formatDate(review.createdAt)}</span>
                                                                        {isLoggedIn && (
                                                                            <span className="following-badge"> • Following</span>
                                                                        )}
                                                                    </p>
                                                                    <h6 className="review-title">{review.title}</h6>
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
                                                                ? 'No reviews from people you follow yet.'
                                                                : 'No reviews available yet.'
                                                            }
                                                        </p>
                                                        <small>
                                                            {isLoggedIn
                                                                ? 'Follow some users to see their reviews here!'
                                                                : 'Be the first to write a review!'
                                                            }
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