from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import sqlite3, os, secrets, json
from pydantic import BaseModel
from typing import Optional

DB = os.path.join(os.path.dirname(__file__), "skinpulse.db")

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB):
        conn = get_db()
        cur = conn.cursor()
        cur.execute('CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT);')
        cur.execute('CREATE TABLE skins (id TEXT PRIMARY KEY, name_pt TEXT, name_en TEXT, rarity TEXT, float REAL, price REAL, sold7 INTEGER, min30 REAL, max30 REAL);')
        skins = [
            ('ak-47-redline','AK-47 | Redline','AK-47 | Redline','Restricted',0.12,45.50,10,40.0,50.0),
            ('awp-asimov','AWP | Asiimov','AWP | Asiimov','Covert',0.25,180.00,3,150.0,200.0),
            ('m4a1s-hotrod','M4A1-S | Hot Rod','M4A1-S | Hot Rod','Classified',0.03,320.00,1,300.0,350.0)
        ]
        cur.executemany('INSERT INTO skins VALUES (?,?,?,?,?,?,?,?)', skins)
        conn.commit()
        conn.close()

app = FastAPI(title='SkinPulse API')

frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
if os.path.isdir(frontend_dir):
    app.mount('/', StaticFiles(directory=frontend_dir, html=True), name='frontend')

@app.on_event('startup')
def startup():
    init_db()

@app.get('/api/skins')
def skins(rarity: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None, sort: Optional[str] = None):
    conn = get_db(); cur = conn.cursor()
    query = 'SELECT id, name_pt, name_en, rarity, float, price, sold7, min30, max30 FROM skins'
    params = []
    where = []
    if rarity:
        where.append('lower(rarity)=?'); params.append(rarity.lower())
    if min_price is not None:
        where.append('price>=?'); params.append(min_price)
    if max_price is not None:
        where.append('price<=?'); params.append(max_price)
    if where:
        query += ' WHERE ' + ' AND '.join(where)
    cur.execute(query, params)
    rows = cur.fetchall()
    items = [dict(r) for r in rows]
    if sort=='price_asc': items.sort(key=lambda x: x['price'])
    if sort=='price_desc': items.sort(key=lambda x: -x['price'])
    return JSONResponse(items)

@app.get('/api/skins/{skin_id}')
def skin_detail(skin_id: str):
    conn = get_db(); cur = conn.cursor()
    cur.execute('SELECT * FROM skins WHERE id=?', (skin_id,))
    r = cur.fetchone()
    if not r: raise HTTPException(404, 'Skin not found')
    return dict(r)

class Register(BaseModel):
    name: Optional[str]
    email: str
    password: str

@app.post('/api/auth/register')
def register(data: Register):
    conn = get_db(); cur = conn.cursor()
    uid = secrets.token_hex(8)
    try:
        cur.execute('INSERT INTO users (id,name,email,password) VALUES (?,?,?,?)', (uid, data.name or '', data.email, data.password))
        conn.commit()
        return {'ok': True, 'user': {'id': uid, 'email': data.email, 'name': data.name}}
    except Exception:
        raise HTTPException(400, 'Email already exists or invalid')

@app.post('/api/auth/login')
def login(email: str = Form(...), password: str = Form(...)):
    conn = get_db(); cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE email=? AND password=?', (email, password))
    r = cur.fetchone()
    if not r: raise HTTPException(401, 'Invalid credentials')
    token = secrets.token_urlsafe(16)
    return {'ok': True, 'token': token, 'user': {'id': r['id'], 'email': r['email'], 'name': r['name']}}

@app.post('/api/subscribe')
def subscribe(plan: str = Form(...), token: Optional[str] = Form(None)):
    subid = secrets.token_hex(6)
    return {'ok': True, 'subscription': {'id': subid, 'plan': plan}}

@app.get('/api/subscriptions')
def subscriptions():
    p = os.path.join(os.path.dirname(__file__), 'subscriptions.json')
    try:
        with open(p,'r') as f:
            return json.load(f)
    except Exception:
        return []
