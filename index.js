
const { Database } = require('bun:sqlite');
const sqlite = new Database('links.sqlite');

sqlite.query(`
CREATE TABLE IF NOT EXISTS links(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    short TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    
);
`).run()

function select(link) {
  const row = sqlite.prepare('SELECT * FROM links WHERE short = ?').get(link)
  return row;
}
function insert(url, link) {
  sqlite.prepare('INSERT INTO links(url, short) VALUES(?, ?)').run(url, link)
}

function deleteLink(link) {
  sqlite.query('DELETE FROM links WHERE short = ?', [link]).run()
}

function updateClicks(link) {
  sqlite.query('UPDATE links SET clicks = clicks + 1 WHERE short = ?', [link]).run()
}


const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const request_url = new URL(request.url)
    const path = new URL(request.url).pathname;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries());

    if (path === '/') {
      return new Response('Hello from Bun.js!');
    }
    let link = queryParams.link;

    if (path === '/links/new') {
      if (!queryParams.url) {
        return new Response('Missing url', { status: 400 });
      }
      if (!queryParams.link) {
        link = Math.random().toString(36).substring(2, 8);
      }
      const url = queryParams.url;

      insert(url, link);
      return new Response(request_url.protocol + '//' + request_url.host + '/' + link);
    }

    if (path === '/links/delete') {
      if (!queryParams.link) {
        return new Response('Missing link', { status: 400 });
      }
      deleteLink(queryParams.link);
      return new Response('Link deleted');
    }

    const short = path.split('/')[1];
    if (short) {
      const row = select(short);
      if (row) {
        updateClicks(short);
        return Response.redirect(row.url);
      }
      return new Response('Link not found', { status: 404 });
    }

    return new Response("Welcome to Bun!");
  },
});



console.log(`Listening on localhost:${server.port}`)
