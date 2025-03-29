import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Button,
  Card,
  Row,
  Col,
  Table,
  Badge,
  Dropdown,
} from 'react-bootstrap';
import BudgetAlerts from './BudgetAlerts';
import {
  FaChartPie,
  FaChartBar,
  FaChartLine,
  FaWallet,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
);

const Dashboard = ({ transactions = [] }) => {
  const [timeRange, setTimeRange] = useState('thisMonth'); // 'thisMonth', 'lastMonth', 'lastThreeMonths', 'thisYear'

  // Filter transactions based on selected time range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (timeRange) {
      case 'thisMonth':
        return transactions.filter((t) => {
          const date = new Date(t.date);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        });
      case 'lastMonth':
        return transactions.filter((t) => {
          const date = new Date(t.date);
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const yearOfLastMonth =
            currentMonth === 0 ? currentYear - 1 : currentYear;
          return (
            date.getMonth() === lastMonth &&
            date.getFullYear() === yearOfLastMonth
          );
        });
      case 'lastThreeMonths':
        return transactions.filter((t) => {
          const date = new Date(t.date);
          const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
          return date >= threeMonthsAgo;
        });
      case 'thisYear':
        return transactions.filter((t) => {
          const date = new Date(t.date);
          return date.getFullYear() === currentYear;
        });
      default:
        return transactions;
    }
  }, [transactions, timeRange]);

  // Group transactions by category and calculate totals
  const categoryData = useMemo(() => {
    const expensesByCategory = {};
    const incomeByCategory = {};

    if (filteredTransactions && filteredTransactions.length > 0) {
      filteredTransactions.forEach((transaction) => {
        const { category, amount, is_income } = transaction;

        if (is_income) {
          incomeByCategory[category] =
            (incomeByCategory[category] || 0) + amount;
        } else {
          expensesByCategory[category] =
            (expensesByCategory[category] || 0) + amount;
        }
      });
    }

    return { expensesByCategory, incomeByCategory };
  }, [filteredTransactions]);

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
    if (transactions && transactions.length > 0) {
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
    }

    return months;
  }, [transactions]);

  // Calculate daily spending trend (last 30 days)
  const dailySpendingTrend = useMemo(() => {
    const days = {};
    const now = new Date();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      days[dayStr] = 0;
    }

    // Fill in actual data
    if (transactions && transactions.length > 0) {
      transactions.forEach((transaction) => {
        // Skip income, we only want spending
        if (transaction.is_income) return;

        const date = transaction.date;
        if (days[date] !== undefined) {
          days[date] += transaction.amount;
        }
      });
    }

    return days;
  }, [transactions]);

  // Calculate total income and expenses
  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.is_income)
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => !t.is_income)
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

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

  // Prepare data for spending trend line chart
  const spendingTrendData = {
    labels: Object.keys(dailySpendingTrend),
    datasets: [
      {
        label: 'Daily Expenses',
        data: Object.values(dailySpendingTrend),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
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

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Spending Trend (Last 30 Days)',
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

  // Get top 5 recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className='dashboard'>
      {/* Time Range Selector */}
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h2 className='mb-0'>
          <FaChartBar className='me-2' />
          Financial Dashboard
        </h2>
        <Dropdown>
          <Dropdown.Toggle variant='outline-primary' id='time-range-dropdown'>
            <FaCalendarAlt className='me-2' />
            {timeRange === 'thisMonth' && 'This Month'}
            {timeRange === 'lastMonth' && 'Last Month'}
            {timeRange === 'lastThreeMonths' && 'Last 3 Months'}
            {timeRange === 'thisYear' && 'This Year'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setTimeRange('thisMonth')}>
              This Month
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setTimeRange('lastMonth')}>
              Last Month
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setTimeRange('lastThreeMonths')}>
              Last 3 Months
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setTimeRange('thisYear')}>
              This Year
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Summary Cards */}
      <Row className='mb-4'>
        <Col lg={3} md={6} className='mb-3'>
          <Card className='h-100 border-0 shadow-sm'>
            <Card.Body className='d-flex align-items-center'>
              <div className='rounded-circle p-3 bg-primary bg-opacity-10 me-3'>
                <FaArrowUp className='text-primary fs-4' />
              </div>
              <div>
                <h6 className='text-muted mb-1'>Income</h6>
                <h4 className='mb-0 text-success'>${totalIncome.toFixed(2)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className='mb-3'>
          <Card className='h-100 border-0 shadow-sm'>
            <Card.Body className='d-flex align-items-center'>
              <div className='rounded-circle p-3 bg-danger bg-opacity-10 me-3'>
                <FaArrowDown className='text-danger fs-4' />
              </div>
              <div>
                <h6 className='text-muted mb-1'>Expenses</h6>
                <h4 className='mb-0 text-danger'>
                  ${totalExpenses.toFixed(2)}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className='mb-3'>
          <Card className='h-100 border-0 shadow-sm'>
            <Card.Body className='d-flex align-items-center'>
              <div className='rounded-circle p-3 bg-success bg-opacity-10 me-3'>
                <FaWallet className='text-success fs-4' />
              </div>
              <div>
                <h6 className='text-muted mb-1'>Savings</h6>
                <h4 className='mb-0 text-primary'>${savings.toFixed(2)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className='mb-3'>
          <Card className='h-100 border-0 shadow-sm'>
            <Card.Body className='d-flex align-items-center'>
              <div className='rounded-circle p-3 bg-info bg-opacity-10 me-3'>
                <FaChartPie className='text-info fs-4' />
              </div>
              <div>
                <h6 className='text-muted mb-1'>Savings Rate</h6>
                <h4 className='mb-0 text-info'>{savingsRate.toFixed(1)}%</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Budget Alerts */}
      <BudgetAlerts transactions={filteredTransactions} />

      {/* Charts Row */}
      <Row className='mb-4'>
        <Col lg={6} className='mb-4'>
          <Card className='h-100 border-0 shadow-sm'>
            <Card.Header className='bg-danger text-white d-flex align-items-center'>
              <FaChartPie className='me-2' />
              <h5 className='mb-0'>Expenses by Category</h5>
            </Card.Header>
            <Card.Body
              className='d-flex align-items-center justify-content-center'
              style={{ minHeight: '300px' }}
            >
              {hasExpenses ? (
                <Pie data={expensePieData} options={pieOptions} />
              ) : (
                <div className='text-center text-muted py-5'>
                  <FaChartPie className='display-1 mb-3 opacity-25' />
                  <p>No expense data available for the selected period</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className='mb-4'>
          <Card className='h-100 border-0 shadow-sm'>
            <Card.Header className='bg-success text-white d-flex align-items-center'>
              <FaChartPie className='me-2' />
              <h5 className='mb-0'>Income by Category</h5>
            </Card.Header>
            <Card.Body
              className='d-flex align-items-center justify-content-center'
              style={{ minHeight: '300px' }}
            >
              {hasIncome ? (
                <Pie data={incomePieData} options={pieOptions} />
              ) : (
                <div className='text-center text-muted py-5'>
                  <FaChartPie className='display-1 mb-3 opacity-25' />
                  <p>No income data available for the selected period</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className='mb-4'>
        <Col lg={7} className='mb-4'>
          <Card className='border-0 shadow-sm'>
            <Card.Header className='bg-primary text-white d-flex align-items-center'>
              <FaChartBar className='me-2' />
              <h5 className='mb-0'>Monthly Overview</h5>
            </Card.Header>
            <Card.Body>
              <Bar data={monthlyBarData} options={barOptions} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5} className='mb-4'>
          <Card className='h-100 border-0 shadow-sm'>
            <Card.Header className='bg-info text-white d-flex align-items-center'>
              <FaChartLine className='me-2' />
              <h5 className='mb-0'>Recent Transactions</h5>
            </Card.Header>
            <Card.Body className='p-0'>
              {recentTransactions.length > 0 ? (
                <Table hover className='mb-0'>
                  <thead className='bg-light'>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction, index) => (
                      <tr key={index}>
                        <td>
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td>
                          {transaction.category}{' '}
                          {transaction.is_income ? (
                            <Badge bg='success' pill>
                              Income
                            </Badge>
                          ) : (
                            <Badge bg='danger' pill>
                              Expense
                            </Badge>
                          )}
                        </td>
                        <td
                          className={
                            transaction.is_income
                              ? 'text-success'
                              : 'text-danger'
                          }
                        >
                          {transaction.is_income ? '+' : '-'}$
                          {transaction.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className='text-center text-muted py-5'>
                  <p>No transactions available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className='border-0 shadow-sm'>
            <Card.Header className='bg-secondary text-white d-flex align-items-center'>
              <FaChartLine className='me-2' />
              <h5 className='mb-0'>Daily Spending Trend</h5>
            </Card.Header>
            <Card.Body>
              <Line data={spendingTrendData} options={lineOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
