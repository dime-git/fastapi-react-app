import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import BudgetAlerts from './BudgetAlerts';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Dashboard = ({ transactions }) => {
  // Group transactions by category and calculate totals
  const categoryData = useMemo(() => {
    const expensesByCategory = {};
    const incomeByCategory = {};

    transactions.forEach((transaction) => {
      const { category, amount, is_income } = transaction;

      if (is_income) {
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
      } else {
        expensesByCategory[category] =
          (expensesByCategory[category] || 0) + amount;
      }
    });

    return { expensesByCategory, incomeByCategory };
  }, [transactions]);

  // Group transactions by month for the bar chart
  const monthlyData = useMemo(() => {
    const months = {};
    const currentYear = new Date().getFullYear();

    // Initialize all 12 months with 0 values
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(currentYear, i, 1).toLocaleString('default', {
        month: 'short',
      });
      months[monthName] = { income: 0, expense: 0 };
    }

    // Fill in actual data
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const month = date.toLocaleString('default', { month: 'short' });

      // Only include current year transactions
      if (date.getFullYear() === currentYear) {
        if (transaction.is_income) {
          months[month].income += transaction.amount;
        } else {
          months[month].expense += transaction.amount;
        }
      }
    });

    return months;
  }, [transactions]);

  // Prepare data for pie charts
  const expensePieData = {
    labels: Object.keys(categoryData.expensesByCategory),
    datasets: [
      {
        data: Object.values(categoryData.expensesByCategory),
        backgroundColor: [
          '#ff6384',
          '#36a2eb',
          '#ffce56',
          '#4bc0c0',
          '#9966ff',
          '#ff9f40',
          '#8ac926',
          '#1982c4',
          '#6a4c93',
          '#f94144',
        ],
        borderWidth: 1,
      },
    ],
  };

  const incomePieData = {
    labels: Object.keys(categoryData.incomeByCategory),
    datasets: [
      {
        data: Object.values(categoryData.incomeByCategory),
        backgroundColor: [
          '#4bc0c0',
          '#36a2eb',
          '#8ac926',
          '#9966ff',
          '#1982c4',
          '#ff9f40',
          '#6a4c93',
          '#f94144',
          '#ffce56',
          '#ff6384',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for bar chart
  const monthlyBarData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Income',
        data: Object.values(monthlyData).map((m) => m.income),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: Object.values(monthlyData).map((m) => m.expense),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.formattedValue;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const hasExpenses = Object.keys(categoryData.expensesByCategory).length > 0;
  const hasIncome = Object.keys(categoryData.incomeByCategory).length > 0;

  return (
    <div className='dashboard'>
      {/* Budget Alerts */}
      <BudgetAlerts transactions={transactions} />

      <div className='row mb-4'>
        <div className='col-lg-6 mb-4'>
          <div className='card h-100'>
            <div className='card-header bg-danger text-white'>
              <h5 className='mb-0'>Expenses by Category</h5>
            </div>
            <div
              className='card-body d-flex align-items-center justify-content-center'
              style={{ minHeight: '300px' }}
            >
              {hasExpenses ? (
                <Pie data={expensePieData} options={pieOptions} />
              ) : (
                <p className='text-muted text-center'>
                  No expense data available
                </p>
              )}
            </div>
          </div>
        </div>
        <div className='col-lg-6 mb-4'>
          <div className='card h-100'>
            <div className='card-header bg-success text-white'>
              <h5 className='mb-0'>Income by Category</h5>
            </div>
            <div
              className='card-body d-flex align-items-center justify-content-center'
              style={{ minHeight: '300px' }}
            >
              {hasIncome ? (
                <Pie data={incomePieData} options={pieOptions} />
              ) : (
                <p className='text-muted text-center'>
                  No income data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='row'>
        <div className='col-12'>
          <div className='card'>
            <div className='card-header bg-primary text-white'>
              <h5 className='mb-0'>Monthly Overview</h5>
            </div>
            <div className='card-body'>
              <Bar data={monthlyBarData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
