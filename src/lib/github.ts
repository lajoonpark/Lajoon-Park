import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { site } from '../data/site';

export interface Repo {
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
  language: string | null;
  release: { tag: string; publishedAt: string } | null;
  releaseCount: number;
}

export interface Day {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GithubData {
  fetchedAt: string;
  login: string;
  createdAt: string;
  followers: number;
  publicRepos: number;
  stars: number;
  forks: number;
  releases: number;
  languages: { name: string; bytes: number }[];
  contributions: {
    total: number;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    weeks: Day[][];
  };
  repos: Repo[];
}

// Relative to the project root: the bundled build can't resolve paths from import.meta.url.
const SNAPSHOT = resolve(process.cwd(), 'src/data/github.snapshot.json');

// Only public, non-fork repos are ever requested, so private repo names can't reach the page.
const QUERY = `
query($login: String!) {
  user(login: $login) {
    createdAt
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false,
                 orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes {
        name description url homepageUrl stargazerCount forkCount pushedAt
        primaryLanguage { name }
        latestRelease { tagName publishedAt }
        releases { totalCount }
        languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 } as const;

// CI passes a token in the environment. Locally, fall back to the gh CLI's login.
function token(): string | null {
  const env = process.env.GH_STATS_TOKEN || process.env.GITHUB_TOKEN;
  if (env) return env;
  const gh = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
  return gh.status === 0 ? gh.stdout.trim() || null : null;
}

async function fetchLive(): Promise<GithubData> {
  const auth = token();
  if (!auth) throw new Error('no GitHub token (set GITHUB_TOKEN or run `gh auth login`)');

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json', 'User-Agent': 'lajoon-park-site' },
    body: JSON.stringify({ query: QUERY, variables: { login: site.login } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);
  const json: any = await res.json();
  if (json.errors?.length || !json.data?.user) throw new Error(`GitHub API: ${JSON.stringify(json.errors ?? 'no user')}`);

  const u = json.data.user;
  const nodes: any[] = u.repositories.nodes;
  const cc = u.contributionsCollection;

  const bytes = new Map<string, number>();
  for (const r of nodes) for (const e of r.languages.edges) bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size);

  const repos: Repo[] = nodes.map((r) => ({
    name: r.name,
    description: r.description,
    url: r.url,
    homepage: r.homepageUrl || null,
    stars: r.stargazerCount,
    forks: r.forkCount,
    pushedAt: r.pushedAt,
    language: r.primaryLanguage?.name ?? null,
    release: r.latestRelease ? { tag: r.latestRelease.tagName, publishedAt: r.latestRelease.publishedAt } : null,
    releaseCount: r.releases.totalCount,
  }));

  return {
    fetchedAt: new Date().toISOString(),
    login: site.login,
    createdAt: u.createdAt,
    followers: u.followers.totalCount,
    publicRepos: u.repositories.totalCount,
    stars: repos.reduce((n, r) => n + r.stars, 0),
    forks: repos.reduce((n, r) => n + r.forks, 0),
    releases: repos.reduce((n, r) => n + r.releaseCount, 0),
    languages: [...bytes].map(([name, b]) => ({ name, bytes: b })).sort((a, b) => b.bytes - a.bytes),
    contributions: {
      total: cc.contributionCalendar.totalContributions,
      commits: cc.totalCommitContributions,
      pullRequests: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      reviews: cc.totalPullRequestReviewContributions,
      weeks: cc.contributionCalendar.weeks.map((w: any) =>
        w.contributionDays.map((d: any) => ({
          date: d.date,
          count: d.contributionCount,
          level: LEVELS[d.contributionLevel as keyof typeof LEVELS] ?? 0,
        })),
      ),
    },
    repos,
  };
}

let cached: Promise<GithubData> | null = null;

// Live data when the API answers (and the snapshot is refreshed); otherwise the last good snapshot.
export function getGithub(): Promise<GithubData> {
  cached ??= fetchLive().then(
    (data) => {
      writeFileSync(SNAPSHOT, JSON.stringify(data, null, 2) + '\n');
      return data;
    },
    (err) => {
      console.warn(`[github] live fetch failed (${err.message}); using snapshot`);
      return JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as GithubData;
    },
  );
  return cached;
}
