import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Alert, Badge } from 'react-bootstrap';
import { FaUsers, FaTrash, FaEdit, FaEye } from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

const API_BASE_URL = (import.meta as any)?.env?.VITE_REMOTE_SERVER || "http://localhost:4000";

interface User {
    _id: string;
    username: string;
    email: string;
    role: 'admin' | 'writer' | 'reader';
    createdAt?: string;
    avatar?: string;
    bio?: string;
    writerBadge?: boolean;
    expertise?: string[];
    lastLoginAt?: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                credentials: 'include'
            });
            if (response.ok) {
                const user = await response.json();
                setCurrentUser(user);
            } else if (response.status === 401) {
                // User is not authenticated
                setCurrentUser(null);
                setError('Please sign in to view this page');
            } else {
                throw new Error('Failed to fetch user profile');
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            setError('Failed to load user profile');
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(''); // Clear any previous errors
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please sign in to view users');
                }
                throw new Error('Failed to fetch users');
            }

            const users = await response.json();
            setUsers(users);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser]);

    const handleDeleteUser = async (userId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            const result = await response.json();

            alert(`User deleted successfully: ${result.message}`);

            // Refresh user list
            fetchUsers();

        } catch (err: any) {
            alert(`Error deleting user: ${err.message}`);
        } finally {
            setDeleteConfirm(null);
            setShowDeleteModal(false);
        }
    };

    const getRoleVariant = (role: string) => {
        switch (role) {
            case 'admin': return 'danger';
            case 'writer': return 'primary';
            case 'reader': return 'success';
            default: return 'secondary';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <FaShield />;
            case 'writer': return <FaEdit />;
            case 'reader': return <FaEye />;
            default: return <FaUsers />;
        }
    };

    const confirmDelete = (user: User) => {
        setDeleteConfirm(user);
        setShowDeleteModal(true);
    };

    if (loading) {
        return (
            <Container className="mt-5">
                <Row className="justify-content-center">
                    <Col md={6} className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading users...</p>
                    </Col>
                </Row>
            </Container>
        );
    }

    if (error && error.includes('sign in')) {
        return (
            <Container className="mt-5">
                <Row className="justify-content-center">
                    <Col md={8}>
                        <Alert variant="warning" className="text-center">
                            <FaUsers size={48} className="mb-3" />
                            <h4>Authentication Required</h4>
                            <p>Please sign in to view the user management page.</p>
                            <Button variant="primary" href="/#/Account/Signin">
                                Go to Sign In
                            </Button>
                        </Alert>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <h1 className="display-5 fw-bold">
                        <FaUsers className="me-3" />
                        User Management
                    </h1>
                    <p className="text-muted">
                        View all users in the system
                        {currentUser && currentUser.role === 'admin' && ' (Admin: You can delete users)'}
                        {currentUser && currentUser.role !== 'admin' && ' (View only)'}
                        {!currentUser && ' (Please sign in for full access)'}
                    </p>
                </Col>
            </Row>

            {/* Users Table */}
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            {error && !error.includes('sign in') ? (
                                <Alert variant="danger" className="text-center">
                                    <p>Error: {error}</p>
                                    <Button variant="primary" onClick={fetchUsers}>
                                        Retry
                                    </Button>
                                </Alert>
                            ) : users.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaUsers size={64} className="text-muted mb-3" />
                                    <p className="text-muted">No users found</p>
                                </div>
                            ) : (
                                <Table responsive striped hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Email</th>
                                            <th>Joined</th>
                                            {currentUser?.role === 'admin' && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                                                            style={{ width: '40px', height: '40px' }}
                                                        >
                                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">
                                                                {user.username || 'Unknown'}
                                                            </div>
                                                            <small className="text-muted">
                                                                ID: {user._id}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg={getRoleVariant(user.role)}
                                                        className="d-flex align-items-center gap-1 w-auto"
                                                        style={{ width: 'fit-content' }}
                                                    >
                                                        {getRoleIcon(user.role)}
                                                        {user.role.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td>{user.email || 'No email'}</td>
                                                <td>
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                                </td>
                                                {currentUser?.role === 'admin' && (
                                                    <td>
                                                        {user._id !== currentUser._id ? (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => confirmDelete(user)}
                                                                className="d-flex align-items-center gap-1"
                                                            >
                                                                <FaTrash />
                                                                Delete
                                                            </Button>
                                                        ) : (
                                                            <span className="text-muted">You</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <FaTrash className="text-danger" />
                        Delete User
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {deleteConfirm && (
                        <>
                            <p>
                                Are you sure you want to delete <strong>{deleteConfirm.username}</strong>?
                            </p>
                            <Alert variant="warning">
                                <strong>Warning:</strong> This action cannot be undone.
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm._id)}
                    >
                        Delete User
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}