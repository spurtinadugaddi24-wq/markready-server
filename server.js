const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({limit:'10kb'}));

app.get('/', (req, res) => res.json({status:'MarkReady API running'}));

app.post('/api/chat', async (req, res) => {
  const {prompt} = req.body;
  if(!prompt) return res.status(400).json({error:'No prompt provided'});

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY;

    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{parts: [{text: prompt}]}],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if(!response.ok) {
      const err = await response.json().catch(()=>({}));
      return res.status(response.status).json({error: err.error?.message || 'API error'});
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({text});

  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MarkReady server running on port ' + PORT));
