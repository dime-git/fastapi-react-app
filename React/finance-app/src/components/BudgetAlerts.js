import React, { useState, useEffect } from 'react';
import { Alert, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const BudgetAlerts = ({ transactions }) => {
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBudgetAlerts();
  }, [transactions]);

  const fetchBudgetAlerts = async () => {
    try {
      setLoading(true);

      // Get all budgets
      const budgetsResponse = await axios.get(`${API_URL}/budgets`);
      const budgets = budgetsResponse.data;

      if (budgets.length === 0) {
        setLoading(false);
        return;
      }

      // Check status for each budget
      const alertsData = [];

      for (const budget of budgets) {
        try {
          const statusResponse = await axios.get(
            `${API_URL}/budgets/status/${budget.category}`
          );
          const status = statusResponse.data;

          // Only add alerts for approaching or exceeded budgets
          if (status.status === 'approaching' || status.status === 'exceeded') {
            alertsData.push({
              id: budget.id,
              category: budget.category,
              budgetAmount: budget.amount,
              spentAmount: status.spent_amount,
              remainingAmount: status.remaining_amount,
              percentageUsed: status.percentage_used,
              status: status.status,
            });
          }
        } catch (err) {
          console.error(
            `Error checking budget status for ${budget.category}:`,
            err
          );
        }
      }

      setBudgetAlerts(alertsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching budget alerts:', err);
      setError('Failed to load budget alerts');
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading budget alerts...</div>;
  }

  if (error) {
    return <Alert variant='danger'>{error}</Alert>;
  }

  if (budgetAlerts.length === 0) {
    return null; // Don't show anything if there are no alerts
  }

  return (
    <div className='budget-alerts mb-4'>
      <h4>
        Budget Alerts <Badge bg='warning'>{budgetAlerts.length}</Badge>
      </h4>

      {budgetAlerts.map((alert) => (
        <Alert
          key={alert.id}
          variant={alert.status === 'exceeded' ? 'danger' : 'warning'}
          className='d-flex justify-content-between align-items-center'
        >
          <div>
            <strong>{alert.category}:</strong> ${alert.spentAmount.toFixed(2)} /
            ${alert.budgetAmount.toFixed(2)} ({alert.percentageUsed.toFixed(0)}
            %)
          </div>
          <div>
            <Badge bg={alert.status === 'exceeded' ? 'danger' : 'warning'}>
              {alert.status === 'exceeded' ? 'Exceeded' : 'Approaching Limit'}
            </Badge>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default BudgetAlerts;
