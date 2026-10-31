// Everything a person would edit by hand lives here and in projects.ts.
// Numbers are never typed in: they come from the GitHub API (src/lib/github.ts).

export const site = {
  name: 'Lajoon Park',
  login: 'lajoonpark',
  role: 'Developer',
  // Hero lede: first sentence is bright, the second is muted.
  lede: 'Native Mac apps and tools for working with coding agents.',
  ledeMuted: 'Built in the open. The numbers below are pulled live from GitHub.',
  email: 'hello@lajoonpark.com',
  sourceRepo: 'https://github.com/lajoonpark/lajoonpark.com',
};

// Repos that were renamed or should read differently on the page.
// Key is the GitHub repo name, value is the name shown here.
export const displayNames: Record<string, string> = {
  pelorus: 'Pelorus',
  'Safari-Bookmarks-Radial': 'Pelorus',
};
