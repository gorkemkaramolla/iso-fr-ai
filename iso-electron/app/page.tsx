'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  User,
  Briefcase,
  Clock2,
  MapPin,
  Phone,
  X,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

const getLatestSearches = (): string[] => {
  return JSON.parse(localStorage.getItem('latestSearches') || '[]');
};

const addSearchTerm = (query: string) => {
  let latestSearches = getLatestSearches();
  if (!latestSearches.includes(query)) {
    latestSearches.push(query);
  }
  const MAX_SEARCHES = 10;
  latestSearches = latestSearches.slice(-MAX_SEARCHES);
  localStorage.setItem('latestSearches', JSON.stringify(latestSearches));
};

const removeSearchTerm = (query: string) => {
  let latestSearches = getLatestSearches();
  latestSearches = latestSearches.filter((search) => search !== query);
  localStorage.setItem('latestSearches', JSON.stringify(latestSearches));
};

const fetchSearchResults = async (query: string): Promise<Personel[]> => {
  try {
    const url = `http://localhost:5004/search?query=${encodeURIComponent(
      query
    )}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    addSearchTerm(query);
    return await response.json();
  } catch (error) {
    console.error('Error fetching search results:', error);
    return [];
  }
};

const Page: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Personel[]>([]);
  const [query, setQuery] = useState<string>('');
  const [showLatestSearches, setShowLatestSearches] = useState(false);
  const router = useRouter();
  const latestSearches = getLatestSearches();

  const filteredLatestSearches = useMemo(() => {
    if (!query) return latestSearches;
    return latestSearches.filter((search) =>
      search.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, latestSearches]);

  useEffect(() => {
    const fetchSearchData = async () => {
      if (query) {
        try {
          const res = await fetchSearchResults(query);
          setSearchResults(res);
        } catch (error) {
          console.error('Failed to fetch search results:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(() => {
      fetchSearchData();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowLatestSearches(true);
  };

  const handleRemoveSearchTerm = (term: string) => {
    removeSearchTerm(term);
    router.refresh();
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchResults([]);
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        <div className='relative'>
          <div className='relative'>
            <input
              type='text'
              value={query}
              onChange={handleSearchChange}
              onFocus={() => setShowLatestSearches(true)}
              onBlur={() => setTimeout(() => setShowLatestSearches(false), 200)}
              placeholder='Search'
              className='w-full px-4 py-3 pl-10 pr-10 text-gray-700 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <Search className='absolute left-3 top-3.5 text-gray-400 w-5 h-5' />
            {query && (
              <button
                onClick={handleClearSearch}
                className='absolute right-3 top-3.5 text-gray-400 hover:text-gray-600'
              >
                <X className='w-5 h-5' />
              </button>
            )}
          </div>
          {showLatestSearches && filteredLatestSearches.length > 0 && (
            <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg'>
              {filteredLatestSearches.map((search: string, index: number) => (
                <div
                  key={index}
                  className='flex px-4 py-2 hover:bg-gray-100 justify-between items-center'
                >
                  <div
                    onClick={() => setQuery(search)}
                    className='flex cursor-pointer gap-2 items-center'
                  >
                    <Clock2 className='w-4 h-4 text-gray-400' />
                    <span className='text-gray-700'>{search}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSearchTerm(search)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className='mt-8'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
              Arama Sonuçları
            </h2>
            <div className='bg-white shadow-md rounded-lg overflow-hidden divide-y divide-gray-200'>
              {searchResults.map((result) => (
                <Link key={result._id} href={`/profiles/${result._id}`}>
                  <div className='p-6 hover:bg-gray-50 transition duration-150 ease-in-out'>
                    <div className='flex items-center mb-4'>
                      <User className='text-blue-500 mr-2 w-5 h-5' />
                      <h3 className='text-lg font-medium text-gray-900'>
                        {result.name} {result.lastname}
                      </h3>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='flex items-center'>
                        <Briefcase className='text-gray-400 mr-2 w-4 h-4' />
                        <p className='text-sm text-gray-600'>{result.title}</p>
                      </div>
                      <div className='flex items-center'>
                        <MapPin className='text-gray-400 mr-2 w-4 h-4' />
                        <p className='text-sm text-gray-600'>
                          {result.address}
                        </p>
                      </div>
                      <div className='flex items-center'>
                        <Phone className='text-gray-400 mr-2 w-4 h-4' />
                        <p className='text-sm text-gray-600'>{result.phone}</p>
                      </div>
                      <div className='flex items-center'>
                        <Mail className='text-gray-400 mr-2 w-4 h-4' />
                        <p className='text-sm text-gray-600'>{result.email}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {query && searchResults.length === 0 && (
          <div className='mt-8 text-center text-gray-600'>
            {query} ile ilgili sonuç bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
