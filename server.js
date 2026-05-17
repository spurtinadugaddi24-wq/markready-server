const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({limit:'10kb'}));

const GROQ_KEY = process.env.GROQ_API_KEY;

function cleanJSON(text) {
  let t = text.trim();
  t = t.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if(start !== -1 && end !== -1) t = t.substring(start, end + 1);
  return t;
}

async function callGroq(prompt, key) {
  const useKey = key || GROQ_KEY;
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + useKey
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
    throw new Error(err.error?.message || 'Groq API error ' + response.status);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

app.get('/', (req, res) => res.json({status:'MarkReady API running'}));

app.post('/api/chat', async (req, res) => {
  const {prompt, apiKey} = req.body;
  if(!prompt) return res.status(400).json({error:'No prompt provided'});
  try {
    const raw = await callGroq(prompt, apiKey);
    const text = cleanJSON(raw);
    res.json({text});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.post('/api/awareness', async (req, res) => {
  const {specialisation, vertical} = req.body;
  if(!specialisation) return res.status(400).json({error:'No specialisation provided'});
  const prompt = 'Generate 10 multiple choice questions for an MBA student specialising in ' + specialisation + ' focused on ' + (vertical||'current trends and industry awareness') + '. Test awareness of recent developments, current trends, real industry data in India 2024-2025. Return JSON only: {"questions":[{"q":"Question","opts":["A","B","C","D"],"ans":0,"explanation":"Why correct and why it matters for career in one sentence."}]} ans is 0-indexed. Make questions practical and current. No markdown.';
  try {
    const raw = await callGroq(prompt);
    const text = cleanJSON(raw);
    res.json({text});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MarkReady server running on port ' + PORT));
