const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  // 🛑 Missing Query
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: "Missing or invalid ?q= query parameter" });
  }

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        addressdetails: 1,
        limit: 10,
      },
      timeout: 5000, // ⏱ Timeout after 5s
      headers: {
        'User-Agent': 'free-location-app'
      }
    });

    const data = response.data;

    // 🛑 Unexpected response
    if (!Array.isArray(data)) {
      return res.status(502).json({ error: "Invalid response format from Nominatim API" });
    }

    const places = data.map(place => {
      if (!place.display_name || !place.lat || !place.lon) return null;

      return {
        name: place.display_name,
        lat: place.lat,
        lon: place.lon
      };
    }).filter(Boolean); // remove nulls

    res.json(places);

  } catch (err) {
    // 🌐 Axios-specific error handling
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: "Request to Nominatim API timed out" });
    }

    if (err.response) {
      return res.status(err.response.status).json({
        error: "Nominatim API responded with error",
        status: err.response.status,
        details: err.response.data
      });
    }

    console.error("🔥 Unexpected Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
