import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Card, Button } from 'react-bootstrap';
import { FaSearch, FaTimes, FaStar, FaHome } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [searchParams, setSearchParams] = useSearchParams();

    // Load search state from URL parameters on component mount
    useEffect(() => {
        const urlQuery = searchParams.get('q');
        const urlResults = searchParams.get('results');

        if (urlQuery) {
            setSearchTerm(urlQuery);
            setHasSearched(true);

            // If we have cached results in URL, try to restore them
            if (urlResults) {
                try {
                    const cachedResults = JSON.parse(decodeURIComponent(urlResults));
                    if (Array.isArray(cachedResults) && cachedResults.length > 0) {
                        setSearchResults(cachedResults);
                        return; // Don't perform new search if we have cached results
                    }
                } catch (e) {
                    console.error('Failed to parse cached results:', e);
                }
            }

            // If no valid cached results, perform the search
            performSearch(urlQuery);
        }
    }, []);

    // Update URL when search term or results change
    const updateURL = (query: string, results?: Book[]) => {
        const newSearchParams = new URLSearchParams();
        if (query.trim()) {
            newSearchParams.set('q', query.trim());
            if (results && results.length > 0) {
                // Cache results in URL (with size limit to avoid URL length issues)
                try {
                    const resultsString = JSON.stringify(results);
                    // Only cache if the JSON string is reasonably sized (less than 8KB)
                    if (resultsString.length < 8192) {
                        newSearchParams.set('results', encodeURIComponent(resultsString));
                    }
                } catch (e) {
                    console.error('Failed to cache results in URL:', e);
                }
            }
        }
        setSearchParams(newSearchParams);
    };

    const performSearch = async (query: string) => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const url = `${API_BASE_URL}/api/books/search?q=${encodeURIComponent(query.trim())}&maxResults=20`;
            const res = await fetch(url, { credentials: "include" });
            const contentType = res.headers.get("content-type") || "";

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(`HTTP ${res.status} – ${msg.slice(0, 120)}`);
            }
            if (!contentType.includes("application/json")) {
                const body = await res.text();
                throw new Error(`Expected JSON, got: ${contentType}. Snippet: ${body.slice(0, 120)}`);
            }

            const data = await res.json();
            if (data.success) {
                setSearchResults(data.books);
                updateURL(query, data.books);
            } else {
                setError("Failed to search books. Please try again.");
                setSearchResults([]);
                updateURL(query);
            }
        } catch (err: any) {
            console.error("Search error:", err);
            setError("An error occurred while searching. Please try again.");
            setSearchResults([]);
            updateURL(query);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        await performSearch(searchTerm);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion);
        // Perform search immediately when suggestion is clicked
        setTimeout(() => {
            performSearch(suggestion);
        }, 100);
    };

    const handleBookClick = (book: Book) => {
        // Navigate to details page with the book's Google ID
        // The current search state is already preserved in the URL
        navigate(`/details/${book.googleId}`);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setHasSearched(false);
        setError(null);
        // Clear URL parameters
        setSearchParams(new URLSearchParams());
    };

    const renderStars = (rating: number, ratingsCount?: number) => {
        // Don't render anything if rating is 0, null, undefined, or NaN
        if (!rating || rating === 0 || isNaN(rating)) return null;

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
            {/* Home Button */}
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
                <FaHome style={{ fontSize: '50px' }} />
            </Button>

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
                                        onClick={handleClearSearch}
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