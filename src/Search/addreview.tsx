import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaStar, FaBookOpen } from 'react-icons/fa';
import './addreview.css'; // We'll create this CSS file

interface Book {
    _id: string;
    googleId: string;
    title: string;
    authors: string[];
    thumbnail?: string;
    image?: string;
}

interface CurrentUser {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    role?: string;
}

const AddReview: React.FC = () => {
    const { googleId } = useParams<{ googleId: string }>();
    const navigate = useNavigate();
    const [book, setBook] = useState<Book | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Review form state
    const [review, setReview] = useState({
        rating: 5,
        title: '',
        content: ''
    });

    React.useEffect(() => {
        if (googleId) {
            fetchCurrentUser();
            fetchBookDetails();
        }
    }, [googleId]);

    const fetchCurrentUser = async () => {
        try {
            const API_BASE_URL = (import.meta as any)?.env?.VITE_REMOTE_SERVER || "http://localhost:4000";
            const response = await fetch(`${API_BASE_URL}/api/account/profile`, { credentials: "include" });
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const userData = await response.json();
                    setCurrentUser(userData);
                } else {
                    console.log('Profile endpoint returned non-JSON response');
                }
            } else if (response.status === 401) {
                // User not logged in
                setError('Please log in to write a review');
            } else {
                console.log('Profile endpoint error:', response.status);
            }
        } catch (err) {
            console.error('Error fetching current user:', err);
            setError('Error loading user information');
        }
    };

    const fetchBookDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const API_BASE_URL = (import.meta as any)?.env?.VITE_REMOTE_SERVER || "http://localhost:4000";
            const res = await fetch(`${API_BASE_URL}/api/books/${googleId}`);
            const isJSON = res.headers.get("content-type")?.includes("application/json");

            if (!res.ok) {
                if (isJSON) {
                    const data = await res.json();
                    setError(data.message || (res.status === 404 ? "Book not found" : "Error fetching book"));
                } else {
                    setError(res.status === 404 ? "Book not found" : "Failed to load book details");
                }
                return;
            }

            if (!isJSON) {
                setError("Failed to load book details");
                return;
            }

            const data = await res.json();
            if (data.success === true) {
                setBook(data.book);
            } else {
                setError(data.message ?? "Book not found");
            }
        } catch (e) {
            console.error("Error fetching book details:", e);
            setError("Failed to load book details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!currentUser) {
            setError('Please log in to write a review');
            return;
        }

        if (!review.title.trim() || !review.content.trim()) {
            setError('Please fill in both title and content');
            return;
        }

        try {
            setSubmitLoading(true);
            setError(null);

            const API_BASE_URL = (import.meta as any)?.env?.VITE_REMOTE_SERVER || "http://localhost:4000";
            const response = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    book: googleId,
                    rating: review.rating,
                    title: review.title,
                    content: review.content
                }),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate(`/book/${googleId}`);
                }, 2000);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Error submitting review');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Error submitting review');
        } finally {
            setSubmitLoading(false);
        }
    };

    const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
        const stars = [];

        for (let i = 0; i < 5; i++) {
            const isActive = i < rating;
            const starClass = interactive ? (isActive ? 'star-interactive-active' : 'star-interactive') :
                (isActive ? 'star-filled' : 'star-empty');

            stars.push(
                <FaStar
                    key={i}
                    className={starClass}
                    onClick={interactive && onRatingChange ? () => onRatingChange(i + 1) : undefined}
                    style={interactive ? { cursor: 'pointer', marginRight: '4px', fontSize: '1.5rem' } : { marginRight: '4px', fontSize: '1.5rem' }}
                />
            );
        }

        return <div className="stars-container">{stars}</div>;
    };

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

    if (error && !book) {
        return (
            <Container className="mt-4">
                <Alert variant="danger" className="error-alert">
                    <h4>📚 Error</h4>
                    <p>{error}</p>
                    <div className="mt-3">
                        <Button variant="outline-danger" onClick={() => navigate(-1)} className="me-2">
                            <FaArrowLeft className="me-2" />
                            Go Back
                        </Button>
                        <Button variant="primary" onClick={() => navigate('/')}>
                            Go to Home
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return (
        <div className="add-review-page">
            <Container className="mt-4">
                {/* Navigation */}
                <div className="navigation-section">
                    <Button
                        variant="outline-primary"
                        onClick={() => navigate(`/book/${googleId}`)}
                        className="back-button"
                    >
                        <FaArrowLeft className="me-2" />
                        Back to Book
                    </Button>
                </div>

                <Row className="justify-content-center">
                    <Col lg={8} xl={6}>
                        <Card className="add-review-card">
                            <Card.Header className="add-review-header">
                                <h3 className="add-review-title">Write a Review</h3>
                            </Card.Header>
                            <Card.Body className="add-review-body">
                                {/* Book Info */}
                                {book && (
                                    <div className="review-book-info-section">
                                        <div className="book-info-display">
                                            {(book.thumbnail || book.image) ? (
                                                <img
                                                    src={book.thumbnail || book.image}
                                                    alt={`${book.title} cover`}
                                                    className="review-book-cover-large"
                                                />
                                            ) : (
                                                <div className="review-book-placeholder">
                                                    <FaBookOpen />
                                                </div>
                                            )}
                                            <div className="book-details">
                                                <h5 className="book-title-review">{book.title}</h5>
                                                <p className="book-authors-review">
                                                    by {book.authors.join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Success Message */}
                                {success && (
                                    <Alert variant="success" className="mb-4">
                                        <h6>✅ Review Submitted Successfully!</h6>
                                        <p className="mb-0">Redirecting you back to the book page...</p>
                                    </Alert>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <Alert variant="danger" className="mb-4">
                                        <h6>❌ Error</h6>
                                        <p className="mb-0">{error}</p>
                                    </Alert>
                                )}

                                {/* Review Form */}
                                <Form>
                                    {/* Rating */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="review-form-label">Your Rating</Form.Label>
                                        <div className="rating-input-section">
                                            {renderStars(
                                                review.rating,
                                                true,
                                                (rating) => setReview(prev => ({ ...prev, rating }))
                                            )}
                                            <span className="rating-value-display">({review.rating}/5)</span>
                                        </div>
                                    </Form.Group>

                                    {/* Title */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="review-form-label">Review Title</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={review.title}
                                            onChange={(e) => setReview(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Give your review a title..."
                                            className="review-form-input"
                                            style={{ maxWidth: '600px' }}
                                        />
                                    </Form.Group>

                                    {/* Content */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="review-form-label">Your Review</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={8}
                                            value={review.content}
                                            onChange={(e) => setReview(prev => ({ ...prev, content: e.target.value }))}
                                            placeholder="What did you think of this book? Share your thoughts..."
                                            className="review-form-input"
                                            style={{ maxWidth: '600px' }}
                                        />
                                    </Form.Group>

                                    {/* Submit Button */}
                                    <div className="submit-section">
                                        <Button
                                            variant="success"
                                            onClick={handleSubmitReview}
                                            disabled={submitLoading || !review.title.trim() || !review.content.trim()}
                                            className="submit-review-btn"
                                        >
                                            {submitLoading ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Save Review'
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => navigate(`/book/${googleId}`)}
                                            className="ms-3 cancel-btn"
                                            disabled={submitLoading}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};
export default AddReview;


