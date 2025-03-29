import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
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
    // Try to load saved state from localStorage
    const savedDefaultCurrency = localStorage.getItem(LS_DEFAULT_CURRENCY);
    const savedUsingFallback =
      localStorage.getItem(LS_FALLBACK_MODE) === 'true';
    const savedCurrencies = localStorage.getItem(LS_CURRENCIES);
    const savedRates = localStorage.getItem(LS_RATES);

    if (savedUsingFallback) {
      setUsingFallback(true);
    }

    if (savedDefaultCurrency) {
      setDefaultCurrency(savedDefaultCurrency);
      setFromCurrency(savedDefaultCurrency);

      // Notify parent if we have a saved currency
      if (onCurrencyChange) {
        onCurrencyChange(savedDefaultCurrency);
      }
    }

    if (savedCurrencies) {
      try {
        setCurrencies(JSON.parse(savedCurrencies));
      } catch (e) {
        console.warn('Could not parse saved currencies:', e);
      }
    }

    if (savedRates) {
      try {
        setRates(JSON.parse(savedRates));
      } catch (e) {
        console.warn('Could not parse saved rates:', e);
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

    if (currencies.length > 0) {
      localStorage.setItem(LS_CURRENCIES, JSON.stringify(currencies));
    }

    if (Object.keys(rates).length > 0) {
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
        const healthResponse = await axios.get('/health', { timeout: 2000 });
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
    <div className='currency-converter'>
      <Card className='mb-4'>
        <Card.Header className='d-flex justify-content-between align-items-center'>
          <h4 className='mb-0'>
            <FaExchangeAlt className='me-2' /> Currency Converter
            {usingFallback && (
              <span
                className='badge bg-warning text-dark ms-2'
                style={{ fontSize: '0.6rem' }}
              >
                Offline Mode
              </span>
            )}
          </h4>
          <div className='d-flex'>
            <Button
              variant={usingFallback ? 'outline-warning' : 'outline-secondary'}
              size='sm'
              className='me-2'
              onClick={toggleOfflineMode}
              title={
                usingFallback
                  ? 'Try to connect to server'
                  : 'Work in offline mode'
              }
            >
              {localStorage.getItem('finance_app_force_offline') === 'true'
                ? 'Exit Offline Mode'
                : usingFallback
                ? 'Try Online Mode'
                : 'Use Offline Mode'}
            </Button>

            {usingFallback &&
              localStorage.getItem('finance_app_force_offline') !== 'true' && (
                <Button
                  variant='outline-primary'
                  size='sm'
                  className='me-2'
                  onClick={fetchCurrencyData}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation='border' size='sm' className='me-1' />
                  ) : (
                    'Retry Connection'
                  )}
                </Button>
              )}

            {currencies.length === 0 && (
              <Button
                variant='primary'
                size='sm'
                onClick={handleInitializeCurrencies}
                disabled={initializing}
              >
                {initializing ? (
                  <>
                    <Spinner animation='border' size='sm' className='me-1' />
                    Initializing...
                  </>
                ) : (
                  'Initialize Currencies'
                )}
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert
              variant={usingFallback ? 'warning' : 'danger'}
              className='d-flex justify-content-between align-items-center'
            >
              <div>{error}</div>
              <div>
                {error.includes('Initialize') && (
                  <Button
                    variant={
                      usingFallback ? 'outline-warning' : 'outline-danger'
                    }
                    size='sm'
                    onClick={handleInitializeCurrencies}
                    disabled={initializing}
                    className='me-2'
                  >
                    {initializing ? (
                      <>
                        <Spinner
                          animation='border'
                          size='sm'
                          className='me-1'
                        />{' '}
                        Initializing...
                      </>
                    ) : (
                      'Initialize'
                    )}
                  </Button>
                )}
                {usingFallback && (
                  <Button
                    variant='outline-warning'
                    size='sm'
                    onClick={fetchCurrencyData}
                    disabled={loading}
                  >
                    Retry
                  </Button>
                )}
              </div>
            </Alert>
          )}

          {usingFallback && !error && (
            <Alert variant='warning' className='mb-3'>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <strong>Offline Mode:</strong> Using local currency data. Some
                  features may be limited.
                </div>
                <Button
                  variant='outline-warning'
                  size='sm'
                  onClick={fetchCurrencyData}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation='border' size='sm' className='me-1' />
                  ) : (
                    'Retry Connection'
                  )}
                </Button>
              </div>
            </Alert>
          )}

          <Form onSubmit={handleConvert}>
            <div className='row'>
              <div className='col-md-4 mb-3'>
                <Form.Group>
                  <Form.Label>Amount</Form.Label>
                  <div className='input-group'>
                    <span className='input-group-text'>
                      {fromCurrency === 'USD' ? (
                        <FaDollarSign />
                      ) : fromCurrency === 'EUR' ? (
                        <FaEuroSign />
                      ) : (
                        '#'
                      )}
                    </span>
                    <Form.Control
                      type='number'
                      step='0.01'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </Form.Group>
              </div>

              <div className='col-md-4 mb-3'>
                <Form.Group>
                  <Form.Label>From</Form.Label>
                  <Form.Select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className='col-md-4 mb-3'>
                <Form.Group>
                  <Form.Label>To</Form.Label>
                  <Form.Select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <Button
              variant='primary'
              type='submit'
              disabled={converting || currencies.length === 0}
              className='mb-3'
            >
              {converting ? (
                <>
                  <Spinner animation='border' size='sm' className='me-2' />
                  Converting...
                </>
              ) : (
                <>
                  <FaExchangeAlt className='me-2' /> Convert
                </>
              )}
            </Button>
          </Form>

          {result && (
            <div className='result-box p-4 bg-light rounded mt-3 border'>
              <h5 className='d-flex align-items-center mb-3'>
                <FaExchangeAlt className='me-2 text-primary' />
                Conversion Result
              </h5>
              <div className='d-flex justify-content-center align-items-center my-3'>
                <div className='text-center px-3'>
                  <div className='text-muted'>From</div>
                  <h4 className='mb-0'>{result.original_amount.toFixed(2)}</h4>
                  <div className='badge bg-secondary'>
                    {result.original_currency}
                  </div>
                </div>

                <div className='px-3 text-primary'>
                  <FaExchangeAlt size={24} />
                </div>

                <div className='text-center px-3'>
                  <div className='text-muted'>To</div>
                  <h4 className='mb-0 text-primary'>
                    {result.converted_amount.toFixed(2)}
                  </h4>
                  <div className='badge bg-primary'>
                    {result.converted_currency}
                  </div>
                </div>
              </div>
              <div className='text-center text-muted small'>
                Exchange rate: 1 {result.original_currency} ={' '}
                {result.exchange_rate} {result.converted_currency}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className='d-flex justify-content-between align-items-center'>
          <h4 className='mb-0'>
            <FaDollarSign className='me-2' /> Default Currency
            {usingFallback && (
              <span
                className='badge bg-warning text-dark ms-2'
                style={{ fontSize: '0.6rem' }}
              >
                Offline Mode
              </span>
            )}
          </h4>
          {defaultCurrency && (
            <span className='badge bg-primary'>{defaultCurrency}</span>
          )}
        </Card.Header>
        <Card.Body>
          {usingFallback && (
            <Alert variant='warning' className='mb-3'>
              <small>
                In offline mode, currency changes will only apply locally and
                won't be saved to the server.
              </small>
            </Alert>
          )}

          <p className='mb-3'>
            Set the default currency for all transactions across the
            application.
            {defaultCurrency && (
              <span className='ms-2'>
                Current default: <strong>{defaultCurrency}</strong>
              </span>
            )}
          </p>

          <div className='row'>
            {currencies.map((currency) => (
              <div key={currency.code} className='col-md-4 mb-2'>
                <Button
                  variant={
                    currency.code === defaultCurrency
                      ? 'primary'
                      : 'outline-primary'
                  }
                  className='w-100 position-relative'
                  onClick={() => handleSetDefault(currency.code)}
                  disabled={currency.code === defaultCurrency || loading}
                >
                  {currency.name} ({currency.symbol})
                  {currency.code === defaultCurrency && (
                    <span className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success'>
                      <FaCheck size={10} />
                    </span>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {currencies.length === 0 && !loading && (
            <div className='text-center mt-3'>
              <p className='text-muted'>No currencies available</p>
              <Button
                variant='primary'
                size='sm'
                onClick={handleInitializeCurrencies}
                disabled={initializing}
              >
                {initializing ? (
                  <>
                    <Spinner animation='border' size='sm' className='me-1' />{' '}
                    Initializing...
                  </>
                ) : (
                  'Initialize Currencies'
                )}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CurrencyConverter;
