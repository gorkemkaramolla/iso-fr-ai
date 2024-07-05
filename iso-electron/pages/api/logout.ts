import { NextApiRequest, NextApiResponse } from 'next';

// Function to delete cookies
export function deleteCookies(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    'access_token_cookie=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
    'refresh_token_cookie=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
  ]);
}
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    deleteCookies(req, res);
    res.redirect('/login');
  } else {
    res.status(405).end('Method Not Allowed');
  }
}
