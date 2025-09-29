// Change this to your Render API URL after deploy:
const API = localStorage.getItem('API_URL') || 'http://localhost:8080';

async function listItems() {
  const r = await fetch(API + '/api/items');
  const items = await r.json();
  render(items);
}

async function addItem(title) {
  const r = await fetch(API + '/api/items', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title })
  });
  if (!r.ok) {
    alert('Failed: ' + r.status);
    return;
  }
  await listItems();
}

async function delItem(id) {
  await fetch(API + '/api/items/' + id, { method: 'DELETE' });
  await listItems();
}

function render(items) {
  const ul = document.querySelector('#list');
  ul.innerHTML = '';
  for (const it of items) {
    const li = document.createElement('li');
    li.textContent = `#${it.id} ${it.title} — ${it.created_at}`;
    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.onclick = () => delItem(it.id);
    li.append(' ', btn);
    ul.appendChild(li);
  }
}

document.querySelector('#addBtn').onclick = () => {
  const v = document.querySelector('#title').value.trim();
  if (v) addItem(v);
};
document.querySelector('#refreshBtn').onclick = () => listItems();

listItems();
