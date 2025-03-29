import React, { useState } from 'react';
import api from '../api';
import { Card, Badge, Button, Form, Row, Col } from 'react-bootstrap';
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTag,
  FaInfo,
} from 'react-icons/fa';

const TransactionItem = ({ transaction, onTransactionUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState({
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description,
    is_income: transaction.is_income,
    date: transaction.date,
    currency: transaction.currency || 'USD',
  });

  // Handle input changes for the edit form
  const handleInputChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditedTransaction({ ...editedTransaction, [e.target.name]: value });
  };

  // Find currency symbol for display
  const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
      case 'EUR':
        return '€';
      case 'MKD':
        return 'ден';
      case 'USD':
      default:
        return '$';
    }
  };

  // Handle form submission to update a transaction
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Format the data before sending to API
      const submissionData = {
        ...editedTransaction,
        amount: parseFloat(editedTransaction.amount),
      };

      // Make PUT request to update transaction
      await api.put(`/transactions/${transaction.id}`, submissionData);

      setIsEditing(false);

      // Notify parent component to refresh transactions
      if (onTransactionUpdated) {
        onTransactionUpdated();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  // Handle transaction deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${transaction.id}`);

        // Notify parent component to refresh transactions
        if (onTransactionUpdated) {
          onTransactionUpdated();
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  // Format category string to add spaces between words
  const formatCategory = (category) => {
    // Insert space before capital letters and numbers
    return category.replace(/([a-z])([A-Z0-9])/g, '$1 $2');
  };

  // Display the transaction item
  if (!isEditing) {
    const currencySymbol = getCurrencySymbol(transaction.currency || 'USD');
    const formattedDate = new Date(transaction.date).toLocaleDateString();

    return (
      <Card
        className='transaction-item mb-3 border-0 shadow-sm'
        id={`transaction-${transaction.id}`}
      >
        <Card.Body>
          <Row className='align-items-center'>
            <Col xs={12} md={7}>
              <div className='d-flex align-items-start'>
                <div
                  className={`transaction-icon rounded-circle p-2 me-3 ${
                    transaction.is_income ? 'bg-success' : 'bg-danger'
                  } bg-opacity-10`}
                >
                  <FaMoneyBillWave
                    className={
                      transaction.is_income ? 'text-success' : 'text-danger'
                    }
                  />
                </div>
                <div>
                  <div className='d-flex align-items-center mb-1'>
                    <h5 className='mb-0 me-2'>
                      {formatCategory(transaction.category)}
                    </h5>
                    <Badge
                      bg={transaction.is_income ? 'success' : 'danger'}
                      className='px-2 py-1'
                    >
                      {transaction.is_income ? 'Income' : 'Expense'}
                    </Badge>
                  </div>
                  <div className='text-muted small mb-1'>
                    <FaInfo className='me-1' />{' '}
                    {transaction.description || 'No description'}
                  </div>
                  <div className='d-flex align-items-center text-muted small'>
                    <FaCalendarAlt className='me-1' /> {formattedDate}
                    <span className='mx-2'>•</span>
                    <FaTag className='me-1' /> {transaction.currency}
                    {transaction.original_amount && (
                      <span className='ms-2'>
                        (Originally:{' '}
                        {getCurrencySymbol(transaction.original_currency)}
                        {Math.abs(transaction.original_amount).toFixed(2)}{' '}
                        {transaction.original_currency})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={12} md={3} className='mt-3 mt-md-0 text-md-center'>
              <h4
                className={
                  transaction.is_income ? 'text-success' : 'text-danger'
                }
              >
                {transaction.is_income ? '+' : '-'}
                {currencySymbol}
                {Math.abs(transaction.amount).toFixed(2)}
              </h4>
            </Col>
            <Col xs={12} md={2} className='mt-3 mt-md-0 text-md-end'>
              <Button
                variant='outline-primary'
                size='sm'
                className='me-2'
                onClick={() => setIsEditing(true)}
              >
                <FaEdit className='me-1' /> Edit
              </Button>
              <Button variant='outline-danger' size='sm' onClick={handleDelete}>
                <FaTrash className='me-1' /> Delete
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }

  // Display the edit form when isEditing is true
  return (
    <Card className='transaction-item mb-3 border-0 shadow-sm'>
      <Card.Body>
        <Form onSubmit={handleUpdate}>
          <Row>
            <Col md={6} className='mb-3'>
              <Form.Group controlId={`amount-${transaction.id}`}>
                <Form.Label>Amount</Form.Label>
                <Form.Control
                  type='number'
                  name='amount'
                  value={editedTransaction.amount}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6} className='mb-3'>
              <Form.Group controlId={`currency-${transaction.id}`}>
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  name='currency'
                  value={editedTransaction.currency}
                  onChange={handleInputChange}
                  required
                >
                  <option value='USD'>USD ($)</option>
                  <option value='EUR'>EUR (€)</option>
                  <option value='MKD'>MKD (ден)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6} className='mb-3'>
              <Form.Group controlId={`category-${transaction.id}`}>
                <Form.Label>Category</Form.Label>
                <Form.Control
                  type='text'
                  name='category'
                  value={editedTransaction.category}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6} className='mb-3'>
              <Form.Group controlId={`date-${transaction.id}`}>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type='date'
                  name='date'
                  value={editedTransaction.date}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group
            className='mb-3'
            controlId={`description-${transaction.id}`}
          >
            <Form.Label>Description</Form.Label>
            <Form.Control
              type='text'
              name='description'
              value={editedTransaction.description}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group className='mb-3'>
            <Form.Check
              type='checkbox'
              id={`is_income-${transaction.id}`}
              name='is_income'
              checked={editedTransaction.is_income}
              onChange={handleInputChange}
              label='This is income'
            />
          </Form.Group>
          <div className='d-flex justify-content-end'>
            <Button
              variant='outline-secondary'
              className='me-2'
              onClick={() => setIsEditing(false)}
            >
              <FaTimes className='me-1' /> Cancel
            </Button>
            <Button variant='primary' type='submit'>
              <FaSave className='me-1' /> Save Changes
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default TransactionItem;
