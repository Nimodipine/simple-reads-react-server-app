import React, { useState } from "react";
import { Button, Card, Col, Container, Form, FormControl, Image, ListGroup, Row } from "react-bootstrap";
import Navigation from "../Navigation";
import Header from "../Header";
import './home.css';

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

export default function Home({ isLoggedIn, user, genericFeed, personalizedFeed, onLogOut }: HomeProps) {
    const [draft, setDraft] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Mock data for trending books
    const trendingBooks = [
        { id: 1, title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", genre: "Fiction" },
        { id: 2, title: "Atomic Habits", author: "James Clear", genre: "Self-Help" },
        { id: 3, title: "Where the Crawdads Sing", author: "Delia Owens", genre: "Mystery" },
        { id: 4, title: "The Silent Patient", author: "Alex Michaelides", genre: "Thriller" },
        { id: 5, title: "Educated", author: "Tara Westover", genre: "Memoir" }
    ];

    // Mock data for trending book reviews
    const trendingReviews = [
        {
            id: 1,
            book: "Fourth Wing",
            reviewer: "BookLover123",
            rating: 5,
            snippet: "Absolutely incredible! Dragons, romance, and war college - what more could you want?"
        },
        {
            id: 2,
            book: "Tomorrow, and Tomorrow, and Tomorrow",
            reviewer: "GameReader",
            rating: 4,
            snippet: "A beautiful exploration of friendship, creativity, and the gaming world."
        },
        {
            id: 3,
            book: "The Midnight Library",
            reviewer: "PhilosophyFan",
            rating: 5,
            snippet: "Life-changing read about infinite possibilities and regret."
        },
        {
            id: 4,
            book: "Klara and the Sun",
            reviewer: "SciFiEnthusiast",
            rating: 4,
            snippet: "Ishiguro's masterful storytelling through an AI's perspective."
        },
        {
            id: 5,
            book: "The Song of Achilles",
            reviewer: "MythologyLover",
            rating: 5,
            snippet: "Heart-wrenching retelling of Greek mythology. Prepare to cry!"
        }
    ];

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
                                <Form role="search" className="d-flex justify-content-center search-form">
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

                            {/* Two Column Layout for Explore and Community */}
                            <Row className="g-3 px-3">
                                {/* Explore Section - Trending New Books */}
                                <Col xs={12} md={6}>
                                    <section className="explore-section p-4" aria-label="Trending Books">
                                        <div className="section-header">
                                            <h3 className="section-title">Trending New Books</h3>
                                            <p className="section-subtitle-small">Popular books everyone's talking about</p>
                                        </div>
                                        <div className="trending-books-container">
                                            {trendingBooks.map((book, index) => (
                                                <div key={book.id} className="book-card">
                                                    <Card className="h-100 book-card-clickable">
                                                        <Card.Body className="p-3">
                                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                                <span className="badge bg-primary rounded-circle ranking-badge">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="badge bg-light text-dark genre-badge">
                                                                    {book.genre}
                                                                </span>
                                                            </div>
                                                            <div className="book-cover-placeholder">
                                                                <span className="book-cover-emoji">📖</span>
                                                            </div>
                                                            <h6 className="book-title" title={book.title}>
                                                                {book.title}
                                                            </h6>
                                                            <p className="book-author">
                                                                by {book.author}
                                                            </p>
                                                        </Card.Body>
                                                    </Card>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </Col>

                                {/* Community Section - Top Book Reviews */}
                                <Col xs={12} md={6}>
                                    <section className="community-section p-4" aria-label="Top Book Reviews">
                                        <div className="section-header">
                                            <h3 className="section-title">Top Book Reviews</h3>
                                            <p className="section-subtitle-small">Highest rated reviews from our community</p>
                                        </div>
                                        <div className="reviews-container">
                                            <ListGroup variant="flush">
                                                {trendingReviews.map((review, index) => (
                                                    <ListGroup.Item key={review.id} className="px-0 py-3 border-0 border-bottom">
                                                        <div className="review-item-content">
                                                            <div className="review-badge-container">
                                                                <span className="badge bg-success rounded-circle ranking-badge">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            <div className="review-content">
                                                                <div className="review-header">
                                                                    <h6 className="review-book-title">{review.book}</h6>
                                                                    <div className="review-stars">
                                                                        {renderStars(review.rating)}
                                                                    </div>
                                                                </div>
                                                                <p className="review-meta">
                                                                    Review by <span className="review-reviewer">@{review.reviewer}</span>
                                                                </p>
                                                                <p className="review-snippet">{review.snippet}</p>
                                                            </div>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
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