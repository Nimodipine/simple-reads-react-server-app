import React, { useState } from 'react';
import { Container, Row, Col, Form, Card } from 'react-bootstrap';
import { FaSearch, FaTimes, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './search.css';

const API_BASE_URL =
    import.meta.env.VITE_REMOTE_SERVER || "http://localhost:4000";

interface Book {
    googleId: string;
    title: string;
    authors: string[];
    thumbnail: string;
    description: string;
    publishedDate: string;
    categories: string[];
    pageCount: number;
    language: string;
    averageRating?: number;
    ratingsCount?: number;
    previewLink: string;
    infoLink: string;
}


export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const url = `${API_BASE_URL}/api/books/search?q=${encodeURIComponent(searchTerm.trim())}&maxResults=20`;
            const res = await fetch(url, { credentials: "include" }); // include if your API needs session cookies
            const contentType = res.headers.get("content-type") || "";

            if (!res.ok) {
                // Try to read any text message for debugging
                const msg = await res.text();
                throw new Error(`HTTP ${res.status} – ${msg.slice(0, 120)}`);
            }
            if (!contentType.includes("application/json")) {
                const body = await res.text();
                throw new Error(`Expected JSON, got: ${contentType}. Snippet: ${body.slice(0, 120)}`);
            }

            const data = await res.json(); // { success, count, query, books }
            if (data.success) setSearchResults(data.books);
            else {
                setError("Failed to search books. Please try again.");
                setSearchResults([]);
            }
        } catch (err: any) {
            console.error("Search error:", err);
            setError("An error occurred while searching. Please try again.");
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion);
        // Trigger search automatically when suggestion is clicked
        setTimeout(() => {
            const form = document.querySelector('.main-search-form') as HTMLFormElement;
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        }, 100);
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
                stars.push(<FaStar key={i} className="star-filled" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<FaStar key={i} className="star-half" />);
            } else {
                stars.push(<FaStar key={i} className="star-empty" />);
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

    return (
        <div className="search-page">
            <Container fluid className="search-container">
                <Row className="justify-content-center">
                    <Col xs={12} lg={10} xl={8}>
                        {/* Search Header */}
                        <div className="search-header">
                            <h1 className="search-title">Discover Your Next Great Read</h1>
                            <p className="search-subtitle">
                                Search through thousands of books, authors, and genres
                            </p>
                        </div>

                        {/* Main Search Form */}
                        <Form onSubmit={handleSearch} className="main-search-form">
                            <div className="search-input-container-main">
                                <FaSearch className="search-icon" />
                                <Form.Control
                                    type="text"
                                    placeholder="Search for books, authors, or genres..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input-main"
                                    disabled={isLoading}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="clear-search-btn"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSearchResults([]);
                                            setHasSearched(false);
                                            setError(null);
                                        }}
                                        aria-label="Clear search"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </Form>

                        {/* Quick Search Suggestions */}
                        {!hasSearched && (
                            <div className="quick-suggestions">
                                <h6 className="suggestions-title">Popular Searches</h6>
                                <div className="suggestion-tags">
                                    {['Stephen King', 'Romance', 'Science Fiction', 'Mystery', 'Fantasy', 'Non-fiction'].map(suggestion => (
                                        <button
                                            key={suggestion}
                                            className="suggestion-tag"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="search-results-section">
                                <div className="loading-state">
                                    <div className="loading-spinner"></div>
                                    <p>Searching for books...</p>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="search-results-section">
                                <div className="error-state">
                                    <p className="error-message">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Search Results */}
                        {hasSearched && !isLoading && !error && (
                            <div className="search-results-section">
                                <div className="results-header">
                                    <h5>Search Results for "{searchTerm}"</h5>
                                    <p className="text-muted">{searchResults.length} books found</p>
                                </div>

                                {searchResults.length === 0 ? (
                                    <div className="no-results">
                                        <p>No books found matching your search.</p>
                                        <p className="text-muted">Try adjusting your search terms or browse our suggestions above.</p>
                                    </div>
                                ) : (
                                    <div className="search-results-grid">
                                        {searchResults.map((book) => (
                                            <Card
                                                key={book.googleId}
                                                className="book-result-card clickable-card"
                                                onClick={() => handleBookClick(book)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="book-result-content">
                                                    <div className="book-cover-container">
                                                        {book.thumbnail ? (
                                                            <img
                                                                src={book.thumbnail}
                                                                alt={`${book.title} cover`}
                                                                className="book-cover-image"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                                                                    if (sibling) {
                                                                        sibling.style.display = 'flex';
                                                                    }
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className="book-cover-placeholder" style={{ display: book.thumbnail ? 'none' : 'flex' }}>
                                                            📚
                                                        </div>
                                                    </div>

                                                    <div className="book-info">
                                                        <h6 className="book-title">{book.title}</h6>
                                                        <p className="book-authors">
                                                            {book.authors.join(', ')}
                                                        </p>

                                                        {book.averageRating && renderStars(book.averageRating, book.ratingsCount)}

                                                        <p className="book-description">
                                                            {book.description.length > 150
                                                                ? `${book.description.substring(0, 150)}...`
                                                                : book.description}
                                                        </p>

                                                        <div className="book-meta">
                                                            {book.publishedDate && (
                                                                <span className="publish-date">{book.publishedDate}</span>
                                                            )}
                                                            {book.pageCount > 0 && (
                                                                <span className="page-count">{book.pageCount} pages</span>
                                                            )}
                                                            {book.categories.length > 0 && (
                                                                <span className="category">{book.categories[0]}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}