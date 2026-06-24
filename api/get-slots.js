const { Client, Environment } = require('square');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { startRange, endRange, serviceVariationId, locationId } = req.body || {};

  if (!startRange || !endRange || !serviceVariationId || !locationId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return res.status(500).json({ success: false, error: 'Server not configured' });
  }

  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production,
    });

    const response = await client.bookingsApi.searchAvailability({
      query: {
        filter: {
          startAtRange: {
            startAt: startRange,
            endAt: endRange,
          },
          locationId,
          segmentFilters: [{ serviceVariationId }],
        },
      },
    });

    const availabilities = response.result.availabilities || [];
    const slots = availabilities.map((a) => ({ startAt: a.startAt }));

    return res.status(200).json({ success: true, slots });
  } catch (err) {
    console.error('Square API error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch availability' });
  }
};
