import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  ListGroup,
  ProgressBar,
  Alert,
  Row,
  Col,
  Badge,
  Container,
} from 'react-bootstrap';
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaPlusCircle,
  FaTrash,
  FaChartPie,
  FaList,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const BudgetManager = ({ transactions, categories, onBudgetChange }) => {
  const [budgets, setBudgets] = useState([]);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [budgetStatuses, setBudgetStatuses] = useState({});

  // Fetch all budgets on component mount
  useEffect(() => {
    fetchBudgets();
  }, []);

  // Calculate budget statuses whenever budgets or transactions change
  useEffect(() => {
    if (budgets.length > 0) {
      calculateBudgetStatuses();
    }
  }, [budgets, transactions]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/budgets`);
      setBudgets(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to load budgets');
      setLoading(false);
    }
  };

  const calculateBudgetStatuses = async () => {
    const statuses = {};

    // For each budget, calculate its status
    for (const budget of budgets) {
      try {
        const response = await axios.get(
          `${API_URL}/budgets/status/${budget.category}`
        );
        statuses[budget.category] = response.data;
      } catch (err) {
        console.error(
          `Error fetching budget status for ${budget.category}:`,
          err
        );
      }
    }

    setBudgetStatuses(statuses);

    // Notify parent component if needed
    if (onBudgetChange) {
      onBudgetChange(statuses);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBudget({
      ...newBudget,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!newBudget.category || !newBudget.amount) {
      setError('Please select a category and enter an amount');
      return;
    }

    try {
      await axios.post(`${API_URL}/budgets`, newBudget);
      setSuccess('Budget created successfully');

      // Reset form
      setNewBudget({
        category: '',
        amount: '',
        period: 'monthly',
      });

      // Refresh budgets
      fetchBudgets();
    } catch (err) {
      console.error('Error creating budget:', err);
      setError(err.response?.data?.detail || 'Failed to create budget');
    }
  };

  const handleDelete = async (budgetId) => {
    try {
      await axios.delete(`${API_URL}/budgets/${budgetId}`);

      // Refresh budgets
      fetchBudgets();
      setSuccess('Budget deleted successfully');
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError('Failed to delete budget');
    }
  };

  const getVariant = (percentage) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const getStatusIcon = (status, percentage) => {
    if (percentage >= 100) return <FaTimesCircle className='text-danger' />;
    if (status === 'approaching')
      return <FaExclamationTriangle className='text-warning' />;
    return <FaCheckCircle className='text-success' />;
  };

  return (
    <Container className='budget-manager py-4'>
      <Row>
        <Col lg={12} className='mb-4'>
          <div className='d-flex justify-content-between align-items-center mb-4'>
            <h2 className='mb-0'>
              <FaChartPie className='me-2' />
              Budget Manager
            </h2>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className='mb-4'>
          <Card className='border-0 shadow-sm h-100'>
            <Card.Header className='bg-primary text-white'>
              <div className='d-flex align-items-center'>
                <FaPlusCircle className='me-2' />
                <h5 className='mb-0'>Create New Budget</h5>
              </div>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert
                  variant='danger'
                  className='py-2 mb-3 d-flex align-items-center'
                >
                  <FaExclamationTriangle className='me-2' /> {error}
                </Alert>
              )}

              {success && (
                <Alert
                  variant='success'
                  className='py-2 mb-3 d-flex align-items-center'
                >
                  <FaCheckCircle className='me-2' /> {success}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className='mb-3'>
                  <Form.Label>
                    <FaList className='me-1' /> Category
                  </Form.Label>
                  <Form.Select
                    name='category'
                    value={newBudget.category}
                    onChange={handleInputChange}
                    required
                    className='border-0 shadow-sm'
                  >
                    <option value=''>Select a category</option>
                    {categories
                      .filter((cat) => !cat.isIncome)
                      .map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className='mb-3'>
                  <Form.Label>
                    <FaMoneyBillWave className='me-1' /> Budget Amount
                  </Form.Label>
                  <Form.Control
                    type='number'
                    name='amount'
                    value={newBudget.amount}
                    onChange={handleInputChange}
                    placeholder='Enter amount'
                    min='0.01'
                    step='0.01'
                    required
                    className='border-0 shadow-sm'
                  />
                </Form.Group>

                <Form.Group className='mb-3'>
                  <Form.Label>
                    <FaCalendarAlt className='me-1' /> Period
                  </Form.Label>
                  <Form.Select
                    name='period'
                    value={newBudget.period}
                    onChange={handleInputChange}
                    className='border-0 shadow-sm'
                  >
                    <option value='monthly'>Monthly</option>
                    <option value='weekly'>Weekly</option>
                    <option value='yearly'>Yearly</option>
                  </Form.Select>
                </Form.Group>

                <Button variant='primary' type='submit' className='w-100'>
                  <FaPlusCircle className='me-2' /> Add Budget
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className='border-0 shadow-sm'>
            <Card.Header className='bg-info text-white'>
              <div className='d-flex align-items-center'>
                <FaList className='me-2' />
                <h5 className='mb-0'>Current Budgets</h5>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className='text-center py-5'>
                  <div className='spinner-border text-primary' role='status'>
                    <span className='visually-hidden'>Loading...</span>
                  </div>
                  <p className='mt-3'>Loading budgets...</p>
                </div>
              ) : budgets.length === 0 ? (
                <div className='text-center py-5 text-muted'>
                  <FaChartPie className='display-1 mb-3 opacity-25' />
                  <p>
                    No budgets set. Create your first budget to start tracking
                    spending.
                  </p>
                </div>
              ) : (
                <ListGroup variant='flush'>
                  {budgets.map((budget) => {
                    const status = budgetStatuses[budget.category] || null;
                    const percentage = status ? status.percentage_used : 0;
                    const periodText =
                      budget.period.charAt(0).toUpperCase() +
                      budget.period.slice(1);

                    return (
                      <ListGroup.Item
                        key={budget.id}
                        className='mb-3 border-0 shadow-sm'
                      >
                        <div className='d-flex justify-content-between align-items-center mb-2'>
                          <div className='d-flex align-items-center'>
                            {status && getStatusIcon(status.status, percentage)}
                            <h5 className='mb-0 ms-2'>{budget.category}</h5>
                            <Badge bg='secondary' className='ms-2'>
                              {periodText}
                            </Badge>
                          </div>
                          <Button
                            variant='outline-danger'
                            size='sm'
                            onClick={() => handleDelete(budget.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>

                        <Row className='mb-2'>
                          <Col xs={4}>
                            <div className='small text-muted mb-1'>Budget:</div>
                            <div className='fw-bold'>
                              ${budget.amount.toFixed(2)}
                            </div>
                          </Col>
                          {status && (
                            <>
                              <Col xs={4}>
                                <div className='small text-muted mb-1'>
                                  Spent:
                                </div>
                                <div
                                  className={
                                    percentage >= 100
                                      ? 'fw-bold text-danger'
                                      : 'fw-bold'
                                  }
                                >
                                  ${status.spent_amount.toFixed(2)}
                                </div>
                              </Col>
                              <Col xs={4}>
                                <div className='small text-muted mb-1'>
                                  Remaining:
                                </div>
                                <div className='fw-bold text-success'>
                                  ${status.remaining_amount.toFixed(2)}
                                </div>
                              </Col>
                            </>
                          )}
                        </Row>

                        {status && (
                          <>
                            <div className='d-flex justify-content-between mb-1'>
                              <small>0%</small>
                              <small>
                                <span className='fw-bold'>
                                  {Math.min(percentage, 100).toFixed(0)}%
                                </span>{' '}
                                used
                              </small>
                              <small>100%</small>
                            </div>

                            <ProgressBar
                              now={Math.min(percentage, 100)}
                              variant={getVariant(percentage)}
                              className='mb-2'
                              style={{ height: '8px' }}
                            />

                            {percentage >= 100 && (
                              <Alert
                                variant='danger'
                                className='mt-2 py-2 d-flex align-items-center'
                              >
                                <FaExclamationTriangle className='me-2' />
                                <div className='small'>
                                  You've exceeded your budget limit for{' '}
                                  {budget.category}
                                </div>
                              </Alert>
                            )}

                            {status.status === 'approaching' &&
                              percentage < 100 && (
                                <Alert
                                  variant='warning'
                                  className='mt-2 py-2 d-flex align-items-center'
                                >
                                  <FaExclamationTriangle className='me-2' />
                                  <div className='small'>
                                    You're approaching your budget limit for{' '}
                                    {budget.category}
                                  </div>
                                </Alert>
                              )}
                          </>
                        )}
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BudgetManager;
