import React, { useState, useEffect, useContext } from 'react';
import { CurrencyContext } from '../contexts/CurrencyContext';
import { firestore, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const { currency } = useContext(CurrencyContext);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, [currency]);

  const fetchBudgets = async () => {
    if (!auth.currentUser) return;

    try {
      const budgetsRef = collection(firestore, 'budgets');
      const q = query(budgetsRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      // Get all transactions to calculate spent amount
      const transactionsRef = collection(firestore, 'transactions');
      const transQ = query(
        transactionsRef,
        where('userId', '==', auth.currentUser.uid)
      );
      const transSnapshot = await getDocs(transQ);
      const transactions = [];
      transSnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });

      const fetchedBudgets = [];
      querySnapshot.forEach((doc) => {
        const budget = { id: doc.id, ...doc.data() };

        // Calculate spent amount for this budget category
        let spent = 0;
        transactions.forEach((transaction) => {
          if (
            transaction.category === budget.category &&
            transaction.type === 'expense'
          ) {
            spent += Number(transaction.amount);
          }
        });

        // Add spent and remaining to budget object
        budget.spent = spent;
        budget.remaining = budget.amount - spent;

        fetchedBudgets.push(budget);
      });

      setBudgets(fetchedBudgets);
    } catch (error) {
      console.error('Error fetching budgets: ', error);
      setErrorMessage('Failed to load budgets');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!auth.currentUser) {
      setErrorMessage('You must be logged in to create a budget');
      return;
    }

    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      };

      await addDoc(collection(firestore, 'budgets'), budgetData);
      setFormData({
        category: '',
        amount: '',
        period: 'monthly',
      });
      setSuccessMessage('Budget created successfully!');
      fetchBudgets();
    } catch (error) {
      console.error('Error adding budget: ', error);
      setErrorMessage('Failed to create budget');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteDoc(doc(firestore, 'budgets', id));
        fetchBudgets();
        setSuccessMessage('Budget deleted successfully!');
      } catch (error) {
        console.error('Error deleting budget: ', error);
        setErrorMessage('Failed to delete budget');
      }
    }
  };

  return (
    <div className='budget-page'>
      <div className='row'>
        <div className='col-md-4'>
          <div className='card budget-create-form mb-4'>
            <div className='card-header budget-card-header'>
              <i className='fas fa-plus-circle me-2'></i> Create New Budget
            </div>
            <div className='card-body'>
              {successMessage && (
                <div className='alert alert-success'>{successMessage}</div>
              )}
              {errorMessage && (
                <div className='alert alert-danger'>{errorMessage}</div>
              )}
              <form onSubmit={handleSubmit}>
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
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className='mb-3'>
                  <label htmlFor='amount' className='form-label'>
                    Budget Amount
                  </label>
                  <input
                    type='number'
                    className='form-control'
                    id='amount'
                    name='amount'
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className='mb-3'>
                  <label htmlFor='period' className='form-label'>
                    Period
                  </label>
                  <select
                    className='form-select'
                    id='period'
                    name='period'
                    value={formData.period}
                    onChange={handleChange}
                    required
                  >
                    <option value='monthly'>Monthly</option>
                    <option value='quarterly'>Quarterly</option>
                    <option value='yearly'>Yearly</option>
                  </select>
                </div>
                <button type='submit' className='btn btn-primary'>
                  Create Budget
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className='col-md-8'>
          <div className='card budget-list-card'>
            <div className='card-header budget-card-header'>
              <i className='fas fa-list me-2'></i> Current Budgets
            </div>
            <div className='card-body'>
              {budgets.length === 0 ? (
                <p className='text-muted text-center'>
                  No budgets yet. Create one to get started!
                </p>
              ) : (
                budgets.map((budget) => (
                  <div key={budget.id} className='budget-item'>
                    <div className='budget-header'>
                      <div className='budget-title'>
                        {budget.category}
                        <span className='period-badge'>{budget.period}</span>
                      </div>
                      <button
                        className='btn-sm budget-delete-btn'
                        onClick={() => handleDelete(budget.id)}
                      >
                        <i className='fas fa-trash-alt'></i> Delete
                      </button>
                    </div>
                    <div className='row'>
                      <div className='col-md-4'>
                        <div className='text-muted'>Budget:</div>
                        <div className='budget-amount'>
                          {currency.symbol}
                          {budget.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className='col-md-4'>
                        <div className='text-muted'>Spent:</div>
                        <div className='budget-spent'>
                          {currency.symbol}
                          {budget.spent.toFixed(2)}
                        </div>
                      </div>
                      <div className='col-md-4'>
                        <div className='text-muted'>Remaining:</div>
                        <div className='budget-remaining'>
                          {currency.symbol}
                          {budget.remaining.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className='budget-progress'>
                      <div
                        className='budget-progress-bar'
                        style={{
                          width: `${Math.min(
                            (budget.spent / budget.amount) * 100,
                            100
                          )}%`,
                          backgroundColor:
                            budget.spent > budget.amount
                              ? 'var(--danger)'
                              : budget.spent > budget.amount * 0.75
                              ? 'var(--warning)'
                              : 'var(--success)',
                        }}
                      ></div>
                    </div>
                    <div className='d-flex justify-content-between'>
                      <small className='text-muted'>0%</small>
                      <small className='text-muted'>
                        {Math.min(
                          Math.round((budget.spent / budget.amount) * 100),
                          100
                        )}
                        % used
                      </small>
                      <small className='text-muted'>100%</small>
                    </div>
                    {budget.spent > budget.amount && (
                      <div className='alert alert-danger mt-2 p-2 budget-warning-message'>
                        <i className='fas fa-exclamation-triangle me-2'></i>
                        You've exceeded your budget limit for {budget.category}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets;
