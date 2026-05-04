# Gilgitify

Production-ready eCommerce storefront with a secure admin dashboard.

## Run locally

```bash
npm install
npm run dev
```

## Production routing

This is a single-page app. The repository includes:

- `public/.htaccess` for Apache/shared hosting such as Hostinger.
- `vercel.json` for Vercel rewrites.

For Nginx, configure:

```nginx
location / {
  try_files $uri /index.html;
}
```

## Admin access

Admin credentials are intentionally not stored in frontend code. Create the admin account in the backend user manager, then assign the `admin` role in `user_roles`.

## Security notes

- Passwords are handled by backend authentication, not local browser storage.
- Admin access is role-based and checked through protected backend tables.
- Do not commit secrets or private keys to the frontend repository.
