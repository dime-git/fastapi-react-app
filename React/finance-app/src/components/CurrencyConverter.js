import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import {
  FaCheck,
  FaExchangeAlt,
  FaDollarSign,
  FaEuroSign,
} from 'react-icons/fa';

// Using proxy configuration to avoid CORS issues
const API_URL = '/api';

// LocalStorage keys
const LS_DEFAULT_CURRENCY = 'finance_app_default_currency';
const LS_FALLBACK_MODE = 'finance_app_using_fallback';
const LS_CURRENCIES = 'finance_app_currencies';
const LS_RATES = 'finance_app_rates';

// Fallback currencies and rates to use when API fails
const FALLBACK_CURRENCIES = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    is_default: false,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    is_default: false,
  },
  {
    code: 'MKD',
    name: 'Macedonian Denar',
    symbol: 'ден',
    is_default: false,
  },
];

const FALLBACK_RATES = {
  USD: {
    EUR: 0.92,
    MKD: 56.8,
  },
  EUR: {
    USD: 1.09,
    MKD: 61.5,
  },
  MKD: {
    USD: 0.0176,
    EUR: 0.0163,
  },
};

const CurrencyConverter = ({ onCurrencyChange }) => {
  const [currencies, setCurrencies] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [rates, setRates] = useState({});

  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Load state from localStorage on initial mount
  useEffect(() => {
    // Load currencies and rates from localStorage for offline mode
    const savedCurrencies = localStorage.getItem(LS_CURRENCIES);
    const savedRates = localStorage.getItem(LS_RATES);
    const savedDefaultCurrency = localStorage.getItem(LS_DEFAULT_CURRENCY);
    const savedFallbackMode = localStorage.getItem(LS_FALLBACK_MODE);

    if (savedFallbackMode) {
      setUsingFallback(savedFallbackMode === 'true');
    }

    if (savedDefaultCurrency) {
      setDefaultCurrency(savedDefaultCurrency);
      setFromCurrency(savedDefaultCurrency);
    }

    if (savedCurrencies) {
      try {
        const parsedCurrencies = JSON.parse(savedCurrencies);
        // Make sure it's an array before setting
        if (Array.isArray(parsedCurrencies)) {
          setCurrencies(parsedCurrencies);
        } else {
          setCurrencies(FALLBACK_CURRENCIES);
          console.warn('Saved currencies is not an array, using fallback');
        }
      } catch (e) {
        console.warn('Could not parse saved currencies:', e);
        setCurrencies(FALLBACK_CURRENCIES);
      }
    }

    if (savedRates) {
      try {
        setRates(JSON.parse(savedRates));
      } catch (e) {
        console.warn('Could not parse saved rates:', e);
        setRates(FALLBACK_RATES);
      }
    }

    // Still fetch from API to get the latest data
    fetchCurrencyData();
  }, []);

  // Save to localStorage whenever these values change
  useEffect(() => {
    if (defaultCurrency) {
      localStorage.setItem(LS_DEFAULT_CURRENCY, defaultCurrency);
    }

    localStorage.setItem(LS_FALLBACK_MODE, usingFallback.toString());

    if (currencies && currencies.length > 0) {
      localStorage.setItem(LS_CURRENCIES, JSON.stringify(currencies));
    }

    if (rates && Object.keys(rates).length > 0) {
      localStorage.setItem(LS_RATES, JSON.stringify(rates));
    }
  }, [defaultCurrency, usingFallback, currencies, rates]);

  const useFallbackData = () => {
    // Load currencies from localStorage or use fallback
    const savedCurrencies = localStorage.getItem(LS_CURRENCIES);
    let currenciesToUse = FALLBACK_CURRENCIES;

    if (savedCurrencies) {
      try {
        currenciesToUse = JSON.parse(savedCurrencies);
      } catch (e) {
        console.warn('Could not parse saved currencies, using defaults:', e);
      }
    }

    // Ensure one currency is marked as default
    const savedDefaultCurrency =
      localStorage.getItem(LS_DEFAULT_CURRENCY) || 'USD';
    currenciesToUse = currenciesToUse.map((currency) => ({
      ...currency,
      is_default: currency.code === savedDefaultCurrency,
    }));

    setCurrencies(currenciesToUse);
    setDefaultCurrency(savedDefaultCurrency);
    setFromCurrency(savedDefaultCurrency);

    // Load rates from localStorage or use fallback
    const savedRates = localStorage.getItem(LS_RATES);
    let ratesToUse = FALLBACK_RATES;

    if (savedRates) {
      try {
        ratesToUse = JSON.parse(savedRates);
      } catch (e) {
        console.warn('Could not parse saved rates, using defaults:', e);
      }
    }

    setRates(ratesToUse);
    setUsingFallback(true);
    setLoading(false);
  };

  const fetchCurrencyData = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if user has explicitly chosen offline mode
      const forcedOfflineMode =
        localStorage.getItem('finance_app_force_offline') === 'true';
      if (forcedOfflineMode) {
        console.log('User has selected forced offline mode');
        useFallbackData();
        setError('Using offline mode by user preference.');
        setLoading(false);
        return;
      }

      // First do a simple health check
      try {
        const healthResponse = await axios.get(`${API_URL}/health`, {
          timeout: 2000,
        });
        if (healthResponse.status !== 200) {
          throw new Error('API health check failed');
        }
      } catch (healthErr) {
        console.warn(
          'API health check failed, using fallback mode:',
          healthErr
        );
        useFallbackData();
        setError(
          'Server unavailable. Using offline mode with saved preferences.'
        );
        setLoading(false);
        return;
      }

      try {
        // Fetch available currencies
        const currenciesResponse = await axios.get(`${API_URL}/currencies`);

        if (currenciesResponse.data && currenciesResponse.data.length > 0) {
          setCurrencies(currenciesResponse.data);

          // Fetch default currency
          try {
            const defaultResponse = await axios.get(
              `${API_URL}/currencies/default`
            );
            setDefaultCurrency(defaultResponse.data.code);
            setFromCurrency(defaultResponse.data.code);
          } catch (defaultErr) {
            // If server error, use fallback mode
            if (defaultErr.response && defaultErr.response.status >= 500) {
              useFallbackData();
              setError(
                'Server error retrieving default currency. Using offline mode.'
              );
              setLoading(false);
              return;
            }

            // Otherwise just use first currency
            console.warn('Could not fetch default currency:', defaultErr);
            setDefaultCurrency(currenciesResponse.data[0].code);
            setFromCurrency(currenciesResponse.data[0].code);
          }
        } else {
          try {
            await handleInitializeCurrencies(false);
          } catch (initErr) {
            console.warn(
              'Initialization failed, using fallback data:',
              initErr
            );
            useFallbackData();
            setError('Could not initialize currencies. Using offline mode.');
            setLoading(false);
            return;
          }
        }

        // Fetch exchange rates
        try {
          const ratesResponse = await axios.get(`${API_URL}/currencies/rates`);
          if (ratesResponse.data && ratesResponse.data.rates) {
            setRates(ratesResponse.data.rates);
          } else {
            setRates(FALLBACK_RATES);
          }
        } catch (ratesErr) {
          console.warn('Could not fetch exchange rates:', ratesErr);
          setRates(FALLBACK_RATES);
        }

        // If we got here, we're using the API successfully
        setUsingFallback(false);
      } catch (err) {
        console.error('Failed to fetch currencies, using fallbacks:', err);
        useFallbackData();

        if (err.response && err.response.status >= 500) {
          setError('Server error. Using offline mode with default currencies.');
        } else {
          setError(
            'API unavailable. Using offline mode with default currencies.'
          );
        }

        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in currency data fetching process:', err);
      useFallbackData();
      setError(
        'API may not be available. Using offline mode with saved preferences.'
      );
      setLoading(false);
    }
  };

  const handleInitializeCurrencies = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setInitializing(true);
        setError('');
      }

      // Call the initialize endpoint
      await axios.post(`${API_URL}/currencies/initialize`);

      // Refresh currency data
      const currenciesResponse = await axios.get(`${API_URL}/currencies`);
      setCurrencies(currenciesResponse.data || FALLBACK_CURRENCIES);

      // Get default after initialization
      try {
        const defaultResponse = await axios.get(
          `${API_URL}/currencies/default`
        );
        setDefaultCurrency(defaultResponse.data.code);
        setFromCurrency(defaultResponse.data.code);
      } catch (defaultErr) {
        // Use USD as fallback
        setDefaultCurrency('USD');
        setFromCurrency('USD');
      }

      // Get rates after initialization
      try {
        const ratesResponse = await axios.get(`${API_URL}/currencies/rates`);
        setRates(ratesResponse.data.rates || FALLBACK_RATES);
      } catch (ratesErr) {
        setRates(FALLBACK_RATES);
      }

      setUsingFallback(false);
      setInitializing(false);
    } catch (err) {
      console.error('Error initializing currencies:', err);
      useFallbackData();
      setError('Failed to initialize currencies. Using offline mode.');
      setInitializing(false);
      throw err; // Rethrow for error handling in caller
    }
  };

  const handleConvert = async (e) => {
    if (e) e.preventDefault();

    if (!amount || !fromCurrency || !toCurrency) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setConverting(true);
      setError('');

      if (usingFallback) {
        // Use fallback calculation in offline mode
        calculateFallbackConversion();
      } else {
        try {
          const response = await axios.post(`${API_URL}/currencies/convert`, {
            amount: parseFloat(amount),
            from_currency: fromCurrency,
            to_currency: toCurrency,
          });

          setResult(response.data);
        } catch (conversionErr) {
          console.warn(
            'API conversion failed, using fallback calculation',
            conversionErr
          );
          calculateFallbackConversion();
        }
      }

      setConverting(false);
    } catch (err) {
      console.error('Error during conversion:', err);
      calculateFallbackConversion();
      setConverting(false);
    }
  };

  const calculateFallbackConversion = () => {
    if (fromCurrency === toCurrency) {
      setResult({
        original_amount: parseFloat(amount),
        original_currency: fromCurrency,
        converted_amount: parseFloat(amount),
        converted_currency: toCurrency,
        exchange_rate: 1.0,
      });
      return;
    }

    // Direct conversion if available
    if (
      FALLBACK_RATES[fromCurrency] &&
      FALLBACK_RATES[fromCurrency][toCurrency]
    ) {
      const rate = FALLBACK_RATES[fromCurrency][toCurrency];
      setResult({
        original_amount: parseFloat(amount),
        original_currency: fromCurrency,
        converted_amount: parseFloat(amount) * rate,
        converted_currency: toCurrency,
        exchange_rate: rate,
      });
      return;
    }

    // Try via USD if direct conversion not available
    let convertedAmount = parseFloat(amount);
    let effectiveRate = 1.0;

    if (fromCurrency !== 'USD' && FALLBACK_RATES[fromCurrency]?.USD) {
      // Convert to USD first
      convertedAmount = convertedAmount * FALLBACK_RATES[fromCurrency].USD;
      effectiveRate = FALLBACK_RATES[fromCurrency].USD;

      if (toCurrency !== 'USD' && FALLBACK_RATES.USD?.[toCurrency]) {
        // Convert from USD to target
        convertedAmount = convertedAmount * FALLBACK_RATES.USD[toCurrency];
        effectiveRate = effectiveRate * FALLBACK_RATES.USD[toCurrency];
      }
    }

    setResult({
      original_amount: parseFloat(amount),
      original_currency: fromCurrency,
      converted_amount: convertedAmount,
      converted_currency: toCurrency,
      exchange_rate: effectiveRate,
    });
  };

  const handleSetDefault = async (currencyCode) => {
    try {
      setLoading(true);
      setError('');

      // Always set the local state first for immediate feedback
      setDefaultCurrency(currencyCode);
      if (onCurrencyChange) {
        onCurrencyChange(currencyCode);
      }

      // If already in fallback mode, don't try to contact the server
      if (usingFallback) {
        setLoading(false);
        return;
      }

      // Try to update the server in the background
      try {
        await axios.post(`${API_URL}/currencies/default/${currencyCode}`);
        // Server update succeeded, clear any error
        setError('');
      } catch (err) {
        console.warn('Error setting default currency on server:', err);

        // If we get a server error, switch to fallback mode
        if (err.response && err.response.status >= 500) {
          setUsingFallback(true);
          setError('Server error. Using local currency settings only.');

          // Update local currencies to match current state
          const updatedCurrencies = currencies.map((currency) => ({
            ...currency,
            is_default: currency.code === currencyCode,
          }));
          setCurrencies(updatedCurrencies);
        } else {
          setError(
            'Currency changed locally but may not persist after refresh.'
          );
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Unexpected error in handleSetDefault:', err);
      setLoading(false);
      setError('Error occurred. Currency changed locally only.');
    }
  };

  const toggleOfflineMode = () => {
    const currentMode =
      localStorage.getItem('finance_app_force_offline') === 'true';
    const newMode = !currentMode;

    localStorage.setItem('finance_app_force_offline', newMode.toString());

    if (newMode) {
      useFallbackData();
      setError(
        'Switched to offline mode. All changes will be saved locally only.'
      );
    } else {
      setError('Switched to online mode. Attempting to reconnect to server...');
      fetchCurrencyData();
    }
  };

  // Currency selection dropdown in the table
  const renderCurrencyOptions = () => {
    // Add defensive check
    if (!Array.isArray(currencies)) {
      return <option value='USD'>USD</option>;
    }
    return currencies.map((currency) => (
      <option key={currency.code} value={currency.code}>
        {currency.code} - {currency.name} ({currency.symbol})
      </option>
    ));
  };

  // Default currency selection for the Change Default button
  const renderDefaultCurrencyOptions = () => {
    // Add defensive check
    if (!Array.isArray(currencies)) {
      return <option value='USD'>USD</option>;
    }
    return currencies.map((currency) => (
      <option
        key={currency.code}
        value={currency.code}
        disabled={currency.code === defaultCurrency}
      >
        {currency.code} - {currency.name} ({currency.symbol})
      </option>
    ));
  };

  if (loading && !error) {
    return (
      <div className='text-center my-4'>
        <Spinner animation='border' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className='currency-container'>
      {/* Loading and Error Messages */}
      {loading && !error && (
        <div className='text-center py-4'>
          <div className='spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
          <p className='mt-2'>Loading currency data...</p>
        </div>
      )}

      {error && (
        <Alert variant='warning' className='my-3'>
          <Alert.Heading>
            <i className='fas fa-exclamation-triangle me-2'></i>
            {usingFallback ? 'Offline Mode' : 'Warning'}
          </Alert.Heading>
          <p>{error}</p>
          {usingFallback && (
            <div className='mt-3'>
              <p className='mb-1'>
                <strong>Using saved or default exchange rates:</strong>
              </p>
              <ul className='mb-0'>
                {Object.keys(rates || {}).length > 0 ? (
                  // Only show first 5 rates to avoid clutter
                  Object.entries(rates || {})
                    .slice(0, 5)
                    .map(([code, rate]) => (
                      <li key={code}>
                        1 {defaultCurrency} = {rate.toFixed(4)} {code}
                      </li>
                    ))
                ) : (
                  <li>No saved rates available</li>
                )}
                {Object.keys(rates || {}).length > 5 && (
                  <li>...and {Object.keys(rates || {}).length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </Alert>
      )}

      {/* Currency Converter Card */}
      {!loading && (
        <div className='row'>
          {/* Currency Converter */}
          <div className='col-md-6 mb-4'>
            <Card className='h-100'>
              <Card.Header>
                <h5 className='mb-0'>
                  <i className='fas fa-exchange-alt me-2'></i>
                  Currency Converter
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className='mb-3'>
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type='number'
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder='Enter amount'
                    />
                  </Form.Group>

                  <div className='row'>
                    <div className='col-md-5'>
                      <Form.Group className='mb-3'>
                        <Form.Label>From</Form.Label>
                        <Form.Select
                          value={fromCurrency}
                          onChange={(e) => setFromCurrency(e.target.value)}
                        >
                          {renderCurrencyOptions()}
                        </Form.Select>
                      </Form.Group>
                    </div>

                    <div className='col-md-2 d-flex align-items-center justify-content-center mb-3'>
                      <Button
                        variant='outline-secondary'
                        onClick={handleSwapCurrencies}
                        className='swap-btn'
                      >
                        <i className='fas fa-exchange-alt'></i>
                      </Button>
                    </div>

                    <div className='col-md-5'>
                      <Form.Group className='mb-3'>
                        <Form.Label>To</Form.Label>
                        <Form.Select
                          value={toCurrency}
                          onChange={(e) => setToCurrency(e.target.value)}
                        >
                          {renderCurrencyOptions()}
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <div className='result-box p-3 my-3 text-center'>
                    <h3>
                      {convertedAmount !== null ? (
                        <>
                          {amount} {fromCurrency} = {convertedAmount.toFixed(2)}{' '}
                          {toCurrency}
                        </>
                      ) : (
                        'Enter an amount to convert'
                      )}
                    </h3>
                    {rate !== null && (
                      <p className='mb-0 text-muted'>
                        1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                      </p>
                    )}
                  </div>

                  <div className='d-grid'>
                    <Button
                      variant='primary'
                      onClick={handleCalculate}
                      disabled={
                        !amount || !fromCurrency || !toCurrency || amount <= 0
                      }
                    >
                      Convert
                    </Button>
                  </div>
                </Form>
              </Card.Body>
              <Card.Footer className='text-muted'>
                {usingFallback ? (
                  <div className='offline-notice'>
                    <i className='fas fa-wifi-slash me-1'></i> Using offline
                    rates
                  </div>
                ) : (
                  <div className='online-notice'>
                    <i className='fas fa-wifi me-1'></i> Using online rates
                  </div>
                )}
              </Card.Footer>
            </Card>
          </div>

          {/* Currency Management */}
          <div className='col-md-6 mb-4'>
            <Card className='h-100'>
              <Card.Header>
                <h5 className='mb-0'>
                  <i className='fas fa-money-bill-wave me-2'></i>
                  Currency Management
                </h5>
              </Card.Header>
              <Card.Body>
                <div className='mb-4'>
                  <h6>Default Currency</h6>
                  <div className='d-flex align-items-center'>
                    <div className='current-default me-3'>
                      {currencies && currencies.length > 0
                        ? currencies.find((c) => c.code === defaultCurrency)
                            ?.symbol || '$'
                        : '$'}{' '}
                      {defaultCurrency}
                    </div>
                    <div className='flex-grow-1'>
                      <Form className='d-flex'>
                        <Form.Select
                          size='sm'
                          value={newDefaultCurrency}
                          onChange={(e) =>
                            setNewDefaultCurrency(e.target.value)
                          }
                          className='me-2'
                        >
                          {renderDefaultCurrencyOptions()}
                        </Form.Select>
                        <Button
                          size='sm'
                          onClick={handleSetDefaultCurrency}
                          disabled={newDefaultCurrency === defaultCurrency}
                        >
                          Set as Default
                        </Button>
                      </Form>
                    </div>
                  </div>
                </div>

                <h6>Exchange Rates</h6>
                <div className='table-responsive rates-table'>
                  <Table size='sm' hover>
                    <thead>
                      <tr>
                        <th>Currency</th>
                        <th className='text-end'>Rate (1 {defaultCurrency})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates && Object.keys(rates).length > 0 ? (
                        Object.entries(rates)
                          .filter(([code]) => code !== defaultCurrency)
                          .map(([code, rate]) => (
                            <tr key={code}>
                              <td>
                                {code} -{' '}
                                {Array.isArray(currencies) &&
                                currencies.find((c) => c.code === code)
                                  ? currencies.find((c) => c.code === code).name
                                  : code}
                              </td>
                              <td className='text-end'>
                                {currencies &&
                                currencies.find((c) => c.code === code)
                                  ? currencies.find((c) => c.code === code)
                                      .symbol
                                  : ''}{' '}
                                {rate.toFixed(4)}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={2} className='text-center'>
                            No exchange rates available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <div className='d-grid gap-2 mt-3'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={fetchCurrencyData}
                    disabled={loading}
                  >
                    <i className='fas fa-sync-alt me-2'></i>
                    Refresh Rates
                  </Button>
                  <Button
                    variant='outline-primary'
                    size='sm'
                    onClick={handleInitializeCurrencies}
                    disabled={loading}
                  >
                    <i className='fas fa-database me-2'></i>
                    Initialize Default Currencies
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverter;
