import { defineConfig } from 'astro/config';

// On GitHub Actions the repo name decides the base path:
//   <user>.github.io  -> served at the root
//   any other repo    -> served under /<repo>
// A custom domain (SITE_URL) is always served at the root.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const customDomain = process.env.SITE_URL;
const isUserSite = repo?.toLowerCase().endsWith('.github.io');

export default defineConfig({
  site: customDomain ?? 'https://lajoonpark.github.io',
  base: !customDomain && repo && !isUserSite ? `/${repo}` : '/',
});
