import { NextResponse } from 'next/server';

const adminTokens = new Set();

export function verifyAdmin(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!adminTokens.has(token)) return false;
  return true;
}

export function addToken(token) { adminTokens.add(token); }
