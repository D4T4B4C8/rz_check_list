// Netlify serverless function acting as the shared backend for the
// Daily Ledger app. Uses Netlify Blobs — a key/value store built into every
// Netlify site, no external database or account needed.
//
// GET  /.netlify/functions/data   -> returns { topics: [...], checks: {...} }
// POST /.netlify/functions/data   -> body: { topics, checks } -> saves it

import { getStore } from '@netlify/blobs';

const EMPTY_STATE = { topics: [], checks: {} };

export default async (req, context) => {
  const store = getStore('daily-ledger');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const state = (await store.get('state', { type: 'json' })) || EMPTY_STATE;
    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const state = {
        topics: Array.isArray(body.topics) ? body.topics : [],
        checks: (body.checks && typeof body.checks === 'object') ? body.checks : {},
      };
      await store.setJSON('state', state);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
};

export const config = {
  path: '/.netlify/functions/data',
};
