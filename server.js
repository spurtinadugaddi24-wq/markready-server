const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({limit:'10kb'}));

app.get('/', (req, res) => res.json({status:'MarkReady API running'}));

function cleanJSON(text) {
  let t = text.trim();
  t = t.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if(start !== -1 && end !== -1) t = t.substring(start, end + 1);
  return t;
}

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
        max_tokens: 1200,
        temperature: 0.3,
        messages: [
          {role:'system', content:'You are a JSON-only responder. Always respond with raw valid JSON only. No markdown, no code fences, no explanation. Just the JSON object.'},
          {role:'user', content: prompt}
        ]
      })
    });

    if(!response.ok) {
      const err = await response.json().catch(()=>({}));
      return res.status(response.status).json({error: err.error?.message || 'API error'});
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const text = cleanJSON(raw);
    res.json({text});

  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MarkReady server running on port ' + PORT));
