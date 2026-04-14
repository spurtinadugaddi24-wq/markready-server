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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{role:'user', content: prompt}]
      })
    });

    if(!response.ok) {
      const err = await response.json().catch(()=>({}));
      return res.status(response.status).json({error: err.error?.message || 'API error'});
    }

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    res.json({text});

  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MarkReady server running on port ' + PORT));
