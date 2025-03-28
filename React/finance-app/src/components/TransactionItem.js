import React, { useState } from 'react';
import api from '../api';

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

    return (
      <li
        id={`transaction-${transaction.id}`}
        className='list-group-item d-flex justify-content-between align-items-center'
      >
        <div>
          <span
            className={`badge ${
              transaction.is_income ? 'bg-success' : 'bg-danger'
            } me-2`}
          >
            {transaction.is_income ? '+' : '-'}
            {currencySymbol}
            {Math.abs(transaction.amount).toFixed(2)}
          </span>
          <strong>{formatCategory(transaction.category)}</strong>
          <span className='text-muted ms-2'>{transaction.description}</span>
          <small className='d-block text-muted'>
            {transaction.date} • {transaction.currency}
            {transaction.original_amount && (
              <span className='ms-2'>
                (Originally: {getCurrencySymbol(transaction.original_currency)}
                {Math.abs(transaction.original_amount).toFixed(2)}{' '}
                {transaction.original_currency})
              </span>
            )}
          </small>
        </div>
        <div>
          <button
            className='btn btn-sm btn-outline-primary me-2'
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <button
            className='btn btn-sm btn-outline-danger'
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </li>
    );
  }

  // Display the edit form when isEditing is true
  return (
    <li className='list-group-item'>
      <form onSubmit={handleUpdate}>
        <div className='row'>
          <div className='col-md-6 mb-3'>
            <label htmlFor={`amount-${transaction.id}`} className='form-label'>
              Amount
            </label>
            <input
              type='number'
              className='form-control'
              id={`amount-${transaction.id}`}
              name='amount'
              value={editedTransaction.amount}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className='col-md-6 mb-3'>
            <label
              htmlFor={`currency-${transaction.id}`}
              className='form-label'
            >
              Currency
            </label>
            <select
              className='form-select'
              id={`currency-${transaction.id}`}
              name='currency'
              value={editedTransaction.currency}
              onChange={handleInputChange}
              required
            >
              <option value='USD'>USD ($)</option>
              <option value='EUR'>EUR (€)</option>
              <option value='MKD'>MKD (ден)</option>
            </select>
          </div>
        </div>
        <div className='mb-3'>
          <label htmlFor={`category-${transaction.id}`} className='form-label'>
            Category
          </label>
          <input
            type='text'
            className='form-control'
            id={`category-${transaction.id}`}
            name='category'
            value={editedTransaction.category}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className='mb-3'>
          <label
            htmlFor={`description-${transaction.id}`}
            className='form-label'
          >
            Description
          </label>
          <input
            type='text'
            className='form-control'
            id={`description-${transaction.id}`}
            name='description'
            value={editedTransaction.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className='mb-3 form-check'>
          <input
            type='checkbox'
            className='form-check-input'
            id={`is_income-${transaction.id}`}
            name='is_income'
            checked={editedTransaction.is_income}
            onChange={handleInputChange}
          />
          <label
            htmlFor={`is_income-${transaction.id}`}
            className='form-check-label'
          >
            This is income
          </label>
        </div>
        <div className='mb-3'>
          <label htmlFor={`date-${transaction.id}`} className='form-label'>
            Date
          </label>
          <input
            type='date'
            className='form-control'
            id={`date-${transaction.id}`}
            name='date'
            value={editedTransaction.date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className='d-flex justify-content-end'>
          <button
            type='button'
            className='btn btn-secondary me-2'
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </button>
          <button type='submit' className='btn btn-primary'>
            Save Changes
          </button>
        </div>
      </form>
    </li>
  );
};

export default TransactionItem;
