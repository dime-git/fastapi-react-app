import React, { useState, useEffect } from 'react';
import api from './api';

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    is_income: false,
    date: '',
  });

  // Format category string to add spaces between words
  const formatCategory = (category) => {
    // Insert space before capital letters and numbers
    return category.replace(/([a-z])([A-Z0-9])/g, '$1 $2');
  };

  const fetchTransactions = async () => {
    const response = await api.get('/transactions/');
    setTransactions(response.data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleInputChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format the data before sending to API
    const submissionData = {
      ...formData,
      amount: parseFloat(formData.amount), // Convert string to float
      date: formData.date || new Date().toISOString().split('T')[0], // Use current date if empty
    };

    try {
      await api.post('/transactions/', submissionData);
      fetchTransactions();
      setFormData({
        amount: '',
        category: '',
        description: '',
        is_income: false,
        date: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  };

  return (
    <div>
      <nav className='bg-primary text-white p-4'>
        <div className='container-fluid'>
          <a href='#' className='navbar-brand'>
            Finance App
          </a>
        </div>
      </nav>
      <div className='container'>
        <form onSubmit={handleSubmit}>
          <div className='mb-3 mt-3'>
            <label htmlFor='amount' className='form-label'>
              Amount
            </label>
            <input
              type='number'
              className='form-control'
              id='amount'
              name='amount'
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className='mb-3'>
            <label htmlFor='category' className='form-label'>
              Category
            </label>
            <input
              type='text'
              className='form-control'
              id='category'
              name='category'
              value={formData.category}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className='mb-3'>
            <label htmlFor='description' className='form-label'>
              Description
            </label>
            <input
              type='text'
              className='form-control'
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className='mb-3'>
            <label htmlFor='is_income' className='form-label'>
              Is Income
            </label>
            <input
              type='checkbox'
              className='form-check-input'
              id='is_income'
              name='is_income'
              checked={formData.is_income}
              onChange={handleInputChange}
            />
          </div>
          <div className='mb-3'>
            <label htmlFor='date' className='form-label'>
              Date
            </label>
            <input
              type='date'
              className='form-control'
              id='date'
              name='date'
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type='submit' className='btn btn-primary'>
            Add Transaction
          </button>
        </form>
        <table className='table table-striped table-bordered table-hover'>
          <thead>
            <tr>
              <th>Amount</th>
              <th>Category</th>
              <th>Description</th>
              <th>Is Income</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.amount}</td>
                <td>{formatCategory(transaction.category)}</td>
                <td>{transaction.description}</td>
                <td>{transaction.is_income ? 'Yes' : 'No'}</td>
                <td>{transaction.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default App;
