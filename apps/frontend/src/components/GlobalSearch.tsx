import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface SearchResult {
  id: string;
  type: 'customer' | 'invoice' | 'ticket';
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.global(query),
    enabled: query.length >= 2,
    staleTime: 1000,
  });

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
  };

  return (
    <div className="flex flex-1 justify-center lg:justify-end">
      <div className="w-full max-w-lg lg:max-w-xs">
        <Combobox value={null} onChange={handleSelect}>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <Combobox.Input
              className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Search customers, invoices..."
              onChange={(event) => setQuery(event.target.value)}
              value={query}
            />
          </div>

          {results.length > 0 && (
            <Combobox.Options className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {results.map((result) => (
                <Combobox.Option
                  key={result.id}
                  value={result}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-100'
                    )
                  }
                >
                  {({ active }) => (
                    <div>
                      <div className={clsx('font-medium', active ? 'text-white' : 'text-gray-900 dark:text-white')}>
                        {result.title}
                      </div>
                      <div className={clsx('text-sm', active ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400')}>
                        {result.subtitle}
                      </div>
                    </div>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </Combobox>
      </div>
    </div>
  );
}