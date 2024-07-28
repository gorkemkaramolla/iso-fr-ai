'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  KeyboardEvent,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  User,
  Briefcase,
  Clock2,
  UserCog,
  Speech,
  MapPin,
  Phone,
  X,
  Mail,
  Settings,
  Tv,
  Home,
  Edit,
  Cpu,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

const getLatestSearches = (): string[] => {
  return JSON.parse(localStorage.getItem('latestSearches') || '[]');
};

const addSearchTerm = (query: string) => {
  let latestSearches = getLatestSearches();
  if (!latestSearches.includes(query)) {
    latestSearches.push(query);
  }
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

const SearchComponent: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Personel[]>([]);
  const [query, setQuery] = useState<string>('');
  const [showLatestSearches, setShowLatestSearches] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const pathname = usePathname();
  const latestSearches = getLatestSearches();
  const searchRef = useRef<HTMLInputElement>(null);

  const currentRoute =
    Object.entries(ROUTES).find(([_, value]) => value.path === pathname)?.[0] ||
    '';

  const allRouteLinks = useMemo(() => {
    return Object.values(ROUTES).flatMap((route) =>
      Object.entries(route.links).map(([name, path]) => ({ name, path }))
    );
  }, []);

  const filteredSearches = useMemo(() => {
    if (!query)
      return [...latestSearches, ...allRouteLinks.map((link) => link.name)];

    const routeSpecificLinks = currentRoute
      ? Object.keys(ROUTES[currentRoute as keyof typeof ROUTES].links)
      : [];

    if (Object.keys(ROUTES).includes(query.toLowerCase())) {
      return [
        query,
        ...Object.keys(
          ROUTES[query.toLowerCase() as keyof typeof ROUTES].links
        ),
      ];
    }

    return [
      ...allRouteLinks
        .filter((link) => link.name.toLowerCase().includes(query.toLowerCase()))
        .map((link) => link.name),
      ...latestSearches.filter((search) =>
        search.toLowerCase().includes(query.toLowerCase())
      ),
    ];
  }, [query, latestSearches, currentRoute, allRouteLinks]);

  useEffect(() => {
    const fetchSearchData = async () => {
      if (query && !allRouteLinks.some((link) => link.name === query)) {
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
  }, [query, allRouteLinks]);

  useEffect(() => {
    setSelectedIndex(-1);
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

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'ana sayfa':
        return <Home className='w-4 h-4 text-gray-400' />;
      case 'ayarlar':
        return <Settings className='w-4 h-4 text-gray-400' />;
      case 'kişi ayarları':
        return <UserCog className='w-4 h-4 text-gray-400' />;
      case 'konuşmalar':
        return <Speech className='w-4 h-4 text-gray-400' />;
      case 'yayın':
        return <Tv className='w-4 h-4 text-gray-400' />;
      case 'izlence':
        return <Cpu className='w-4 h-4 text-gray-400' />;
      case 'profile':
      case 'edit profile':
        return <Edit className='w-4 h-4 text-gray-400' />;
      default:
        return <Clock2 className='w-4 h-4 text-gray-400' />;
    }
  };

  const getLinkPath = (linkName: string) => {
    const link = allRouteLinks.find((link) => link.name === linkName);
    return link ? link.path : '#';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prevIndex) =>
        prevIndex < filteredSearches.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredSearches.length) {
        const selectedItem = filteredSearches[selectedIndex];
        const linkPath = getLinkPath(selectedItem);
        if (linkPath !== '#') {
          router.push(linkPath);
        } else {
          setQuery(selectedItem);
          // Trigger search with the selected latest search term
          fetchSearchResults(selectedItem).then(setSearchResults);
        }
      } else if (query) {
        // If no item is selected but there's a query, perform the search
        fetchSearchResults(query).then(setSearchResults);
      }
    }
  };

  return (
    <div className='relative'>
      <div className='relative'>
        <input
          type='text'
          value={query}
          onChange={handleSearchChange}
          onFocus={() => setShowLatestSearches(true)}
          onBlur={() => setTimeout(() => setShowLatestSearches(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder='Search'
          className='w-full px-4 py-3 pl-10 pr-10 text-gray-700 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
          ref={searchRef}
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
      {showLatestSearches && filteredSearches.length > 0 && (
        <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg'>
          {filteredSearches.map((search: string, index: number) => {
            const isRouteLink = allRouteLinks.some(
              (link) => link.name === search
            );
            return (
              <div
                key={index}
                className={`flex px-4 py-2 hover:bg-gray-100 justify-between items-center ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  const linkPath = getLinkPath(search);
                  if (linkPath !== '#') {
                    router.push(linkPath);
                  } else {
                    setQuery(search);
                    fetchSearchResults(search).then(setSearchResults);
                  }
                }}
              >
                <div className='flex cursor-pointer gap-2 items-center'>
                  {getIcon(search)}
                  <span className='text-gray-700'>{search}</span>
                </div>
                {!isRouteLink && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSearchTerm(search);
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <X className='w-4 h-4' />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
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
                      <p className='text-sm text-gray-600'>{result.address}</p>
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

      {query &&
        searchResults.length === 0 &&
        !allRouteLinks.some((link) => link.name === query) && (
          <div className='mt-8 text-center text-gray-600'>
            {query} ile ilgili sonuç bulunamadı.
          </div>
        )}
    </div>
  );
};

export default SearchComponent;
