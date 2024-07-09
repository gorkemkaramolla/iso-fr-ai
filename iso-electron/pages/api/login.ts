import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/login`,
        {
          username,
          password,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const cookies = response.headers['set-cookie'];

      if (cookies) {
        res.setHeader('Set-Cookie', cookies);
      }
      res.status(200).json({ status: 200, message: 'Login successful' });
    } catch (error) {
      console.error(
        'Login error:',
        (error as any).response?.data || (error as any).message
        
      );
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
