import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  ListGroup,
  Alert,
  Modal,
  Badge,
} from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const RecurringTransactions = ({ categories, onGenerateTransactions }) => {
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    description: '',
    is_income: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    frequency: 'monthly', // default to monthly
    day_of_week: 0, // Monday (0-6, Monday-Sunday)
    day_of_month: 1,
    month_of_year: 1, // January
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [generatingTransactions, setGeneratingTransactions] = useState(false);
  const [transactionsGenerated, setTransactionsGenerated] = useState(null);

  // Fetch all recurring transactions when component mounts
  useEffect(() => {
    fetchRecurringTransactions();
  }, []);

  const fetchRecurringTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/recurring-transactions`);
      setRecurringTransactions(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching recurring transactions:', err);
      setError('Failed to load recurring transactions');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setNewTransaction({ ...newTransaction, [name]: checked });
    } else if (name === 'amount') {
      // Convert amount to number if it's valid
      setNewTransaction({
        ...newTransaction,
        [name]: value === '' ? '' : parseFloat(value) || newTransaction.amount,
      });
    } else if (
      ['day_of_week', 'day_of_month', 'month_of_year'].includes(name)
    ) {
      // Convert these fields to numbers
      setNewTransaction({
        ...newTransaction,
        [name]: parseInt(value, 10),
      });
    } else {
      setNewTransaction({ ...newTransaction, [name]: value });
    }
  };

  const handleFrequencyChange = (e) => {
    const frequency = e.target.value;
    setNewTransaction({
      ...newTransaction,
      frequency,
      // Set defaults based on frequency
      day_of_week: frequency === 'weekly' ? 0 : null, // Monday is 0
      day_of_month: ['monthly', 'yearly'].includes(frequency) ? 1 : null,
      month_of_year: frequency === 'yearly' ? 1 : null, // January
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (
      !newTransaction.amount ||
      !newTransaction.category ||
      !newTransaction.description
    ) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/recurring-transactions`, newTransaction);
      setSuccess('Recurring transaction created successfully');

      // Reset form
      setNewTransaction({
        amount: '',
        category: '',
        description: '',
        is_income: false,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        frequency: 'monthly',
        day_of_week: 0,
        day_of_month: 1,
        month_of_year: 1,
      });

      // Refresh list
      fetchRecurringTransactions();
    } catch (err) {
      console.error('Error creating recurring transaction:', err);
      setError(
        err.response?.data?.detail || 'Failed to create recurring transaction'
      );
    }
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await axios.delete(
        `${API_URL}/recurring-transactions/${transactionToDelete.id}`
      );

      // Close modal and clear transaction to delete
      setShowConfirmDelete(false);
      setTransactionToDelete(null);

      // Refresh list
      fetchRecurringTransactions();
      setSuccess('Recurring transaction deleted successfully');
    } catch (err) {
      console.error('Error deleting recurring transaction:', err);
      setError('Failed to delete recurring transaction');
      setShowConfirmDelete(false);
    }
  };

  const generateTransactionsNow = async () => {
    try {
      setGeneratingTransactions(true);
      setError('');

      const response = await axios.post(
        `${API_URL}/recurring-transactions/generate-now`
      );
      setTransactionsGenerated({
        count: response.data.transactions_created,
        errors: response.data.errors,
      });

      // Notify parent component to refresh transactions
      if (onGenerateTransactions) {
        onGenerateTransactions();
      }

      setGeneratingTransactions(false);
    } catch (err) {
      console.error('Error generating transactions:', err);
      setError('Failed to generate transactions');
      setGeneratingTransactions(false);
    }
  };

  const formatFrequency = (transaction) => {
    switch (transaction.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        const days = [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ];
        return `Weekly (every ${days[transaction.day_of_week]})`;
      case 'monthly':
        return `Monthly (day ${transaction.day_of_month})`;
      case 'yearly':
        const months = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        return `Yearly (${months[transaction.month_of_year - 1]} ${
          transaction.day_of_month
        })`;
      default:
        return transaction.frequency;
    }
  };

  return (
    <div className='recurring-transactions'>
      <Card className='mb-4'>
        <Card.Header>
          <h4>Create Recurring Transaction</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant='danger'>{error}</Alert>}
          {success && <Alert variant='success'>{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <div className='row'>
              <div className='col-md-6 mb-3'>
                <Form.Group>
                  <Form.Label>Amount*</Form.Label>
                  <Form.Control
                    type='number'
                    step='0.01'
                    name='amount'
                    value={newTransaction.amount}
                    onChange={handleInputChange}
                    placeholder='Enter amount'
                    required
                  />
                </Form.Group>
              </div>

              <div className='col-md-6 mb-3'>
                <Form.Group>
                  <Form.Label>Category*</Form.Label>
                  <Form.Select
                    name='category'
                    value={newTransaction.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value=''>Select a category</option>
                    {categories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className='row'>
              <div className='col-md-6 mb-3'>
                <Form.Group>
                  <Form.Label>Description*</Form.Label>
                  <Form.Control
                    type='text'
                    name='description'
                    value={newTransaction.description}
                    onChange={handleInputChange}
                    placeholder='Enter description'
                    required
                  />
                </Form.Group>
              </div>

              <div className='col-md-6 mb-3'>
                <Form.Group>
                  <Form.Label>Income/Expense</Form.Label>
                  <div className='mt-2'>
                    <Form.Check
                      type='checkbox'
                      id='is_income'
                      name='is_income'
                      label='This is income'
                      checked={newTransaction.is_income}
                      onChange={handleInputChange}
                    />
                  </div>
                </Form.Group>
              </div>
            </div>

            <div className='row'>
              <div className='col-md-6 mb-3'>
                <Form.Group>
                  <Form.Label>Start Date*</Form.Label>
                  <Form.Control
                    type='date'
                    name='start_date'
                    value={newTransaction.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>

              <div className='col-md-6 mb-3'>
                <Form.Group>
                  <Form.Label>End Date (optional)</Form.Label>
                  <Form.Control
                    type='date'
                    name='end_date'
                    value={newTransaction.end_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
            </div>

            <div className='row'>
              <div className='col-md-12 mb-3'>
                <Form.Group>
                  <Form.Label>Frequency*</Form.Label>
                  <Form.Select
                    name='frequency'
                    value={newTransaction.frequency}
                    onChange={handleFrequencyChange}
                    required
                  >
                    <option value='daily'>Daily</option>
                    <option value='weekly'>Weekly</option>
                    <option value='monthly'>Monthly</option>
                    <option value='yearly'>Yearly</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            {newTransaction.frequency === 'weekly' && (
              <div className='row'>
                <div className='col-md-12 mb-3'>
                  <Form.Group>
                    <Form.Label>Day of Week*</Form.Label>
                    <Form.Select
                      name='day_of_week'
                      value={newTransaction.day_of_week}
                      onChange={handleInputChange}
                      required
                    >
                      <option value={0}>Monday</option>
                      <option value={1}>Tuesday</option>
                      <option value={2}>Wednesday</option>
                      <option value={3}>Thursday</option>
                      <option value={4}>Friday</option>
                      <option value={5}>Saturday</option>
                      <option value={6}>Sunday</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            )}

            {['monthly', 'yearly'].includes(newTransaction.frequency) && (
              <div className='row'>
                <div className='col-md-12 mb-3'>
                  <Form.Group>
                    <Form.Label>Day of Month*</Form.Label>
                    <Form.Select
                      name='day_of_month'
                      value={newTransaction.day_of_month}
                      onChange={handleInputChange}
                      required
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            )}

            {newTransaction.frequency === 'yearly' && (
              <div className='row'>
                <div className='col-md-12 mb-3'>
                  <Form.Group>
                    <Form.Label>Month*</Form.Label>
                    <Form.Select
                      name='month_of_year'
                      value={newTransaction.month_of_year}
                      onChange={handleInputChange}
                      required
                    >
                      <option value={1}>January</option>
                      <option value={2}>February</option>
                      <option value={3}>March</option>
                      <option value={4}>April</option>
                      <option value={5}>May</option>
                      <option value={6}>June</option>
                      <option value={7}>July</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>October</option>
                      <option value={11}>November</option>
                      <option value={12}>December</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            )}

            <Button variant='primary' type='submit'>
              Create Recurring Transaction
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h3>Current Recurring Transactions</h3>
        <Button
          variant='success'
          onClick={generateTransactionsNow}
          disabled={generatingTransactions}
        >
          {generatingTransactions
            ? 'Generating...'
            : 'Generate Transactions Now'}
        </Button>
      </div>

      {transactionsGenerated && (
        <Alert
          variant={
            transactionsGenerated.errors.length > 0 ? 'warning' : 'success'
          }
          onClose={() => setTransactionsGenerated(null)}
          dismissible
        >
          <Alert.Heading>Transactions Generated</Alert.Heading>
          <p>{transactionsGenerated.count} transactions were created.</p>
          {transactionsGenerated.errors.length > 0 && (
            <>
              <p>Errors:</p>
              <ul>
                {transactionsGenerated.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </>
          )}
        </Alert>
      )}

      {loading ? (
        <p>Loading recurring transactions...</p>
      ) : recurringTransactions.length === 0 ? (
        <p>No recurring transactions set up. Create your first one above!</p>
      ) : (
        <ListGroup>
          {recurringTransactions.map((transaction) => (
            <ListGroup.Item key={transaction.id} className='mb-3'>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <h5 className='mb-0'>
                  {transaction.description}
                  <Badge
                    bg={transaction.is_income ? 'success' : 'danger'}
                    className='ms-2'
                  >
                    {transaction.is_income ? 'Income' : 'Expense'}
                  </Badge>
                </h5>
                <Button
                  variant='danger'
                  size='sm'
                  onClick={() => {
                    setTransactionToDelete(transaction);
                    setShowConfirmDelete(true);
                  }}
                >
                  Delete
                </Button>
              </div>

              <div className='mb-1'>
                <strong>Amount:</strong> ${transaction.amount.toFixed(2)}
              </div>

              <div className='mb-1'>
                <strong>Category:</strong> {transaction.category}
              </div>

              <div className='mb-1'>
                <strong>Frequency:</strong> {formatFrequency(transaction)}
              </div>

              <div className='mb-1'>
                <strong>Start Date:</strong>{' '}
                {new Date(transaction.start_date).toLocaleDateString()}
                {transaction.end_date && (
                  <span>
                    <strong className='ms-3'>End Date:</strong>{' '}
                    {new Date(transaction.end_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Confirmation Modal */}
      <Modal
        show={showConfirmDelete}
        onHide={() => setShowConfirmDelete(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the recurring transaction "
          {transactionToDelete?.description}"?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => setShowConfirmDelete(false)}
          >
            Cancel
          </Button>
          <Button variant='danger' onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RecurringTransactions;
