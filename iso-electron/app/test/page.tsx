'use client';
import React, { useState, useEffect } from 'react';

export default function TestComponent() {
  const [data, setData] = useState<{ error: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const formData = new FormData(); // Assuming formData is defined or passed to this function
        const req = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/testix`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
        const responseData = await req.json();
        setData(responseData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData({ error: 'Error fetching data' });
      }
    }

    fetchData();
  }, []); // Empty dependency array means this effect runs once on mount

  return <div>{JSON.stringify(data)}</div>;
}
