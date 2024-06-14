'use client';
import api from '@/utils/axios_instance';
import React, { ChangeEvent, useEffect, useState } from 'react';
import Image from 'next/image';
interface Props {}

const ElasticSearch: React.FC<Props> = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Personel[]>([]);
  useEffect(() => {
    api
      .get('search', { params: { query: searchValue } })
      .then((res) => {
        setSearchResults(res.data);
      })
      .catch((error) => {
        console.log(error);
        setSearchResults([]);
      });
  }, [searchValue]);
  function handleSearch(event: ChangeEvent<HTMLInputElement>): void {
    setSearchValue(event.target.value);
  }

  return (
    <div className='flex relative'>
      <label
        className={`input ${
          isSearching ? 'flex' : 'hidden'
        } input-bordered items-center gap-2`}
      >
        <input
          onBlur={() => setIsSearching(false)}
          type='text'
          className='grow w-full'
          onChange={handleSearch}
          placeholder='Search'
          value={searchValue}
        />
        {searchResults.length !== 0 && (
          <ul className='menu absolute z-50 top-16 bg-base-200 w-full rounded-box'>
            {searchResults.map((personel) => (
              <li key={personel.PERSONEL_ID}>
                <a>
                  <Image
                    width={50}
                    height={50}
                    src={`data:${personel.FOTO_DOSYA_TIPI};base64,${Buffer.from(
                      personel.FOTO_BINARY_DATA,
                      'hex'
                    ).toString('base64')}`}
                    alt='personnel'
                  />
                  {personel.ADI} {personel.SOYADI} - {personel.UNVANI}
                </a>
              </li>
            ))}
          </ul>
        )}
      </label>
      <button
        onClick={() => {
          setIsSearching(!isSearching);
        }}
        className='btn btn-ghost btn-circle'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-5 w-5'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </button>
    </div>
  );
};

export default ElasticSearch;
