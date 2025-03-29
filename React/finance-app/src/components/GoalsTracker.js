import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  ProgressBar,
  Modal,
  Alert,
  Spinner,
} from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GoalsTracker = ({ displayCurrency }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [historyData, setHistoryData] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form state for adding a new goal
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    category: '',
    currency: displayCurrency || 'USD',
    deadline: '',
    description: '',
  });

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'EUR':
        return '€';
      case 'MKD':
        return 'ден';
      case 'USD':
      default:
        return '$';
    }
  };

  // Format currency for display
  const formatCurrency = (amount, currency) => {
    return `${getCurrencySymbol(currency)}${parseFloat(amount).toFixed(2)}`;
  };

  // Load goals from API
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/goals', {
        params: { currency: displayCurrency },
      });
      setGoals(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate some mock history data for visualization
  const generateHistoryData = (goal) => {
    const today = new Date();
    const data = [];

    // Generate points for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);

      // For completed goals, make the final amount match the target
      if (i === 0 && goal.is_completed) {
        data.push({
          x: date.toISOString().slice(0, 10),
          y: goal.target_amount,
        });
      } else {
        // Create a growth trend
        const progressPercentage = Math.min(
          100,
          (5 - i) * (goal.progress_percentage / 5)
        );
        data.push({
          x: date.toISOString().slice(0, 10),
          y: ((goal.target_amount * progressPercentage) / 100).toFixed(2),
        });
      }
    }

    return {
      labels: data.map((point) => point.x),
      datasets: [
        {
          label: 'Savings Progress',
          data: data.map((point) => point.y),
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1,
        },
        {
          label: 'Target',
          data: data.map(() => goal.target_amount),
          fill: false,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderDash: [5, 5],
          pointRadius: 0,
        },
      ],
    };
  };

  // Load goals on component mount and when display currency changes
  useEffect(() => {
    fetchGoals();
  }, [displayCurrency]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal({
      ...newGoal,
      [name]: value,
    });
  };

  // Handle add goal form submission
  const handleAddGoal = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Format data for API
      const goalData = {
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount || 0),
      };

      await api.post('/goals', goalData);

      // Reset form and close modal
      setNewGoal({
        name: '',
        target_amount: '',
        current_amount: '0',
        category: '',
        currency: displayCurrency || 'USD',
        deadline: '',
        description: '',
      });

      setShowAddModal(false);
      fetchGoals();
    } catch (err) {
      console.error('Error adding goal:', err);
      setError('Failed to add goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle goal contribution
  const handleContribute = async (e) => {
    e.preventDefault();

    if (!selectedGoal || !contributionAmount) {
      return;
    }

    try {
      setLoading(true);

      await api.post(
        `/goals/${selectedGoal.id}/contribute?amount=${parseFloat(
          contributionAmount
        )}`
      );

      setContributionAmount('');
      setShowContributeModal(false);
      fetchGoals();
    } catch (err) {
      console.error('Error contributing to goal:', err);
      setError('Failed to update contribution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle showing the history modal
  const handleShowHistory = (goal) => {
    setSelectedGoal(goal);
    setHistoryData(generateHistoryData(goal));
    setShowHistoryModal(true);
  };

  // Handle closing the history modal
  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    // Give time for modal to fully close before clearing the chart data
    setTimeout(() => {
      setHistoryData({});
      setSelectedGoal(null);
    }, 300);
  };

  // Handle delete goal
  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        setLoading(true);
        await api.delete(`/goals/${goalId}`);
        fetchGoals();
      } catch (err) {
        console.error('Error deleting goal:', err);
        setError('Failed to delete goal. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && goals.length === 0) {
    return (
      <div className='text-center my-5'>
        <Spinner animation='border' variant='primary' />
        <p className='mt-2'>Loading goals...</p>
      </div>
    );
  }

  return (
    <div className='goals-tracker'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h2>Financial Goals</h2>
        <Button variant='primary' onClick={() => setShowAddModal(true)}>
          <i className='bi bi-plus-circle me-2'></i> Add New Goal
        </Button>
      </div>

      {error && (
        <Alert variant='danger' onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {goals.length === 0 ? (
        <div className='text-center my-5'>
          <p className='lead'>You don't have any financial goals yet.</p>
          <Button variant='primary' onClick={() => setShowAddModal(true)}>
            Create Your First Goal
          </Button>
        </div>
      ) : (
        <div className='row'>
          {goals.map((goal) => (
            <div className='col-md-6 col-lg-4 mb-4' key={goal.id}>
              <Card>
                <Card.Header className='d-flex justify-content-between align-items-center'>
                  <h5 className='mb-0'>{goal.name}</h5>
                  {goal.is_completed && (
                    <span className='badge bg-success'>Completed!</span>
                  )}
                </Card.Header>
                <Card.Body>
                  <div className='mb-3'>
                    <small className='text-muted'>
                      Category: {goal.category || 'General'}
                    </small>
                    {goal.deadline && (
                      <small className='text-muted d-block'>
                        Target Date:{' '}
                        {new Date(goal.deadline).toLocaleDateString()}
                      </small>
                    )}
                  </div>

                  <div className='mb-3'>
                    <div className='d-flex justify-content-between'>
                      <div>
                        Current:{' '}
                        <strong>
                          {formatCurrency(goal.current_amount, goal.currency)}
                        </strong>
                      </div>
                      <div>
                        Target:{' '}
                        <strong>
                          {formatCurrency(goal.target_amount, goal.currency)}
                        </strong>
                      </div>
                    </div>
                    <ProgressBar
                      now={goal.progress_percentage}
                      label={`${Math.round(goal.progress_percentage)}%`}
                      variant={goal.is_completed ? 'success' : 'primary'}
                      className='mt-2'
                    />
                  </div>

                  {goal.description && (
                    <p className='text-muted small mb-3'>{goal.description}</p>
                  )}

                  <div className='d-flex justify-content-between'>
                    <Button
                      variant='outline-primary'
                      size='sm'
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowContributeModal(true);
                      }}
                      disabled={goal.is_completed}
                    >
                      Add Contribution
                    </Button>
                    <Button
                      variant='outline-info'
                      size='sm'
                      onClick={() => handleShowHistory(goal)}
                    >
                      View Progress
                    </Button>
                    <Button
                      variant='outline-danger'
                      size='sm'
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Financial Goal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddGoal}>
            <Form.Group className='mb-3'>
              <Form.Label>Goal Name</Form.Label>
              <Form.Control
                type='text'
                name='name'
                value={newGoal.name}
                onChange={handleInputChange}
                required
                placeholder='e.g., New Car, Emergency Fund'
              />
            </Form.Group>

            <div className='row'>
              <div className='col-md-6'>
                <Form.Group className='mb-3'>
                  <Form.Label>Target Amount</Form.Label>
                  <Form.Control
                    type='number'
                    name='target_amount'
                    value={newGoal.target_amount}
                    onChange={handleInputChange}
                    required
                    min='1'
                    step='0.01'
                    placeholder='5000'
                  />
                </Form.Group>
              </div>
              <div className='col-md-6'>
                <Form.Group className='mb-3'>
                  <Form.Label>Starting Amount (Optional)</Form.Label>
                  <Form.Control
                    type='number'
                    name='current_amount'
                    value={newGoal.current_amount}
                    onChange={handleInputChange}
                    min='0'
                    step='0.01'
                    placeholder='0'
                  />
                </Form.Group>
              </div>
            </div>

            <div className='row'>
              <div className='col-md-6'>
                <Form.Group className='mb-3'>
                  <Form.Label>Category (Optional)</Form.Label>
                  <Form.Control
                    type='text'
                    name='category'
                    value={newGoal.category}
                    onChange={handleInputChange}
                    placeholder='e.g., Savings, Education'
                  />
                </Form.Group>
              </div>
              <div className='col-md-6'>
                <Form.Group className='mb-3'>
                  <Form.Label>Currency</Form.Label>
                  <Form.Select
                    name='currency'
                    value={newGoal.currency}
                    onChange={handleInputChange}
                  >
                    <option value='USD'>USD ($)</option>
                    <option value='EUR'>EUR (€)</option>
                    <option value='MKD'>MKD (ден)</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <Form.Group className='mb-3'>
              <Form.Label>Target Date (Optional)</Form.Label>
              <Form.Control
                type='date'
                name='deadline'
                value={newGoal.deadline}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                name='description'
                value={newGoal.description}
                onChange={handleInputChange}
                placeholder='Brief description of your goal'
              />
            </Form.Group>

            <div className='d-flex justify-content-end'>
              <Button
                variant='secondary'
                className='me-2'
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button variant='primary' type='submit' disabled={loading}>
                {loading ? 'Saving...' : 'Save Goal'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        show={showContributeModal}
        onHide={() => setShowContributeModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Contribution</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGoal && (
            <Form onSubmit={handleContribute}>
              <p>
                Contributing to: <strong>{selectedGoal.name}</strong>
              </p>
              <p>
                Current Progress:{' '}
                {formatCurrency(
                  selectedGoal.current_amount,
                  selectedGoal.currency
                )}{' '}
                of{' '}
                {formatCurrency(
                  selectedGoal.target_amount,
                  selectedGoal.currency
                )}
                ({Math.round(selectedGoal.progress_percentage)}%)
              </p>

              <Form.Group className='mb-3'>
                <Form.Label>Contribution Amount</Form.Label>
                <Form.Control
                  type='number'
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  required
                  min='0.01'
                  step='0.01'
                  placeholder={`Amount in ${selectedGoal.currency}`}
                />
              </Form.Group>

              <div className='d-flex justify-content-end'>
                <Button
                  variant='secondary'
                  className='me-2'
                  onClick={() => setShowContributeModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  type='submit'
                  disabled={loading || !contributionAmount}
                >
                  {loading ? 'Saving...' : 'Add Contribution'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* History/Progress Modal */}
      <Modal show={showHistoryModal} onHide={handleCloseHistoryModal} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedGoal && `${selectedGoal.name} - Progress`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGoal && Object.keys(historyData).length > 0 && (
            <>
              <div className='mb-4'>
                <h5>Goal Details</h5>
                <p>
                  <strong>Target:</strong>{' '}
                  {formatCurrency(
                    selectedGoal.target_amount,
                    selectedGoal.currency
                  )}
                  <br />
                  <strong>Current:</strong>{' '}
                  {formatCurrency(
                    selectedGoal.current_amount,
                    selectedGoal.currency
                  )}
                  <br />
                  <strong>Progress:</strong>{' '}
                  {Math.round(selectedGoal.progress_percentage)}%
                  {selectedGoal.deadline && (
                    <>
                      <br />
                      <strong>Target Date:</strong>{' '}
                      {new Date(selectedGoal.deadline).toLocaleDateString()}
                    </>
                  )}
                </p>
              </div>

              <div className='chart-container' style={{ height: '300px' }}>
                <Line
                  data={historyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: `Amount (${selectedGoal.currency})`,
                        },
                        beginAtZero: true,
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Date',
                        },
                      },
                    },
                  }}
                />
              </div>

              <div className='mt-4'>
                <p className='text-muted small'>
                  Note: This chart shows your estimated progress over time. More
                  detailed tracking will become available as you continue to
                  contribute to this goal.
                </p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCloseHistoryModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GoalsTracker;
