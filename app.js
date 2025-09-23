const app = document.getElementById('app');
const routes = {
  home: renderHome,
  skins: renderSkins,
  plans: renderPlans,
  dashboard: renderDashboard
};

function navTo(route){
  history.pushState({route}, '', '/'+route);
  routes[route]();
}
document.addEventListener('click', e=>{
  if(e.target.matches('[data-link]')){ e.preventDefault(); navTo(e.target.dataset.link); }
});

window.addEventListener('popstate', ()=>{
  const p = location.pathname.replace('/','')||'home';
  (routes[p]||renderHome)();
});

function header(){ return '<div class="container"><div style="display:flex;justify-content:space-between;align-items:center"><div><h2>SkinPulse</h2><p>Ferramenta de acompanhamento de skins</p></div><div><a class="btn" href="#" data-link="plans">Assinar</a></div></div></div>'; }

function renderHome(){
  app.innerHTML = header() + `<div class="container"><div class="card"><h3>Bem-vindo à SkinPulse</h3><p>Plataforma de exemplo com listagem de skins e sistema de assinatura (mock).</p></div></div>`;
}

async function renderSkins(){
  const res = await fetch('/api/skins');
  const skins = await res.json();
  let html = header() + '<div class="container"><h3>Skins</h3>';
  skins.forEach(s=>{
    html += `<div class="card"><strong>${s.name}</strong> — ${s.rarity} — R$ ${s.price.toFixed(2)}<br>Float: ${s.float} — Vendidos 7d: ${s.sold7}</div>`;
  });
  html += '</div>';
  app.innerHTML = html;
}

function renderPlans(){
  const plans = [{id:'monthly',name:'Mensal',price:16.90,desc:'Acesso mensal'},{id:'quarter',name:'Trimestral',price:44.90,desc:'3 meses'},{id:'annual',name:'Anual',price:144.00,desc:'12 meses - R$12/mês equivalente'}];
  let html = header() + '<div class="container"><h3>Planos</h3>';
  plans.forEach(p=> html += `<div class="card"><strong>${p.name}</strong> — R$ ${p.price.toFixed(2)} <p>${p.desc}</p><button class="btn" onclick="subscribe('${p.id}')">Assinar</button></div>`);
  html += '</div>'; app.innerHTML = html;
}

async function subscribe(plan){
  const token = localStorage.getItem('sp_token')||null;
  const res = await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,plan})});
  const j = await res.json();
  if(j.ok){ alert('Assinatura criada: '+j.subscription.id); localStorage.setItem('sp_sub', j.subscription.id); navTo('dashboard'); }
  else alert('Erro: '+(j.error||'unknown'));
}

function loggedUser(){ const s = localStorage.getItem('sp_user'); return s?JSON.parse(s):null; }

function renderDashboard(){
  const user = loggedUser();
  if(!user){ app.innerHTML = header() + `<div class="container"><h3>Minha Conta</h3><p>Por favor <a href="#" data-link="login">entre</a> ou <a href="#" data-link="register">cadastre-se</a>.</p></div>`; return; }
  let html = header() + `<div class="container"><h3>Olá, ${user.name||user.email}</h3>`;
  html += `<div class="card"><strong>Assinatura:</strong> ${localStorage.getItem('sp_sub')||'Nenhuma'}</div>`;
  html += `<div class="card"><button class="btn" onclick="logout()">Sair</button></div></div>`;
  app.innerHTML = html;
}

function logout(){ localStorage.removeItem('sp_token'); localStorage.removeItem('sp_user'); navTo('home'); }

document.addEventListener('DOMContentLoaded', async ()=>{
  const p = location.pathname.replace('/','')||'home';
  (routes[p]||renderHome)();
  const top = document.querySelector('.topbar nav');
  const loginLink = document.createElement('a'); loginLink.href='#'; loginLink.dataset.link='login'; loginLink.textContent='Login'; loginLink.style.marginLeft='10px';
  const regLink = document.createElement('a'); regLink.href='#'; regLink.dataset.link='register'; regLink.textContent='Cadastrar'; regLink.style.marginLeft='10px';
  top.appendChild(loginLink); top.appendChild(regLink);
});

window.renderLogin = function(){
  app.innerHTML = header() + `<div class="container"><h3>Login</h3><div class="card"><div class="form-row"><input id="email" placeholder="email"></div><div class="form-row"><input id="password" type="password" placeholder="senha"></div><div><button class="btn" onclick="doLogin()">Entrar</button></div></div></div>`;
}
window.renderRegister = function(){
  app.innerHTML = header() + `<div class="container"><h3>Cadastrar</h3><div class="card"><div class="form-row"><input id="rname" placeholder="nome"></div><div class="form-row"><input id="remail" placeholder="email"></div><div class="form-row"><input id="rpassword" type="password" placeholder="senha"></div><div><button class="btn" onclick="doRegister()">Criar conta</button></div></div></div>`;
}
window.doRegister = async function(){
  const name=document.getElementById('rname').value; const email=document.getElementById('remail').value; const password=document.getElementById('rpassword').value;
  const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})});
  const j = await res.json(); if(j.ok){ alert('Conta criada'); localStorage.setItem('sp_user', JSON.stringify(j.user)); navTo('dashboard'); } else alert('Erro: '+(j.error||JSON.stringify(j)));
}
window.doLogin = async function(){
  const email=document.getElementById('email').value; const password=document.getElementById('password').value;
  const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const j = await res.json(); if(j.ok){ localStorage.setItem('sp_token', j.token); localStorage.setItem('sp_user', JSON.stringify(j.user)); navTo('dashboard'); } else alert('Erro: '+(j.error||JSON.stringify(j))); }
