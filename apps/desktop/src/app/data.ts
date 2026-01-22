export type SourceItem = {
  title: string;
  subtitle: string;
};

export type RecentItem = {
  title: string;
  location: string;
  progress: number;
};

export type SubtitleItem = {
  id: string;
  time: string;
  en: string;
  cn: string;
};

export type ListeningItem = {
  id: string;
  title: string;
  source: string;
  tags: string[];
  duration: string;
  progress: number;
};

export type VocabItem = {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  source: string;
};

export const sources: SourceItem[] = [
  { title: 'Local Files', subtitle: 'Device storage' },
  { title: 'Cloud Drive', subtitle: 'Quark / Google Drive' },
  { title: 'NAS (SMB)', subtitle: 'Home server' },
  { title: 'WebDAV', subtitle: 'Generic provider' },
];

export const recentItems: RecentItem[] = [
  {
    title: 'Friends S01E01.mkv',
    location: 'NAS > TV Shows > Friends',
    progress: 72,
  },
  {
    title: 'TED Talk - The Habit Loop.mp3',
    location: 'WebDAV > Audio > TED',
    progress: 24,
  },
  {
    title: 'The Office S03E05.mp4',
    location: 'Cloud > Comedy',
    progress: 8,
  },
];

export const subtitleItems: SubtitleItem[] = [
  {
    id: 's1',
    time: '00:12',
    en: 'Hello everyone, welcome to Audixa.',
    cn: 'Welcome sentence (CN)',
  },
  {
    id: 's2',
    time: '00:15',
    en: 'The resource acquisition process is fragmented.',
    cn: 'Resource acquisition is fragmented.',
  },
  {
    id: 's3',
    time: '00:19',
    en: 'We want to change how you learn languages.',
    cn: 'We want to change learning.',
  },
  {
    id: 's4',
    time: '00:24',
    en: 'Click the subtitle to seek.',
    cn: 'Click subtitle to seek.',
  },
];

export const listeningItems: ListeningItem[] = [
  {
    id: 'l1',
    title: 'Its not just about watching',
    source: 'TED - Learning',
    tags: ['Saved', 'Easy'],
    duration: '00:18',
    progress: 40,
  },
  {
    id: 'l2',
    title: 'Pay attention to the rhythm',
    source: 'BBC 6 Minute English',
    tags: ['Loop', 'Medium'],
    duration: '00:22',
    progress: 65,
  },
  {
    id: 'l3',
    title: 'Make the sentence your own',
    source: 'Friends S01E01',
    tags: ['Favorite'],
    duration: '00:12',
    progress: 10,
  },
];

export const vocabItems: VocabItem[] = [
  {
    id: 'v1',
    word: 'meticulous',
    phonetic: '/məˈtɪkjələs/',
    definition: 'adj. careful and precise',
    example: 'He was meticulous about keeping his notes.',
    source: 'Breaking Bad S02E04',
  },
  {
    id: 'v2',
    word: 'inevitable',
    phonetic: '/ɪnˈevɪtəbl/',
    definition: 'adj. unavoidable',
    example: 'Change is inevitable, growth is optional.',
    source: 'TED Talk - Growth Mindset',
  },
  {
    id: 'v3',
    word: 'procrastinate',
    phonetic: '/prəˈkræstɪneɪt/',
    definition: 'v. delay or postpone',
    example: 'I procrastinate when it comes to taxes.',
    source: 'Friends S05E12',
  },
];
