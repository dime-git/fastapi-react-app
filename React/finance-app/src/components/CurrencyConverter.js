import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const CurrencyConverter = ({ onCurrencyChange }) => {
  const [currencies, setCurrencies] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState('');
  const [rates, setRates] = useState({});

  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);

  // Fetch available currencies and default currency
  useEffect(() => {
    const fetchCurrencyData = async () => {
      try {
        setLoading(true);

        // Fetch available currencies
        const currenciesResponse = await axios.get(`${API_URL}/currencies`);
        setCurrencies(currenciesResponse.data);

        // Fetch default currency
        const defaultResponse = await axios.get(
          `${API_URL}/currencies/default`
        );
        setDefaultCurrency(defaultResponse.data.code);
        setFromCurrency(defaultResponse.data.code);

        // Fetch exchange rates
        const ratesResponse = await axios.get(`${API_URL}/currencies/rates`);
        setRates(ratesResponse.data.rates || {});

        setLoading(false);
      } catch (err) {
        console.error('Error fetching currency data:', err);
        setError('Failed to load currency data');
        setLoading(false);
      }
    };

    fetchCurrencyData();
  }, []);

  const handleConvert = async (e) => {
    if (e) e.preventDefault();

    if (!amount || !fromCurrency || !toCurrency) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setConverting(true);
      setError('');

      const response = await axios.post(`${API_URL}/currencies/convert`, {
        amount: parseFloat(amount),
        from_currency: fromCurrency,
        to_currency: toCurrency,
      });

      setResult(response.data);
      setConverting(false);
    } catch (err) {
      console.error('Error converting currency:', err);
      setError(
        'Failed to convert currency. The required Firestore index may need to be created. Please check server logs.'
      );

      // Manual calculation fallback
      if (fromCurrency === toCurrency) {
        setResult({
          original_amount: parseFloat(amount),
          original_currency: fromCurrency,
          converted_amount: parseFloat(amount),
          converted_currency: toCurrency,
          exchange_rate: 1.0,
        });
      } else {
        // Use hardcoded rates as fallback
        const fallbackRates = {
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

        if (
          fallbackRates[fromCurrency] &&
          fallbackRates[fromCurrency][toCurrency]
        ) {
          const rate = fallbackRates[fromCurrency][toCurrency];
          setResult({
            original_amount: parseFloat(amount),
            original_currency: fromCurrency,
            converted_amount: parseFloat(amount) * rate,
            converted_currency: toCurrency,
            exchange_rate: rate,
          });
        }
      }
      setConverting(false);
    }
  };

  const handleSetDefault = async (currencyCode) => {
    try {
      setLoading(true);

      await axios.post(`${API_URL}/currencies/default/${currencyCode}`);

      setDefaultCurrency(currencyCode);

      // Notify parent component about currency change
      if (onCurrencyChange) {
        onCurrencyChange(currencyCode);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error setting default currency:', err);
      setError('Failed to set default currency');
      setLoading(false);
    }
  };

  if (loading) {
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
        <Card.Header>
          <h4>Currency Converter</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant='danger'>{error}</Alert>}

          <Form onSubmit={handleConvert}>
            <div className='row'>
              <div className='col-md-4 mb-3'>
                <Form.Group>
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type='number'
                    step='0.01'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
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
              disabled={converting}
              className='mb-3'
            >
              {converting ? 'Converting...' : 'Convert'}
            </Button>
          </Form>

          {result && (
            <div className='result-box p-3 bg-light rounded mt-3'>
              <h5>Conversion Result</h5>
              <p className='mb-0'>
                {result.original_amount.toFixed(2)} {result.original_currency} ={' '}
                <strong>
                  {result.converted_amount.toFixed(2)}{' '}
                  {result.converted_currency}
                </strong>
              </p>
              <p className='text-muted small mb-0'>
                Exchange rate: 1 {result.original_currency} ={' '}
                {result.exchange_rate} {result.converted_currency}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h4>Default Currency</h4>
        </Card.Header>
        <Card.Body>
          <p>
            Set the default currency for your transactions. Current default:{' '}
            <strong>{defaultCurrency}</strong>
          </p>

          <div className='row'>
            {currencies.map((currency) => (
              <div key={currency.code} className='col-md-4 mb-2'>
                <Button
                  variant={
                    currency.code === defaultCurrency
                      ? 'primary'
                      : 'outline-secondary'
                  }
                  onClick={() => handleSetDefault(currency.code)}
                  className='w-100'
                >
                  {currency.name} ({currency.symbol})
                </Button>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CurrencyConverter;
