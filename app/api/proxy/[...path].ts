import type { NextApiRequest, NextApiResponse } from 'next';

// This is a simple proxy API route that forwards requests to the backend server
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Extract the path from the URL
    const { path } = req.query;
    
    // Construct the backend API URL
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/${Array.isArray(path) ? path.join('/') : path}`;
    
    // Forward the request to the backend server
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers if needed
        ...((req.headers.authorization && { 'Authorization': req.headers.authorization }) || {})
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    // Get the response data
    const data = await response.json().catch(() => ({}));
    
    // Forward the status code and response
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}