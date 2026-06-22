# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.9.x   | :white_check_mark: |
| < 0.9   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in HazardMap, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly with details
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue before any public disclosure.

## Security Best Practices

- `.env` and `.env.local` files must NEVER be committed to git
- All API inputs are validated with Pydantic models
- Database connections use parameterized queries (no SQL injection)
- CORS origins are explicitly whitelisted
- Docker containers run with minimal privileges
