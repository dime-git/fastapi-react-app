import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';
import api from './api';
import TransactionItem from './components/TransactionItem';
import Dashboard from './components/Dashboard';
import BudgetManager from './components/BudgetManager';
import RecurringTransactions from './components/RecurringTransactions';
import CurrencyConverter from './components/CurrencyConverter';
import GoalsTracker from './components/GoalsTracker';
import './App.css';
import {
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Tabs,
  Tab,
  Badge,
} from 'react-bootstrap';
import {
  FaChartLine,
  FaWallet,
  FaCalendarAlt,
  FaExchangeAlt,
  FaFlagCheckered,
  FaPlus,
  FaFilter,
  FaDollarSign,
  FaRegStar,
  FaSpinner,
  FaChartPie,
} from 'react-icons/fa';

const Layout = ({
  children,
  transactions,
  displayCurrency,
  currencySymbol,
  formData,
  handleInputChange,
  handleSubmit,
  isLoading,
  categories,
  handleDisplayCurrencyChange,
}) => {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const location = useLocation();

  const totalIncome = transactions
    .filter((t) => t.is_income)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => !t.is_income)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Get currency options
  const currencyOptions = ['USD', 'EUR', 'MKD'].map((currency) => (
    <option key={currency} value={currency}>
      {currency}
    </option>
  ));

  return (
    <div className='finance-app'>
      <Navbar expand='lg' bg='dark' variant='dark' className='mb-4'>
        <Container>
          <Navbar.Brand as={Link} to='/'>
            <FaDollarSign className='me-2' />
            Finance Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto'>
              <Nav.Link
                as={Link}
                to='/'
                className={`px-3 ${location.pathname === '/' ? 'active' : ''}`}
              >
                <FaChartLine className='me-1' /> Dashboard
              </Nav.Link>
              <Nav.Link
                as={Link}
                to='/budgets'
                className={`px-3 ${
                  location.pathname === '/budgets' ? 'active' : ''
                }`}
              >
                <FaWallet className='me-1' /> Budgets
              </Nav.Link>
              <Nav.Link
                as={Link}
                to='/transactions'
                className={`px-3 ${
                  location.pathname === '/transactions' ? 'active' : ''
                }`}
              >
                <FaRegStar className='me-1' /> Transactions
              </Nav.Link>
              <Nav.Link
                as={Link}
                to='/recurring'
                className={`px-3 ${
                  location.pathname === '/recurring' ? 'active' : ''
                }`}
              >
                <FaCalendarAlt className='me-1' /> Recurring
              </Nav.Link>
              <Nav.Link
                as={Link}
                to='/currency'
                className={`px-3 ${
                  location.pathname === '/currency' ? 'active' : ''
                }`}
              >
                <FaExchangeAlt className='me-1' /> Currency
              </Nav.Link>
              <Nav.Link
                as={Link}
                to='/goals'
                className={`px-3 ${
                  location.pathname === '/goals' ? 'active' : ''
                }`}
              >
                <FaFlagCheckered className='me-1' /> Goals
              </Nav.Link>
            </Nav>
            <Button
              variant='success'
              className='ms-3'
              onClick={() => setShowAddTransaction(!showAddTransaction)}
            >
              <FaPlus className='me-1' /> Add Transaction
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        <Row className='mb-4'>
          <Col>
            <div className='finance-summary d-flex justify-content-around p-4 bg-white rounded shadow'>
              <div className='text-center'>
                <h6 className='text-muted mb-2'>Income</h6>
                <h3 className='text-success fw-bold'>
                  {currencySymbol}
                  {totalIncome.toFixed(2)}
                </h3>
                <small className='text-muted'>{displayCurrency}</small>
              </div>
              <div className='text-center'>
                <h6 className='text-muted mb-2'>Expenses</h6>
                <h3 className='text-danger fw-bold'>
                  {currencySymbol}
                  {totalExpenses.toFixed(2)}
                </h3>
                <small className='text-muted'>{displayCurrency}</small>
              </div>
              <div className='text-center'>
                <h6 className='text-muted mb-2'>Balance</h6>
                <h3
                  className={
                    balance >= 0
                      ? 'text-primary fw-bold'
                      : 'text-danger fw-bold'
                  }
                >
                  {currencySymbol}
                  {balance.toFixed(2)}
                </h3>
                <small className='text-muted'>{displayCurrency}</small>
              </div>
              <div className='text-center'>
                <h6 className='text-muted mb-2'>Currency</h6>
                <Form.Select
                  className='form-select-sm'
                  value={displayCurrency}
                  onChange={(e) => handleDisplayCurrencyChange(e.target.value)}
                >
                  {currencyOptions}
                </Form.Select>
                <small className='text-muted'>Display Currency</small>
              </div>
            </div>
          </Col>
        </Row>

        {showAddTransaction && (
          <Row className='mb-4'>
            <Col>
              <Card className='border-0 shadow'>
                <Card.Header className='bg-success text-white'>
                  <h5 className='mb-0'>
                    <FaPlus className='me-2' /> Add New Transaction
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Amount</Form.Label>
                          <Form.Control
                            type='number'
                            name='amount'
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder='Enter amount'
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Category</Form.Label>
                          <Form.Control
                            type='text'
                            name='category'
                            value={formData.category}
                            onChange={handleInputChange}
                            placeholder='Category'
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Date</Form.Label>
                          <Form.Control
                            type='date'
                            name='date'
                            value={formData.date}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={8}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            type='text'
                            name='description'
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder='Description'
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Currency</Form.Label>
                          <Form.Select
                            name='currency'
                            value={formData.currency}
                            onChange={handleInputChange}
                          >
                            {currencyOptions}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group className='mb-3 pt-1'>
                          <Form.Label>&nbsp;</Form.Label>
                          <Form.Check
                            type='checkbox'
                            id='is-income'
                            label='This is income'
                            name='is_income'
                            checked={formData.is_income}
                            onChange={handleInputChange}
                            className='mt-2'
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className='text-end'>
                      <Button
                        variant='outline-secondary'
                        className='me-2'
                        onClick={() => setShowAddTransaction(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant='success'
                        type='submit'
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className='fa-spin me-1' /> Processing...
                          </>
                        ) : (
                          'Add Transaction'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <div className='main-content'>{children}</div>
      </Container>

      <footer className='bg-dark text-white text-center py-4 mt-5'>
        <Container>
          <p className='mb-0'>
            Finance Dashboard &copy; {new Date().getFullYear()}
          </p>
        </Container>
      </footer>
    </div>
  );
};

// Dashboard Page Component
const DashboardPage = ({ transactions }) => {
  return (
    <section className='mb-5'>
      <Row className='mb-4'>
        <Col>
          <h2 className='section-title'>
            <FaChartLine className='me-2' />
            Dashboard
          </h2>
          <p className='text-muted'>
            Overview of your financial status and activity
          </p>
        </Col>
      </Row>
      <Dashboard transactions={transactions} />
    </section>
  );
};

// Budgets Page Component
const BudgetsPage = ({ transactions, categories }) => {
  return (
    <section className='mb-5'>
      <Row className='mb-4'>
        <Col>
          <h2 className='section-title'>
            <FaWallet className='me-2' />
            Budget Management
          </h2>
          <p className='text-muted'>
            Track and manage your spending limits by category
          </p>
        </Col>
      </Row>
      <BudgetManager transactions={transactions} categories={categories} />
    </section>
  );
};

// Transactions Page Component
const TransactionsPage = ({ transactions, fetchTransactions }) => {
  return (
    <section className='mb-5'>
      <Row className='mb-4'>
        <Col>
          <h2 className='section-title'>
            <FaRegStar className='me-2' />
            Transactions
          </h2>
          <p className='text-muted'>View and manage your income and expenses</p>
        </Col>
      </Row>
      <div className='transactions-list mt-4'>
        <Row>
          <Col>
            <Card className='border-0 shadow'>
              <Card.Header className='bg-primary text-white d-flex justify-content-between align-items-center'>
                <h5 className='mb-0'>
                  <FaRegStar className='me-2' /> Transactions History
                </h5>
                <div>
                  <Badge bg='light' text='dark' className='p-2'>
                    <FaFilter className='me-1' /> {transactions.length}{' '}
                    Transactions
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className='p-0'>
                {transactions.length === 0 ? (
                  <div className='text-center py-5'>
                    <FaChartPie
                      className='text-muted mb-3'
                      style={{ fontSize: '3rem', opacity: '0.2' }}
                    />
                    <p className='text-muted'>
                      No transactions found. Add your first transaction to get
                      started.
                    </p>
                  </div>
                ) : (
                  <div className='transaction-items p-3'>
                    {transactions
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((transaction) => (
                        <TransactionItem
                          key={transaction.id}
                          transaction={transaction}
                          onTransactionUpdated={fetchTransactions}
                        />
                      ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </section>
  );
};

// Recurring Transactions Page Component
const RecurringPage = ({ categories, fetchTransactions }) => {
  return (
    <section className='mb-5'>
      <Row className='mb-4'>
        <Col>
          <h2 className='section-title'>
            <FaCalendarAlt className='me-2' />
            Recurring Transactions
          </h2>
          <p className='text-muted'>
            Set up automated regular payments and income
          </p>
        </Col>
      </Row>
      <RecurringTransactions
        categories={categories}
        onGenerateTransactions={fetchTransactions}
      />
    </section>
  );
};

// Currency Converter Page Component
const CurrencyPage = ({ defaultCurrency, handleCurrencyChange }) => {
  return (
    <section className='mb-5'>
      <Row className='mb-4'>
        <Col>
          <h2 className='section-title'>
            <FaExchangeAlt className='me-2' />
            Currency Converter
          </h2>
          <p className='text-muted'>Convert between different currencies</p>
        </Col>
      </Row>
      <CurrencyConverter
        defaultCurrency={defaultCurrency}
        onCurrencyChange={handleCurrencyChange}
      />
    </section>
  );
};

// Goals Page Component
const GoalsPage = ({ displayCurrency }) => {
  return (
    <section className='mb-5'>
      <Row className='mb-4'>
        <Col>
          <h2 className='section-title'>
            <FaFlagCheckered className='me-2' />
            Financial Goals
          </h2>
          <p className='text-muted'>Set and track your financial targets</p>
        </Col>
      </Row>
      <GoalsTracker displayCurrency={displayCurrency} />
    </section>
  );
};

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    is_income: false,
    date: new Date().toISOString().split('T')[0],
    currency: 'USD', // Default currency
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
        date: new Date().toISOString().split('T')[0],
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

  const layoutProps = {
    transactions,
    displayCurrency,
    currencySymbol,
    formData,
    handleInputChange,
    handleSubmit,
    isLoading,
    categories,
    handleDisplayCurrencyChange,
  };

  return (
    <Router>
      <Layout {...layoutProps}>
    <Routes>
      <Route
        path='/'
            element={<DashboardPage transactions={transactions} />}
          />
      <Route
        path='/budgets'
        element={
              <BudgetsPage
                transactions={transactions}
                categories={categories}
              />
            }
          />
          <Route
            path='/transactions'
            element={
              <TransactionsPage
                transactions={transactions}
                fetchTransactions={fetchTransactions}
              />
            }
          />
      <Route
        path='/recurring'
        element={
              <RecurringPage
                categories={categories}
                fetchTransactions={fetchTransactions}
              />
            }
          />
      <Route
        path='/currency'
        element={
              <CurrencyPage
                defaultCurrency={defaultCurrency}
                handleCurrencyChange={handleCurrencyChange}
              />
            }
          />
      <Route
        path='/goals'
            element={<GoalsPage displayCurrency={displayCurrency} />}
      />
    </Routes>
      </Layout>
    </Router>
  );
};

export default App;
