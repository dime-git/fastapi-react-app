import React, { useState, useEffect } from 'react';
import api from './api';
import TransactionItem from './components/TransactionItem';
import Dashboard from './components/Dashboard';
import BudgetManager from './components/BudgetManager';
import RecurringTransactions from './components/RecurringTransactions';
import CurrencyConverter from './components/CurrencyConverter';
import './App.css';

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    is_income: false,
    date: '',
    currency: 'USD', // Default currency
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions', 'dashboard', 'budgets', 'recurring', 'currency'
  const [categories, setCategories] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD'); // For display only

  // Format category string to add spaces between words
  const formatCategory = (category) => {
    // Insert space before capital letters and numbers
    return category.replace(/([a-z])([A-Z0-9])/g, '$1 $2');
  };

  const fetchTransactions = async (currency = null) => {
    try {
      setIsLoading(true);
      // Add currency parameter if specified - use displayCurrency by default
      const params = currency ? { currency } : { currency: displayCurrency };
      const response = await api.get('/transactions', { params });
      setTransactions(response.data);
      setError(null);

      // Extract unique categories from transactions
      extractCategories(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique categories from transactions
  const extractCategories = (transactionData) => {
    const uniqueCategories = new Map();

    transactionData.forEach((transaction) => {
      if (!uniqueCategories.has(transaction.category)) {
        uniqueCategories.set(transaction.category, {
          name: transaction.category,
          isIncome: transaction.is_income,
        });
      }
    });

    setCategories(Array.from(uniqueCategories.values()));
  };

  useEffect(() => {
    fetchTransactions();
  }, [displayCurrency]); // Refetch when display currency changes

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
      setIsLoading(true);
      await api.post('/transactions', submissionData);
      fetchTransactions();
      setFormData({
        amount: '',
        category: '',
        description: '',
        is_income: false,
        date: '',
        currency: defaultCurrency,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        setError(
          'Failed to add transaction. Please check your data and try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle currency change for default currency
  const handleCurrencyChange = (currencyCode) => {
    setDefaultCurrency(currencyCode);
    setFormData({
      ...formData,
      currency: currencyCode,
    });
    fetchTransactions(currencyCode);
  };

  // Handle change of display currency
  const handleDisplayCurrencyChange = (currency) => {
    setDisplayCurrency(currency);
  };

  // Calculate summary statistics
  const totalIncome = transactions
    .filter((t) => t.is_income)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => !t.is_income)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

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

  const currencySymbol = getCurrencySymbol(displayCurrency);

  return (
    <div>
      <nav className='bg-primary text-white p-4'>
        <div className='container'>
          <div className='d-flex justify-content-between align-items-center'>
            <a href='#' className='navbar-brand'>
              Finance App
            </a>
            <div>
              <button
                className={`btn ${
                  activeTab === 'transactions'
                    ? 'btn-light'
                    : 'btn-outline-light'
                } me-2`}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
              </button>
              <button
                className={`btn ${
                  activeTab === 'recurring' ? 'btn-light' : 'btn-outline-light'
                } me-2`}
                onClick={() => setActiveTab('recurring')}
              >
                Recurring
              </button>
              <button
                className={`btn ${
                  activeTab === 'budgets' ? 'btn-light' : 'btn-outline-light'
                } me-2`}
                onClick={() => setActiveTab('budgets')}
              >
                Budgets
              </button>
              <button
                className={`btn ${
                  activeTab === 'dashboard' ? 'btn-light' : 'btn-outline-light'
                } me-2`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`btn ${
                  activeTab === 'currency' ? 'btn-light' : 'btn-outline-light'
                }`}
                onClick={() => setActiveTab('currency')}
              >
                Currency
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className='container mt-4'>
        {/* Summary Cards */}
        <div className='row mb-4'>
          <div className='col-md-4'>
            <div className='card bg-success text-white'>
              <div className='card-body'>
                <h5 className='card-title'>Income</h5>
                <h3 className='card-text'>
                  {currencySymbol}
                  {totalIncome.toFixed(2)}
                </h3>
                <small>{displayCurrency}</small>
              </div>
            </div>
          </div>
          <div className='col-md-4'>
            <div className='card bg-danger text-white'>
              <div className='card-body'>
                <h5 className='card-title'>Expenses</h5>
                <h3 className='card-text'>
                  {currencySymbol}
                  {totalExpenses.toFixed(2)}
                </h3>
                <small>{displayCurrency}</small>
              </div>
            </div>
          </div>
          <div className='col-md-4'>
            <div className='card bg-primary text-white'>
              <div className='card-body'>
                <h5 className='card-title'>Balance</h5>
                <h3 className='card-text'>
                  {currencySymbol}
                  {balance.toFixed(2)}
                </h3>
                <small>{displayCurrency}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Display Currency Selector */}
        <div className='mb-4'>
          <div className='d-flex align-items-center'>
            <span className='me-3'>Display values in:</span>
            <div className='btn-group'>
              <button
                className={`btn ${
                  displayCurrency === 'USD'
                    ? 'btn-primary'
                    : 'btn-outline-primary'
                }`}
                onClick={() => handleDisplayCurrencyChange('USD')}
              >
                USD ($)
              </button>
              <button
                className={`btn ${
                  displayCurrency === 'EUR'
                    ? 'btn-primary'
                    : 'btn-outline-primary'
                }`}
                onClick={() => handleDisplayCurrencyChange('EUR')}
              >
                EUR (€)
              </button>
              <button
                className={`btn ${
                  displayCurrency === 'MKD'
                    ? 'btn-primary'
                    : 'btn-outline-primary'
                }`}
                onClick={() => handleDisplayCurrencyChange('MKD')}
              >
                MKD (ден)
              </button>
            </div>
          </div>
        </div>

        {/* Currency Converter Tab */}
        {activeTab === 'currency' && (
          <CurrencyConverter onCurrencyChange={handleCurrencyChange} />
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && <Dashboard transactions={transactions} />}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <BudgetManager
            transactions={transactions}
            categories={categories}
            onBudgetChange={(budgetStatuses) => {
              // Optional: Handle budget status changes if needed
              console.log('Budget statuses updated:', budgetStatuses);
            }}
          />
        )}

        {/* Recurring Transactions Tab */}
        {activeTab === 'recurring' && (
          <RecurringTransactions
            categories={categories}
            onGenerateTransactions={() => {
              // Refresh transactions list when new transactions are generated
              fetchTransactions();
            }}
          />
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {/* Add Transaction Form */}
            <div className='card mb-4'>
              <div className='card-header bg-light'>
                <h5>Add New Transaction</h5>
              </div>
              <div className='card-body'>
                <form onSubmit={handleSubmit}>
                  <div className='row'>
                    <div className='col-md-6 mb-3'>
                      <label htmlFor='amount' className='form-label'>
                        Amount
                      </label>
                      <input
                        type='number'
                        step='0.01'
                        className='form-control'
                        id='amount'
                        name='amount'
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className='col-md-6 mb-3'>
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
                  </div>
                  <div className='row'>
                    <div className='col-md-6 mb-3'>
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
                    <div className='col-md-3 mb-3'>
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
                    <div className='col-md-3 mb-3'>
                      <label htmlFor='currency' className='form-label'>
                        Currency
                      </label>
                      <select
                        className='form-select'
                        id='currency'
                        name='currency'
                        value={formData.currency}
                        onChange={handleInputChange}
                      >
                        <option value='USD'>USD ($)</option>
                        <option value='EUR'>EUR (€)</option>
                        <option value='MKD'>MKD (ден)</option>
                      </select>
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col-md-12 mb-3'>
                      <div className='form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          id='is_income'
                          name='is_income'
                          checked={formData.is_income}
                          onChange={handleInputChange}
                        />
                        <label htmlFor='is_income' className='form-check-label'>
                          This is income
                        </label>
                      </div>
                    </div>
                  </div>
                  <button type='submit' className='btn btn-primary w-100'>
                    {isLoading ? 'Adding...' : 'Add Transaction'}
                  </button>
                </form>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className='alert alert-danger' role='alert'>
                {error}
              </div>
            )}

            {/* View toggle buttons */}
            <div className='mb-3 d-flex justify-content-between align-items-center'>
              <h3>Transactions</h3>
              <div className='btn-group' role='group'>
                <button
                  type='button'
                  className={`btn ${
                    viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  List View
                </button>
                <button
                  type='button'
                  className={`btn ${
                    viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </button>
              </div>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className='text-center my-4'>
                <div className='spinner-border text-primary' role='status'>
                  <span className='visually-hidden'>Loading...</span>
                </div>
              </div>
            )}

            {/* List view */}
            {!isLoading && viewMode === 'list' && (
              <ul className='list-group transaction-list'>
                {transactions.length === 0 ? (
                  <li className='list-group-item text-center'>
                    No transactions found. Add one above!
                  </li>
                ) : (
                  transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onTransactionUpdated={fetchTransactions}
                    />
                  ))
                )}
              </ul>
            )}

            {/* Table view */}
            {!isLoading && viewMode === 'table' && (
              <div className='table-responsive'>
                <table className='table table-striped table-bordered table-hover'>
                  <thead className='table-dark'>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Currency</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan='7' className='text-center'>
                          No transactions found. Add one above!
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => {
                        // Get symbol for this transaction
                        const symbol = getCurrencySymbol(transaction.currency);

                        return (
                          <tr key={transaction.id}>
                            <td>{transaction.date}</td>
                            <td
                              className={
                                transaction.is_income
                                  ? 'text-success'
                                  : 'text-danger'
                              }
                            >
                              {transaction.is_income ? '+' : '-'}
                              {symbol}
                              {Math.abs(transaction.amount).toFixed(2)}
                              {transaction.original_amount && (
                                <small className='d-block text-muted'>
                                  Originally:{' '}
                                  {getCurrencySymbol(
                                    transaction.original_currency
                                  )}
                                  {Math.abs(
                                    transaction.original_amount
                                  ).toFixed(2)}{' '}
                                  {transaction.original_currency}
                                </small>
                              )}
                            </td>
                            <td>{transaction.currency}</td>
                            <td>{formatCategory(transaction.category)}</td>
                            <td>{transaction.description}</td>
                            <td>
                              {transaction.is_income ? 'Income' : 'Expense'}
                            </td>
                            <td>
                              <button
                                className='btn btn-sm btn-outline-primary me-2'
                                onClick={() => {
                                  const item = document.getElementById(
                                    `transaction-${transaction.id}`
                                  );
                                  if (item) {
                                    item.scrollIntoView({ behavior: 'smooth' });
                                    // Highlight the item
                                    item.classList.add('highlight');
                                    setTimeout(() => {
                                      item.classList.remove('highlight');
                                    }, 2000);
                                  } else {
                                    setViewMode('list');
                                    setTimeout(() => {
                                      const newItem = document.getElementById(
                                        `transaction-${transaction.id}`
                                      );
                                      if (newItem) {
                                        newItem.scrollIntoView({
                                          behavior: 'smooth',
                                        });
                                        newItem.classList.add('highlight');
                                        setTimeout(() => {
                                          newItem.classList.remove('highlight');
                                        }, 2000);
                                      }
                                    }, 100);
                                  }
                                }}
                              >
                                View
                              </button>
                              <button
                                className='btn btn-sm btn-outline-danger'
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      'Are you sure you want to delete this transaction?'
                                    )
                                  ) {
                                    try {
                                      await api.delete(
                                        `/transactions/${transaction.id}`
                                      );
                                      fetchTransactions();
                                    } catch (error) {
                                      console.error(
                                        'Error deleting transaction:',
                                        error
                                      );
                                    }
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
