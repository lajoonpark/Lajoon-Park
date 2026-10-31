// Featured projects, in display order. The first one renders wide.
// `repos` lists GitHub repo names to try in order, so a rename never breaks the site:
// put the new name first and keep the old one after it.
// Stars, forks, language, last push and release come from the API, not from here.

export type ArtKind = 'silk' | 'chrome' | 'contour' | 'orb' | 'bust' | 'ridge' | 'petal' | 'flow';
export type ArtPalette = 'night' | 'bone' | 'ember' | 'violet' | 'lime' | 'ash';

export interface Project {
  name: string;
  repos: string[];
  kind: string;
  status: 'Released' | 'In progress' | 'Active';
  year: string;
  blurb: string;
  // Link to this branch instead of the default one (for work that lives off main).
  branch?: string;
  // Shown when GitHub reports no language, which it does when the default branch has no code.
  language?: string;
  art: { kind: ArtKind; palette: ArtPalette; seed: number; label: string };
}

export const projects: Project[] = [
  {
    name: 'Wren',
    repos: ['Wren'],
    kind: 'macOS app',
    status: 'Released',
    year: '2026',
    blurb:
      'A calm activity monitor that explains what your Mac is doing in plain language. Health at a glance, per-app energy, history, and a wiki for the processes you don’t recognise.',
    art: { kind: 'ridge', palette: 'night', seed: 3, label: 'Generative ridgelines rising like a sound wave' },
  },
  {
    name: 'Pelorus',
    repos: ['Pelorus', 'Safari-Bookmarks-Radial'],
    kind: 'macOS menu-bar app',
    status: 'In progress',
    year: '2026',
    blurb:
      'Press a shortcut and your Safari bookmarks open in a radial menu at your cursor. Point and click, or press a number. Your hands never leave the keys.',
    branch: 'dev',
    language: 'Swift',
    art: { kind: 'petal', palette: 'bone', seed: 12, label: 'Layered rose curves forming a plotted flower' },
  },
  {
    name: 'Delta-V',
    repos: ['Delta-V'],
    kind: 'Desktop app',
    status: 'Active',
    year: '2026',
    blurb:
      'A repo launcher for coding agents. Point it at your project folders, pick an agent, and a live terminal opens already inside that repo.',
    art: { kind: 'flow', palette: 'ember', seed: 33, label: 'Flowing light trails in a warm field' },
  },
];
