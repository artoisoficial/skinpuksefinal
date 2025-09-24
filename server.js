const express = require("express");
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SKINS_FILE = path.join(DATA_DIR, 'skins.json');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');

function readJSON(fn, fallback) {
  try { return JSON.parse(fs.readFileSync(fn)); } catch(e) { return fallback; }
}
function writeJSON(fn, obj) {
  fs.writeFileSync(fn, JSON.stringify(obj, null, 2));
}

if (!fs.existsSync(USERS_FILE)) writeJSON(USERS_FILE, []);
if (!fs.existsSync(SKINS_FILE)) writeJSON(SKINS_FILE, [
  {"id":"ak-47-redline","name":"AK-47 | Redline","rarity":"Restricted","float":0.12,"price":45.50,"sold7":10,"min30":40.0,"max30":50.0},
  {"id":"awp-asimov","name":"AWP | Asiimov","rarity":"Covert","float":0.25,"price":180.00,"sold7":3,"min30":150.0,"max30":200.0},
  {"id":"m4a1-s-hotrod","name":"M4A1-S | Hot Rod","rarity":"Classified","float":0.03,"price":320.00,"sold7":1,"min30":300.0,"max30":350.0}
]);
if (!fs.existsSync(SUBS_FILE)) writeJSON(SUBS_FILE, []);

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/api/skins', (req, res) => {
  const skins = readJSON(SKINS_FILE, []);
  let out = skins.slice();
  if (req.query.rarity) out = out.filter(s => s.rarity.toLowerCase() === req.query.rarity.toLowerCase());
  if (req.query.min_price) out = out.filter(s => s.price >= parseFloat(req.query.min_price));
  if (req.query.max_price) out = out.filter(s => s.price <= parseFloat(req.query.max_price));
  if (req.query.sort === 'price_asc') out.sort((a,b)=>a.price-b.price);
  if (req.query.sort === 'price_desc') out.sort((a,b)=>b.price-a.price);
  res.json(out);
});

app.get('/api/skins/:id', (req, res) => {
  const skins = readJSON(SKINS_FILE, []);
  const s = skins.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({error:'not found'});
  res.json(s);
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({error:'email and password required'});
  const users = readJSON(USERS_FILE, []);
  if (users.find(u=>u.email===email)) return res.status(400).json({error:'email already exists'});
  const user = { id: uuidv4(), name: name||'', email, password, createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON(USERS_FILE, users);
  res.json({ok:true,user:{id:user.id,email:user.email,name:user.name}});
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(USERS_FILE, []);
  const user = users.find(u=>u.email===email && u.password===password);
  if (!user) return res.status(401).json({error:'invalid credentials'});
  const token = Buffer.from(user.id).toString('base64');
  res.json({ok:true, token, user:{id:user.id,email:user.email,name:user.name}});
});

app.post('/api/subscribe', (req, res) => {
  const { token, plan } = req.body;
  if (!plan) return res.status(400).json({error:'plan required'});
  const subs = readJSON(SUBS_FILE, []);
  const sub = { id: uuidv4(), plan, token: token||null, startedAt: new Date().toISOString(), validUntil: new Date(Date.now()+365*24*60*60*1000).toISOString() };
  subs.push(sub);
  writeJSON(SUBS_FILE, subs);
  res.json({ok:true, subscription: sub});
});

app.get('/api/subscriptions', (req, res) => {
  res.json(readJSON(SUBS_FILE, []));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
