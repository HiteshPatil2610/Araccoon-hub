# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report them privately through GitHub: open the repository's **Security** tab and
choose **Report a vulnerability**. Include the steps to reproduce, the affected
route or file, and the impact you expect.

You should get a first reply within 7 days. Once a fix is released, you are
welcome to be credited in the advisory.

## Scope

In scope: the Worker API (`worker/`), owner authentication (passkeys, sessions,
recovery codes, invites), affiliate link and redirect handling, rate limits, and
the security headers in `public/_headers`.

Out of scope: problems in your own deployment's configuration or secrets, and
vulnerabilities in third-party services (Cloudflare, Neon, Cloudinary, Upstash).
Report those to the provider.
