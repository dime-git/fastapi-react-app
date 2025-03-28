import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  ListGroup,
  ProgressBar,
  Alert,
} from 'react-bootstrap';
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

  return (
    <div className='budget-manager'>
      <Card className='mb-4'>
        <Card.Header>
          <h4>Budget Manager</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant='danger'>{error}</Alert>}
          {success && <Alert variant='success'>{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className='mb-3'>
              <Form.Label>Category</Form.Label>
              <Form.Select
                name='category'
                value={newBudget.category}
                onChange={handleInputChange}
                required
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
              <Form.Label>Budget Amount</Form.Label>
              <Form.Control
                type='number'
                name='amount'
                value={newBudget.amount}
                onChange={handleInputChange}
                placeholder='Enter amount'
                min='0.01'
                step='0.01'
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Period</Form.Label>
              <Form.Select
                name='period'
                value={newBudget.period}
                onChange={handleInputChange}
              >
                <option value='monthly'>Monthly</option>
                <option value='weekly'>Weekly</option>
                <option value='yearly'>Yearly</option>
              </Form.Select>
            </Form.Group>

            <Button variant='primary' type='submit'>
              Add Budget
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h4>Current Budgets</h4>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <p>Loading budgets...</p>
          ) : budgets.length === 0 ? (
            <p>No budgets set. Create your first budget above.</p>
          ) : (
            <ListGroup>
              {budgets.map((budget) => {
                const status = budgetStatuses[budget.category] || null;
                const percentage = status ? status.percentage_used : 0;

                return (
                  <ListGroup.Item key={budget.id} className='mb-3'>
                    <div className='d-flex justify-content-between align-items-center mb-1'>
                      <h5>{budget.category}</h5>
                      <Button
                        variant='danger'
                        size='sm'
                        onClick={() => handleDelete(budget.id)}
                      >
                        Delete
                      </Button>
                    </div>

                    <p>
                      Budget: ${budget.amount.toFixed(2)} ({budget.period})
                    </p>

                    {status && (
                      <>
                        <div className='d-flex justify-content-between'>
                          <span>Spent: ${status.spent_amount.toFixed(2)}</span>
                          <span>
                            Remaining: ${status.remaining_amount.toFixed(2)}
                          </span>
                        </div>

                        <ProgressBar
                          now={Math.min(percentage, 100)}
                          variant={getVariant(percentage)}
                          className='mt-2'
                        />

                        {status.status === 'approaching' && (
                          <Alert variant='warning' className='mt-2 py-1'>
                            <small>You're approaching your budget limit</small>
                          </Alert>
                        )}

                        {status.status === 'exceeded' && (
                          <Alert variant='danger' className='mt-2 py-1'>
                            <small>You've exceeded your budget limit</small>
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
    </div>
  );
};

export default BudgetManager;
