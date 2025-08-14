import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBookOpen, FaGlobe, FaCalendarAlt, FaUser, FaHeart } from 'react-icons/fa';
import './detail.css';

interface Book {
    _id: string;
    googleId: string;
    title: string;
    authors: string[];
    thumbnail: string;
    description: string;
    publishedDate: string;
    categories: string[];
    pageCount: number;
    language: string;
    publisher?: string;
    isbn?: string;
    googleRating?: number;
    googleRatingsCount?: number;
    internalRating?: number;
    internalRatingsCount?: number;
    viewCount?: number;
    favoriteCount?: number;
    previewLink: string;
    infoLink: string;
    createdAt: string;
    updatedAt: string;
}

interface Review {
    _id: string;
    bookId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    reviewText: string;
    createdAt: string;
    updatedAt: string;
}

interface BookDetailsResponse {
    success: boolean;
    book: Book;
}

interface ReviewsResponse {
    success: boolean;
    reviews: Review[];
    count: number;
}

const BookDetails: React.FC = () => {
    const { googleId } = useParams<{ googleId: string }>();
    const navigate = useNavigate();
    const [book, setBook] = useState<Book | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        if (googleId) {
            fetchBookDetails();
            fetchBookReviews();
        }
    }, [googleId]);

    const fetchBookDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/books/${googleId}`);
            const data: BookDetailsResponse = await response.json();

            if (data.success) {
                setBook(data.book);
            } else {
                setError('Book not found');
            }
        } catch (err) {
            console.error('Error fetching book details:', err);
            setError('Failed to load book details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookReviews = async () => {
        try {
            setReviewsLoading(true);
            const response = await fetch(`/api/reviews/book/${googleId}`);
            const data: ReviewsResponse = await response.json();

            if (data.success) {
                setReviews(data.reviews);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleFavoriteToggle = async () => {
        try {
            const response = await fetch(`/api/books/${googleId}/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setIsFavorited(!isFavorited);
                if (book) {
                    setBook({
                        ...book,
                        favoriteCount: isFavorited
                            ? (book.favoriteCount || 0) - 1
                            : (book.favoriteCount || 0) + 1
                    });
                }
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    const handleBackNavigation = () => {
        // Check if there's a previous page in history
        if (window.history.length > 1) {
            // Use browser back to preserve search state
            navigate(-1);
        } else {
            // Fallback to search page if no history
            navigate('/search');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <Container className="mt-4">
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Loading book details...</p>
                </div>
            </Container>
        );
    }

    if (error || !book) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    <h4>Error</h4>
                    <p>{error || 'Book not found'}</p>
                    <Button variant="outline-danger" onClick={() => navigate('/search')}>
                        <FaArrowLeft className="me-2" />
                        Back to Search
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <div className="book-details-page">
            <Container className="mt-4">
                <Button
                    variant="outline-primary"
                    onClick={handleBackNavigation}
                    className="mb-4"
                >
                    <FaArrowLeft className="me-2" />
                    Back to Results
                </Button>

                <Row>
                    <Col lg={4} className="mb-4">
                        <Card className="book-details-card">
                            <div className="book-cover-section">
                                {book.thumbnail ? (
                                    <img
                                        src={book.thumbnail.replace('zoom=1', 'zoom=2')}
                                        alt={`${book.title} cover`}
                                        className="book-cover-large"
                                    />
                                ) : (
                                    <div className="book-cover-placeholder-large">
                                        📚
                                    </div>
                                )}
                            </div>

                            <Card.Body>
                                <div className="book-actions">
                                    <Button
                                        variant={isFavorited ? "danger" : "outline-danger"}
                                        onClick={handleFavoriteToggle}
                                        className="w-100 mb-2"
                                    >
                                        <FaHeart className="me-2" />
                                        {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                                    </Button>

                                    {book.previewLink && (
                                        <Button
                                            variant="primary"
                                            href={book.previewLink}
                                            target="_blank"
                                            className="w-100 mb-2"
                                        >
                                            <FaBookOpen className="me-2" />
                                            Preview Book
                                        </Button>
                                    )}

                                    {book.infoLink && (
                                        <Button
                                            variant="outline-primary"
                                            href={book.infoLink}
                                            target="_blank"
                                            className="w-100"
                                        >
                                            <FaGlobe className="me-2" />
                                            More Info
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={8}>
                        <Card className="book-info-card mb-4">
                            <Card.Body>
                                <h1 className="book-title-large">{book.title}</h1>

                                <div className="book-authors-large mb-3">
                                    {book.authors.map((author, index) => (
                                        <Link
                                            key={index}
                                            to={`/search?author=${encodeURIComponent(author)}`}
                                            className="author-link me-2"
                                        >
                                            {author}
                                        </Link>
                                    ))}
                                </div>

                                {/* Ratings section removed */}

                                <Row className="book-metadata mb-4">
                                    {book.publishedDate && (
                                        <Col md={6} className="metadata-item">
                                            <FaCalendarAlt className="me-2" />
                                            <strong>Published:</strong> {book.publishedDate}
                                        </Col>
                                    )}

                                    {book.pageCount > 0 && (
                                        <Col md={6} className="metadata-item">
                                            <FaBookOpen className="me-2" />
                                            <strong>Pages:</strong> {book.pageCount}
                                        </Col>
                                    )}

                                    {book.publisher && (
                                        <Col md={6} className="metadata-item">
                                            <strong>Publisher:</strong> {book.publisher}
                                        </Col>
                                    )}

                                    {book.language && (
                                        <Col md={6} className="metadata-item">
                                            <strong>Language:</strong> {book.language.toUpperCase()}
                                        </Col>
                                    )}

                                    {book.isbn && (
                                        <Col md={6} className="metadata-item">
                                            <strong>ISBN:</strong> {book.isbn}
                                        </Col>
                                    )}

                                    <Col md={6} className="metadata-item">
                                        <FaHeart className="me-2" />
                                        <strong>Favorites:</strong> {book.favoriteCount || 0}
                                    </Col>
                                </Row>

                                {book.categories.length > 0 && (
                                    <div className="categories-section mb-4">
                                        <strong>Categories:</strong>
                                        <div className="categories-tags mt-2">
                                            {book.categories.map((category, index) => (
                                                <Link
                                                    key={index}
                                                    to={`/search?category=${encodeURIComponent(category)}`}
                                                >
                                                    <Badge bg="secondary" className="me-2 mb-2">
                                                        {category}
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="book-description">
                                    <h5>About this book</h5>
                                    <div dangerouslySetInnerHTML={{ __html: book.description }} />
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="reviews-card">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FaUser className="me-2" />
                                    Community Reviews ({reviews.length})
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                {reviewsLoading ? (
                                    <div className="text-center py-4">
                                        <Spinner animation="border" size="sm" />
                                        <span className="ms-2">Loading reviews...</span>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <p>No reviews yet. Be the first to review this book!</p>
                                        <Button variant="primary">Write a Review</Button>
                                    </div>
                                ) : (
                                    <div className="reviews-list">
                                        {reviews.map((review) => (
                                            <div key={review._id} className="review-item">
                                                <div className="review-header">
                                                    <div className="reviewer-info">
                                                        <Link
                                                            to={`/profile/${review.userId}`}
                                                            className="reviewer-name"
                                                        >
                                                            {review.userName}
                                                        </Link>
                                                        <span className="review-date">
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="review-text">
                                                    {review.reviewText}
                                                </div>
                                                <hr />
                                            </div>
                                        ))}

                                        {reviews.length >= 5 && (
                                            <div className="text-center">
                                                <Button variant="outline-primary">
                                                    View All Reviews
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default BookDetails;