import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle,
} from 'chart.js';
import {
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaChartPie,
  FaCalendarAlt,
  FaChartLine,
} from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle
);

const Dashboard = ({ transactions }) => {
  const [monthlyData, setMonthlyData] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    savingsRate: 0,
  });
  const [categoryData, setCategoryData] = useState({
    income: {},
    expenses: {},
  });
  const [selectedMonth, setSelectedMonth] = useState('This Month');

  // Mock data for daily spending (last 30 days)
  const getDailySpendingData = () => {
    const days = 30;
    const dailyData = [];
    const labels = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      labels.push(date.toLocaleDateString('en-US', { day: 'numeric' }));

      // Only add actual spending for the days with transactions
      if (i === 20) {
        dailyData.push(1000);
      } else if (i === 29) {
        dailyData.push(800);
      } else {
        dailyData.push(0);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Daily Expenses',
          data: dailyData,
          fill: true,
          backgroundColor: 'rgba(247, 37, 133, 0.2)',
          borderColor: 'rgba(247, 37, 133, 1)',
          tension: 0.4,
        },
      ],
    };
  };

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Calculate total income and expenses
      let totalIncome = 0;
      let totalExpenses = 0;
      const incomeByCategory = {};
      const expensesByCategory = {};
      const recent = [];
      const monthlyIncome = {};
      const monthlyExpenses = {};

      // Get current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Process transactions
      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date);
        const month = transactionDate.getMonth();
        const year = transactionDate.getFullYear();
        const monthKey = `${year}-${month}`;

        // Initialize monthly data if not exists
        if (!monthlyIncome[monthKey]) {
          monthlyIncome[monthKey] = 0;
          monthlyExpenses[monthKey] = 0;
        }

        if (transaction.is_income) {
          totalIncome += transaction.amount;
          monthlyIncome[monthKey] += transaction.amount;

          // Update income by category
          if (!incomeByCategory[transaction.category]) {
            incomeByCategory[transaction.category] = 0;
          }
          incomeByCategory[transaction.category] += transaction.amount;
        } else {
          totalExpenses += transaction.amount;
          monthlyExpenses[monthKey] += transaction.amount;

          // Update expenses by category
          if (!expensesByCategory[transaction.category]) {
            expensesByCategory[transaction.category] = 0;
          }
          expensesByCategory[transaction.category] += transaction.amount;
        }

        // Add to recent transactions (only last month)
        if (
          month === currentMonth &&
          year === currentYear &&
          recent.length < 5
        ) {
          recent.push(transaction);
        }
      });

      // Sort recent transactions by date (newest first)
      recent.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate savings and savings rate
      const savings = totalIncome - totalExpenses;
      const savingsRate =
        totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

      // Generate monthly chart data (last 12 months)
      const labels = [];
      const incomeData = [];
      const expensesData = [];

      // Get last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthYear = date.toLocaleString('en-US', {
          month: 'short',
          year: '2-digit',
        });
        labels.unshift(monthYear);

        const key = `${date.getFullYear()}-${date.getMonth()}`;
        incomeData.unshift(monthlyIncome[key] || 0);
        expensesData.unshift(monthlyExpenses[key] || 0);
      }

      // Update state
      setStats({
        income: totalIncome,
        expenses: totalExpenses,
        savings,
        savingsRate,
      });

      setCategoryData({
        income: incomeByCategory,
        expenses: expensesByCategory,
      });

      setRecentTransactions(recent);

      setMonthlyData({
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(74, 222, 128, 0.2)',
            borderColor: 'rgba(74, 222, 128, 1)',
            borderWidth: 2,
          },
          {
            label: 'Expenses',
            data: expensesData,
            backgroundColor: 'rgba(247, 37, 133, 0.2)',
            borderColor: 'rgba(247, 37, 133, 1)',
            borderWidth: 2,
          },
        ],
      });
    }
  }, [transactions]);

  // Prepare category data for charts
  const prepareChartData = (categoryData, type) => {
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const total = data.reduce((sum, value) => sum + value, 0);

    // Calculate percentages for each category
    const percentages = data.map((value) => ((value / total) * 100).toFixed(1));

    // Create labels with percentages
    const labelsWithPercentages = labels.map(
      (label, index) => `${label} (${percentages[index]}%)`
    );

    const colors =
      type === 'income'
        ? [
            'rgba(74, 222, 128, 0.8)',
            'rgba(56, 189, 248, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(2, 132, 199, 0.8)',
          ]
        : [
            'rgba(247, 37, 133, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(168, 162, 158, 0.8)',
            'rgba(220, 38, 38, 0.8)',
            'rgba(217, 119, 6, 0.8)',
          ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map((color) => color.replace('0.8', '1')),
          borderWidth: 1,
          // Add hover effects
          hoverOffset: 15,
          hoverBorderWidth: 2,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: $${context.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
  };

  // Pie chart options (no scales)
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 10,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        display: true,
        color: 'white',
        font: {
          weight: 'bold',
          size: 12,
        },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return percentage + '%';
        },
      },
    },
    // Add animation
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <div className='dashboard-grid'>
      {/* Summary Stats */}
      <div className='dashboard-col-quarter'>
        <div className='summary-stat-card summary-stat-income'>
          <div className='summary-stat-icon'>
            <FaArrowUp />
          </div>
          <div className='summary-stat-content'>
            <h4>Monthly Income</h4>
            <p>${stats.income.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className='dashboard-col-quarter'>
        <div className='summary-stat-card summary-stat-expense'>
          <div className='summary-stat-icon'>
            <FaArrowDown />
          </div>
          <div className='summary-stat-content'>
            <h4>Monthly Expenses</h4>
            <p>${stats.expenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className='dashboard-col-quarter'>
        <div className='summary-stat-card summary-stat-savings'>
          <div className='summary-stat-icon'>
            <FaWallet />
          </div>
          <div className='summary-stat-content'>
            <h4>Monthly Savings</h4>
            <p>${stats.savings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className='dashboard-col-quarter'>
        <div className='summary-stat-card summary-stat-rate'>
          <div className='summary-stat-icon'>
            <FaChartPie />
          </div>
          <div className='summary-stat-content'>
            <h4>Savings Rate</h4>
            <p>{stats.savingsRate}%</p>
          </div>
        </div>
      </div>

      {/* Monthly Overview Chart */}
      <div className='dashboard-col-half'>
        <div className='dashboard-card'>
          <div className='dashboard-card-header'>
            <span>
              <FaChartLine className='me-2' /> Monthly Overview
            </span>
            <Badge bg='light' text='dark'>
              <FaCalendarAlt className='me-1' /> {selectedMonth}
            </Badge>
          </div>
          <div className='dashboard-card-body'>
            <div style={{ height: '300px' }}>
              {Object.keys(monthlyData).length > 0 && (
                <Bar
                  data={monthlyData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Income vs Expenses',
                        font: { size: 14 },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className='dashboard-col-half'>
        <div className='dashboard-card'>
          <div className='dashboard-card-header'>
            <span>Recent Transactions</span>
          </div>
          <div className='dashboard-card-body p-0'>
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{transaction.category}</td>
                      <td>
                        <span
                          className={
                            transaction.is_income ? 'tag-income' : 'tag-expense'
                          }
                        >
                          {transaction.is_income ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td
                        className={
                          transaction.is_income ? 'text-success' : 'text-danger'
                        }
                      >
                        {transaction.is_income ? '+' : '-'}$
                        {transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan='4' className='text-center p-3'>
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      <div className='dashboard-col-half'>
        <div className='dashboard-card'>
          <div className='dashboard-card-header'>
            <span>Expenses by Category</span>
          </div>
          <div className='dashboard-card-body'>
            <div style={{ height: '300px' }}>
              {Object.keys(categoryData.expenses).length > 0 ? (
                <Pie
                  data={prepareChartData(categoryData.expenses, 'expenses')}
                  options={pieOptions}
                />
              ) : (
                <div className='text-center p-5'>
                  <p className='text-muted'>No expense data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Income by Category */}
      <div className='dashboard-col-half'>
        <div className='dashboard-card'>
          <div className='dashboard-card-header'>
            <span>Income by Category</span>
          </div>
          <div className='dashboard-card-body'>
            <div style={{ height: '300px' }}>
              {Object.keys(categoryData.income).length > 0 ? (
                <Pie
                  data={prepareChartData(categoryData.income, 'income')}
                  options={pieOptions}
                />
              ) : (
                <div className='text-center p-5'>
                  <p className='text-muted'>No income data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Spending Trend */}
      <div className='dashboard-col-full'>
        <div className='dashboard-card'>
          <div className='dashboard-card-header'>
            <span>Daily Spending Trend</span>
            <Badge bg='light' text='dark'>
              Last 30 Days
            </Badge>
          </div>
          <div className='dashboard-card-body'>
            <div style={{ height: '250px' }}>
              <Line
                data={getDailySpendingData()}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
