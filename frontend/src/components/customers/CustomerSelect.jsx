import React, { useEffect, useRef, useState } from 'react';
import { Select } from 'antd';
import { customerAPI } from '../../utils/api';

const labelOf = (customer) => (customer.email ? `${customer.name} - ${customer.email}` : customer.name);
const listOf = (response) => (Array.isArray(response.data) ? response.data : response.data?.customers || []);

/**
 * Picks a customer by typing part of their name, email or phone. The server is searched, so every
 * customer can be found however many there are; the newest are listed before anything is typed.
 * Nothing is asked for until the list is opened. `initial`: the customer already chosen, if any.
 * Use inside a Form.Item (it passes value and onChange).
 */
const CustomerSelect = ({ value, onChange, initial, placeholder = 'Type a name, email or phone', ...props }) => {
  const [found, setFound] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState(initial || null);
  const latest = useRef(0);
  const timer = useRef(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (initial) setChosen(initial);
  }, [initial]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (text, wait) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const request = latest.current + 1;
      latest.current = request;
      setLoading(true);
      try {
        const response = await customerAPI.getAll({ search: text.trim(), limit: 20 });
        if (request === latest.current) setFound(listOf(response));
      } catch (error) {
        if (request === latest.current) setFound([]);
      } finally {
        if (request === latest.current) setLoading(false);
      }
    }, wait);
  };

  // A key press waits a moment before searching, so typing a name is one request, not one per letter
  const onSearch = (text) => search(text, 300);
  // The newest customers are listed the first time the list opens
  const onOpenChange = (open) => {
    if (open && !loadedOnce.current) {
      loadedOnce.current = true;
      search('', 0);
    }
  };

  // The chosen customer stays in the list (with its name) even when a search does not find it
  const customers = chosen && !found.some((customer) => customer.id === chosen.id) ? [chosen, ...found] : found;

  return (
    <Select
      showSearch
      allowClear
      value={value}
      placeholder={placeholder}
      filterOption={false}
      loading={loading}
      notFoundContent={loading ? 'Searching…' : 'No customer found. Check the spelling, or add them as a new customer.'}
      options={customers.map((customer) => ({ value: customer.id, label: labelOf(customer) }))}
      onOpenChange={onOpenChange}
      onSearch={onSearch}
      onChange={(id) => {
        setChosen(customers.find((customer) => customer.id === id) || null);
        onChange?.(id);
      }}
      {...props}
    />
  );
};

export default CustomerSelect;
