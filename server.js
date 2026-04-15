const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({limit:'10kb'}));

app.get('/', (req, res) => res.json({status:'MarkReady API running'}));

app.post('/api/chat', async (req, res) => {
  const {prompt, apiKey} = req.body;
  if(!prompt) return res.status(400).json({error:'No prompt provided'});
  if(!apiKey) return res.status(400).json({error:'No API key provided'});

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 800,
        temperature: 0.7,
        messages: [{role:'user', content: prompt}]
      })
    });

    if(!response.ok) {
      const err = await response.json().catch(()=>({}));
      return res.status(response.status).json({error: err.error?.message || 'API error'});
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({text});

  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MarkReady server running on port ' + PORT));
