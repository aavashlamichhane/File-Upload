Small and very simple HTTP file upload server setup for a simple home server, since I couldn't setup smb in cloudflare zerotrust.

Create an 'uploads' directory in root of project and a 'security.js' file that holds the password hash for the site and the secret key for session validation also in the root (same directory as server.js).

Use the hashPassword.js to generate the password hash and secureKeyGen.js to generate a random secret key.

The site is experimental. Vulnerabilities can be exploited.