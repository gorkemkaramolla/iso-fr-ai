'use client';

import FileUploader from '@/components/FileUploader';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const fetchPersonel = async () => {
  try {
    const response = await fetch('http://localhost:5004/personel');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching personel:', error);
    return [];
  }
};

const fetchSearchResults = async (query: string) => {
  try {
    const url = `http://localhost:5004/search?query=${query}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching search results:', error);
    return [];
  }
};

const Page = () => {
  const [personels, setPersonels] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchPersonel();
        setPersonels(res);
      } catch (error) {
        console.error('Failed to fetch personels:', error);
      }
    };

    router.refresh();
    fetchData();
  }, [router]);

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

    fetchSearchData();
  }, [query]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <div className='py-4 flex flex-col w-screen overflow-y-scroll'>
      <input
        type='text'
        value={query}
        onChange={handleSearchChange}
        placeholder='Search...'
        className='mb-4 p-2 border border-gray-300 rounded'
      />
      {searchResults.length > 0 && (
        <div>
          <h2>Search Results:</h2>
          {searchResults.map((result) => (
            <div key={result._id} className='p-4 border-b border-gray-200'>
              <p>
                <strong>Name:</strong> {result.name}
              </p>
              <p>
                <strong>Lastname:</strong> {result.lastname}
              </p>
              <p>
                <strong>Title:</strong> {result.title}
              </p>
              <p>
                <strong>Address:</strong> {result.address}
              </p>
              <p>
                <strong>Phone:</strong> {result.phone}
              </p>
              <p>
                <strong>Email:</strong> {result.email}
              </p>
            </div>
          ))}
        </div>
      )}
      {/* <div>
        <h2>All Personnel:</h2>
        {personels.length === 0 ? (
          <p>No data available</p>
        ) : (
          personels.map((personel) => (
            <div key={personel._id} className='p-4 border-b border-gray-200'>
              <p>
                <strong>Name:</strong> {personel.name}
              </p>
              <p>
                <strong>Lastname:</strong> {personel.lastname}
              </p>
              <p>
                <strong>Title:</strong> {personel.title}
              </p>
              <p>
                <strong>Address:</strong> {personel.address}
              </p>
              <p>
                <strong>Phone:</strong> {personel.phone}
              </p>
              <p>
                <strong>Email:</strong> {personel.email}
              </p>
            </div>
          ))
        )}
      </div> */}
    </div>
  );
};

export default Page;
