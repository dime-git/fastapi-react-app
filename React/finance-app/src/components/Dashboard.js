import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
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
import { FaChartPie, FaChartBar, FaCalendarDay } from 'react-icons/fa';

// Register Chart.js components
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
  const [categoryData, setCategoryData] = useState({
    labels: [],
    datasets: [],
  });

  const [monthlyData, setMonthlyData] = useState({
    labels: [],
    datasets: [],
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const isDarkMode = document.body.classList.contains('dark-mode');

  useEffect(() => {
    // Process category data
    const expensesByCategory = {};
    transactions
      .filter((t) => !t.is_income)
      .forEach((t) => {
        if (!expensesByCategory[t.category]) {
          expensesByCategory[t.category] = 0;
        }
        expensesByCategory[t.category] += t.amount;
      });

    const sortedCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setCategoryData({
      labels: sortedCategories.map((c) => c[0]),
      datasets: [
        {
          data: sortedCategories.map((c) => c[1]),
          backgroundColor: isDarkMode
            ? [
                'rgba(142, 68, 173, 0.7)', // Purple (primary)
                'rgba(239, 65, 70, 0.7)', // Red (danger)
                'rgba(16, 163, 127, 0.7)', // Green (success)
                'rgba(52, 152, 219, 0.7)', // Blue (info)
                'rgba(240, 173, 78, 0.7)', // Orange (warning)
              ]
            : [
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
              ],
          borderColor: isDarkMode
            ? [
                'rgba(142, 68, 173, 1)', // Purple (primary)
                'rgba(239, 65, 70, 1)', // Red (danger)
                'rgba(16, 163, 127, 1)', // Green (success)
                'rgba(52, 152, 219, 1)', // Blue (info)
                'rgba(240, 173, 78, 1)', // Orange (warning)
              ]
            : [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
              ],
          borderWidth: 1,
        },
      ],
    });

    // Process monthly data
    const monthlyExpenses = {};
    const monthlyIncome = {};
    const currentYear = new Date().getFullYear();

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (date.getFullYear() === currentYear) {
        if (t.is_income) {
          if (!monthlyIncome[monthYear]) {
            monthlyIncome[monthYear] = 0;
          }
          monthlyIncome[monthYear] += t.amount;
        } else {
          if (!monthlyExpenses[monthYear]) {
            monthlyExpenses[monthYear] = 0;
          }
          monthlyExpenses[monthYear] += t.amount;
        }
      }
    });

    // Get all months from the current year
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(`${i + 1}/${currentYear}`);
    }

    setMonthlyData({
      labels: months.map((m) => {
        const [month] = m.split('/');
        return [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ][parseInt(month) - 1];
      }),
      datasets: [
        {
          label: 'Income',
          data: months.map((m) => monthlyIncome[m] || 0),
          backgroundColor: isDarkMode
            ? 'rgba(16, 163, 127, 0.6)' // Green (success)
            : 'rgba(75, 192, 192, 0.6)',
          borderColor: isDarkMode
            ? 'rgba(16, 163, 127, 1)' // Green (success)
            : 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Expenses',
          data: months.map((m) => monthlyExpenses[m] || 0),
          backgroundColor: isDarkMode
            ? 'rgba(239, 65, 70, 0.6)' // Red (danger)
            : 'rgba(255, 99, 132, 0.6)',
          borderColor: isDarkMode
            ? 'rgba(239, 65, 70, 1)' // Red (danger)
            : 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    });

    // Get recent transactions
    const recent = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    setRecentTransactions(recent);
  }, [transactions, isDarkMode]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Customize chart options for dark mode
  const getPieOptions = () => {
    return {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            color: isDarkMode ? '#ececf1' : undefined,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#343442' : undefined,
          titleColor: isDarkMode ? '#ececf1' : undefined,
          bodyColor: isDarkMode ? '#ececf1' : undefined,
          borderColor: isDarkMode ? '#444453' : undefined,
          borderWidth: 1,
        },
      },
      maintainAspectRatio: true,
    };
  };

  const getBarOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: isDarkMode ? '#ececf1' : undefined,
          },
          grid: {
            color: isDarkMode ? 'rgba(68, 68, 83, 0.3)' : undefined,
          },
        },
        x: {
          ticks: {
            color: isDarkMode ? '#ececf1' : undefined,
          },
          grid: {
            color: isDarkMode ? 'rgba(68, 68, 83, 0.3)' : undefined,
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDarkMode ? '#ececf1' : undefined,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#343442' : undefined,
          titleColor: isDarkMode ? '#ececf1' : undefined,
          bodyColor: isDarkMode ? '#ececf1' : undefined,
          borderColor: isDarkMode ? '#444453' : undefined,
          borderWidth: 1,
        },
      },
    };
  };

  return (
    <div className='dashboard-container'>
      <h2 className='dashboard-title'>Financial Overview</h2>

      <div className='dashboard-grid'>
        <div className='dashboard-card'>
          <div className='dashboard-card-title'>
            <FaChartPie /> Expense Categories
          </div>
          {categoryData.labels.length > 0 ? (
            <Pie data={categoryData} options={getPieOptions()} />
          ) : (
            <div className='text-center text-muted my-5'>
              <p>No expense data to display</p>
            </div>
          )}
        </div>

        <div className='dashboard-card'>
          <div className='dashboard-card-title'>
            <FaCalendarDay /> Recent Transactions
          </div>
          {recentTransactions.length > 0 ? (
            <div className='recent-transactions'>
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`recent-transaction ${
                    transaction.is_income ? 'is-income' : 'is-expense'
                  }`}
                >
                  <div className='transaction-info'>
                    <div className='transaction-description'>
                      {transaction.description}
                    </div>
                    <div className='transaction-meta'>
                      <span className='transaction-category'>
                        {transaction.category}
                      </span>
                      <span className='transaction-date'>
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`transaction-amount ${
                      transaction.is_income ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {transaction.is_income ? '+' : '-'}$
                    {transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center text-muted my-5'>
              <p>No recent transactions</p>
            </div>
          )}
        </div>
      </div>

      <div className='dashboard-card mb-4'>
        <div className='dashboard-card-title'>
          <FaChartBar /> Monthly Income vs Expenses
        </div>
        {monthlyData.labels.length > 0 ? (
          <Bar data={monthlyData} options={getBarOptions()} />
        ) : (
          <div className='text-center text-muted my-5'>
            <p>No monthly data to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
