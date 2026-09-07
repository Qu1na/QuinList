@devjuanes/matuclient
TypeScript icon, indicating that this package has built-in type declarations
2.3.0 • Public • Published a month ago
@devjuanes/matuclient
npm version MIT License TypeScript Node.js

Official JavaScript/TypeScript client for MatuDB — A self-hosted database platform with real-time, authentication, and storage. Developed by DevJuanes (Juan Esteban Landazuri) from Cali, Colombia.

About MatuDB
MatuDB is a self-hosted database platform created by Juan Esteban Landazuri (DevJuanes), a senior full-stack developer from Cali, Colombia with 15+ years of experience. It provides:

Full data ownership — Your database stays on your servers
PostgreSQL power — Full relational database capabilities
Real-time updates — WebSocket-based live subscriptions
Authentication — JWT-based auth system
File storage — Upload, download, and manage files
Built by DevJuanes
Website: https://devjuanes.com
GitHub: https://github.com/DevJuanes
NPM: @devjuanes/matuclient
Installation
npm install @devjuanes/matuclient
Or use locally (within the MatuDB monorepo):

npm install ../matu-db-api/packages/matuclient
Features
PostgreSQL Database — Full relational database power
Multi-schema projects — Query main, shop, or any schema slug via config or db.schema()
Real-time Subscriptions — WebSocket-based live updates via Socket.io
Authentication — JWT-based auth system
File Storage — Upload, download, and manage files
Email templates — db.templates for programmed emails

Password recovery (QuinList):
- Login calls `db.auth.resetPasswordForEmail(email)` → MatuDB `POST …/recover`
- Configure the recovery email template so the link points to
  `https://<your-app>/reset-password?token={{token}}` (or the placeholder MatuDB uses)
- Reset page calls `db.auth.updateUser({ password }, { token })` → `POST …/reset`
- Remind users to check spam if the email is delayed

TypeScript Support — Full type definitions included
Supabase-compatible API — Familiar patterns for developers
Quick Start
import { createClient } from '@devjuanes/matuclient';

const db = createClient({
  url: 'https://api.matudb.dev', // or your MatuDB API URL
  projectId: 'my-project',
  apiKey: 'anon_xxxx',
});

// Query data (default / main schema)
const { data, error } = await db.from('users').select('*').eq('active', true);
Configuration
Automatic Configuration (Environment Variables)
MATUDB_URL=https://api.matudb.dev
MATUDB_PROJECT_ID=my-project
MATUDB_API_KEY=anon_xxxx...
MATUDB_SCHEMA=main
MATUDB_USE_SUPABASE=false

# Vite / frontend
VITE_MATUDB_URL=...
VITE_MATUDB_API_KEY=...
VITE_MATUDB_SCHEMA=shop
Manual Configuration
import { createClient } from '@devjuanes/matuclient';

const db = createClient({
  url: 'https://api.matudb.dev',
  projectId: 'my-project',
  apiKey: 'anon_xxxx',
  schema: 'main', // optional project schema slug
  useSupabase: false,
});
Schemas (multi-tenant / multi-app data)
In the MatuDB console each schema has a slug (e.g. main, shop, ops). The client sends that slug as:

Header: X-MatuDB-Schema
Query: ?schema=shop
so reads, writes and raw SQL hit the correct PostgreSQL schema.

const db = createClient({ url, projectId, apiKey });

// Option A — default schema for the whole client
const shop = createClient({ url, projectId, apiKey, schema: 'shop' });
await shop.from('products').select('*');

// Option B — scoped client from an existing instance
const ops = db.schema('ops');
await ops.from('tickets').insert({ title: 'New issue' });
await ops.rpc('SELECT count(*) FROM tickets');
API Reference
db.schema(slug) — Schema-scoped client
const shopDb = db.schema('shop');
const { data } = await shopDb.from('orders').select('*').limit(20);
db.from(table) — Query Builder
// SELECT with filters
const { data, error } = await db
  .from('users')
  .select('id, name, email')
  .eq('active', true)
  .order('created_at', { ascending: false })
  .limit(10);

// Filter operators
.eq('col', value)       // =
.neq('col', value)      // !=
.gt('col', value)       // >
.gte('col', value)      // >=
.lt('col', value)       // <
.lte('col', value)      // <=
.like('col', '%patt%')  // LIKE
.ilike('col', '%patt%') // ILIKE (case-insensitive)
.in('col', [1, 2, 3])   // IN (...)
.is('col', null)        // IS NULL / IS TRUE / IS FALSE

// Single row
const { data: user } = await db.from('users').select('*').eq('id', userId).single();

// INSERT
const { data, error } = await db.from('products').insert({ name: 'Widget', price: 9.99 });

// INSERT multiple
const { data } = await db.from('products').insert([{ name: 'A' }, { name: 'B' }]);

// UPDATE
const { data } = await db.from('users').update({ name: 'Alice' }).eq('id', userId);

// DELETE
const { data } = await db.from('orders').delete().eq('id', orderId);
db.auth — Authentication
// Sign up
const { data, error } = await db.auth.signUp({ email, password });

// Sign in
const { data, error } = await db.auth.signInWithPassword({ email, password });
// data = { user, session: { access_token, expires_at, user } }

// Request password recovery email (MatuDB sends a link with token)
const { data: recoverData, error: recoverError } = await db.auth.resetPasswordForEmail(email);

// Complete reset from the emailed link token
const { data: resetData, error: resetError } = await db.auth.updateUser(
  { password: 'nueva-contraseña' },
  { token: 'token-from-email-link' },
);

// Sign out
await db.auth.signOut();

// Get current session
const { data: { session } } = await db.auth.getSession();

// Get current user
const { data: { user } } = await db.auth.getUser();

// Listen for auth changes
const { data: { subscription } } = db.auth.onAuthStateChange((event, session) => {
  console.log(event); // 'SIGNED_IN' | 'SIGNED_OUT'
});
// Cleanup:
subscription.unsubscribe();
db.storage — File Storage
// Upload
const { data, error } = await db.storage.upload('avatar.png', file);

// Get public URL
const { data: { publicUrl } } = db.storage.getPublicUrl('avatar.png');

// List files
const { data: files } = await db.storage.list();

// Download
const { data: blob } = await db.storage.download('report.pdf');

// Delete
await db.storage.remove(['old-file.png', 'another.pdf']);
db.channel() — Realtime
// Supabase-compatible style
const channel = db
  .channel('public:users')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
    console.log('Change:', payload);
  })
  .subscribe();

// Short style
db.channel('orders')
  .on('INSERT', payload => console.log('New order:', payload.data))
  .on('DELETE', payload => console.log('Deleted:', payload.data))
  .subscribe();

// Cleanup
db.removeChannel(channel);
db.removeAllChannels();
db.rpc() — Raw SQL
const { data, error } = await db.rpc('SELECT * FROM users WHERE created_at > NOW() - INTERVAL \'7 days\'');
Related Packages
matu-db-api — The MatuDB backend server
matudeploy — Deployment tools
License
MIT License — Developed with ❤️ in Cali, Colombia by DevJuanes