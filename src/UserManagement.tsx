import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Alert, Badge, Pagination } from 'react-bootstrap';
import { FaUsers, FaTrash, FaEdit, FaEye, FaFilter } from 'react-icons/fa';
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

interface UserStats {
    total: number;
    admins: number;
    writers: number;
    readers: number;
    breakdown: {
        admin: number;
        writer: number;
        reader: number;
    };
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [filters, setFilters] = useState({
        role: '',
        page: 1,
        limit: 20
    });
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/current`, {
                credentials: 'include'
            });
            if (response.ok) {
                const user = await response.json();
                setCurrentUser(user);
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();

            if (filters.role) queryParams.append('role', filters.role);
            queryParams.append('page', filters.page.toString());
            queryParams.append('limit', filters.limit.toString());

            const response = await fetch(`${API_BASE_URL}/api/users?${queryParams}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                totalUsers: data.totalUsers,
                hasNextPage: data.hasNextPage,
                hasPreviousPage: data.hasPreviousPage
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        if (currentUser?.role !== 'admin') return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/stats`, {
                credentials: 'include'
            });
            if (response.ok) {
                const stats = await response.json();
                setUserStats(stats);
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
            fetchUserStats();
        }
    }, [currentUser, filters]);

    const handleDeleteUser = async (userId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            const result = await response.json();

            alert(`User deleted successfully: ${result.message}`);

            fetchUsers();
            fetchUserStats();

        } catch (err: any) {
            alert(`Error deleting user: ${err.message}`);
        } finally {
            setDeleteConfirm(null);
            setShowDeleteModal(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleRoleFilter = (role: string) => {
        setFilters(prev => ({ ...prev, role, page: 1 }));
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

    if (!currentUser) {
        return (
            <Container className="mt-5">
                <Row className="justify-content-center">
                    <Col md={6} className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading...</p>
                    </Col>
                </Row>
            </Container>
        );
    }

    if (!['reader', 'writer', 'admin'].includes(currentUser.role)) {
        return (
            <Container className="mt-5">
                <Row className="justify-content-center">
                    <Col md={8}>
                        <Alert variant="danger" className="text-center">
                            <FaShield size={48} className="mb-3" />
                            <h4>Access Denied</h4>
                            <p>You don't have permission to view this page.</p>
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
                    <p className="text-muted">Manage and view all users in the system</p>
                </Col>
            </Row>

            {/* Stats Cards - Only for Admins */}
            {currentUser.role === 'admin' && userStats && (
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaUsers size={32} className="text-primary mb-2" />
                                <Card.Title className="h2">{userStats.total}</Card.Title>
                                <Card.Text className="text-muted">Total Users</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaShield size={32} className="text-danger mb-2" />
                                <Card.Title className="h2">{userStats.admins}</Card.Title>
                                <Card.Text className="text-muted">Admins</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaEdit size={32} className="text-primary mb-2" />
                                <Card.Title className="h2">{userStats.writers}</Card.Title>
                                <Card.Text className="text-muted">Writers</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaEye size={32} className="text-success mb-2" />
                                <Card.Title className="h2">{userStats.readers}</Card.Title>
                                <Card.Text className="text-muted">Readers</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Filters */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="d-flex align-items-center">
                                    <FaFilter className="me-2" />
                                    <span className="fw-bold">Filter by role:</span>
                                </div>

                                <Button
                                    variant={filters.role === '' ? 'dark' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleRoleFilter('')}
                                >
                                    All Roles
                                </Button>

                                {['admin', 'writer', 'reader'].map(role => (
                                    <Button
                                        key={role}
                                        variant={filters.role === role ? 'dark' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => handleRoleFilter(role)}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        {getRoleIcon(role)}
                                        {role.toUpperCase()}
                                    </Button>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Users Table */}
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : error ? (
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
                                <>
                                    <Table responsive striped hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>User</th>
                                                <th>Role</th>
                                                <th>Email</th>
                                                <th>Joined</th>
                                                {currentUser.role === 'admin' && <th>Actions</th>}
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
                                                    {currentUser.role === 'admin' && (
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

                                    {/* Pagination */}
                                    {pagination.totalPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-4">
                                            <div className="text-muted">
                                                Showing page {pagination.currentPage} of {pagination.totalPages}
                                                ({pagination.totalUsers} total users)
                                            </div>

                                            <Pagination className="mb-0">
                                                <Pagination.Prev
                                                    disabled={!pagination.hasPreviousPage}
                                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                />

                                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                    const startPage = Math.max(1, pagination.currentPage - 2);
                                                    const pageNum = startPage + i;

                                                    if (pageNum <= pagination.totalPages) {
                                                        return (
                                                            <Pagination.Item
                                                                key={pageNum}
                                                                active={pageNum === pagination.currentPage}
                                                                onClick={() => handlePageChange(pageNum)}
                                                            >
                                                                {pageNum}
                                                            </Pagination.Item>
                                                        );
                                                    }
                                                    return null;
                                                })}

                                                <Pagination.Next
                                                    disabled={!pagination.hasNextPage}
                                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                />
                                            </Pagination>
                                        </div>
                                    )}
                                </>
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
                                <strong>Warning:</strong> This will permanently delete:
                                <ul className="mt-2 mb-0">
                                    <li>User account and profile</li>
                                    <li>All reviews by this user</li>
                                    <li>All favorites by this user</li>
                                    <li>All following/follower relationships</li>
                                </ul>
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