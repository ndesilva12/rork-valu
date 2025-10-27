import { Organization } from '@/types';

export const AVAILABLE_ORGANIZATIONS: Organization[] = [
  // Environmental
  {
    id: 'world-wildlife-fund',
    name: 'World Wildlife Fund',
    category: 'environmental',
    description: 'Protecting wildlife and natural habitats worldwide',
  },
  {
    id: 'nature-conservancy',
    name: 'The Nature Conservancy',
    category: 'environmental',
    description: 'Protecting lands and waters globally',
  },
  {
    id: 'sierra-club',
    name: 'Sierra Club',
    category: 'environmental',
    description: 'Environmental advocacy and conservation',
  },
  {
    id: 'greenpeace',
    name: 'Greenpeace',
    category: 'environmental',
    description: 'Environmental activism and campaigns',
  },

  // Human Rights
  {
    id: 'amnesty-international',
    name: 'Amnesty International',
    category: 'human-rights',
    description: 'Fighting for human rights worldwide',
  },
  {
    id: 'aclu',
    name: 'American Civil Liberties Union',
    category: 'human-rights',
    description: 'Defending individual rights and liberties',
  },
  {
    id: 'human-rights-watch',
    name: 'Human Rights Watch',
    category: 'human-rights',
    description: 'Investigating and reporting on human rights abuses',
  },

  // Healthcare
  {
    id: 'doctors-without-borders',
    name: 'Doctors Without Borders',
    category: 'healthcare',
    description: 'Medical humanitarian aid in crisis zones',
  },
  {
    id: 'red-cross',
    name: 'American Red Cross',
    category: 'healthcare',
    description: 'Emergency assistance and disaster relief',
  },
  {
    id: 'st-jude',
    name: "St. Jude Children's Research Hospital",
    category: 'healthcare',
    description: 'Pediatric treatment and research',
  },

  // Education
  {
    id: 'teach-for-america',
    name: 'Teach For America',
    category: 'education',
    description: 'Educational equity through teaching',
  },
  {
    id: 'room-to-read',
    name: 'Room to Read',
    category: 'education',
    description: 'Literacy and gender equality in education',
  },

  // Poverty & Hunger
  {
    id: 'feeding-america',
    name: 'Feeding America',
    category: 'poverty',
    description: 'Fighting hunger in America',
  },
  {
    id: 'oxfam',
    name: 'Oxfam',
    category: 'poverty',
    description: 'Fighting poverty and injustice globally',
  },
  {
    id: 'heifer-international',
    name: 'Heifer International',
    category: 'poverty',
    description: 'Ending hunger and poverty through sustainable agriculture',
  },

  // Animal Welfare
  {
    id: 'aspca',
    name: 'ASPCA',
    category: 'animal-welfare',
    description: 'Preventing cruelty to animals',
  },
  {
    id: 'humane-society',
    name: 'The Humane Society',
    category: 'animal-welfare',
    description: 'Animal protection and welfare',
  },

  // Veterans
  {
    id: 'wounded-warrior',
    name: 'Wounded Warrior Project',
    category: 'veterans',
    description: 'Supporting wounded veterans',
  },
  {
    id: 'fisher-house',
    name: 'Fisher House Foundation',
    category: 'veterans',
    description: 'Housing for military and veteran families',
  },

  // Children & Youth
  {
    id: 'save-the-children',
    name: 'Save the Children',
    category: 'children',
    description: 'Improving the lives of children worldwide',
  },
  {
    id: 'boys-girls-clubs',
    name: 'Boys & Girls Clubs of America',
    category: 'children',
    description: 'Youth development programs',
  },
  {
    id: 'make-a-wish',
    name: 'Make-A-Wish Foundation',
    category: 'children',
    description: 'Granting wishes for children with critical illnesses',
  },

  // Disaster Relief
  {
    id: 'direct-relief',
    name: 'Direct Relief',
    category: 'disaster-relief',
    description: 'Emergency medical assistance',
  },
  {
    id: 'team-rubicon',
    name: 'Team Rubicon',
    category: 'disaster-relief',
    description: 'Veteran-led disaster response',
  },

  // Religious
  {
    id: 'salvation-army',
    name: 'The Salvation Army',
    category: 'religious',
    description: 'Christian church and charitable organization',
  },
  {
    id: 'catholic-charities',
    name: 'Catholic Charities USA',
    category: 'religious',
    description: 'Social services through Catholic church',
  },
];

export const ORGANIZATION_CATEGORIES = [
  { id: 'environmental', name: 'Environmental' },
  { id: 'human-rights', name: 'Human Rights' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'education', name: 'Education' },
  { id: 'poverty', name: 'Poverty & Hunger' },
  { id: 'animal-welfare', name: 'Animal Welfare' },
  { id: 'veterans', name: 'Veterans' },
  { id: 'children', name: 'Children & Youth' },
  { id: 'disaster-relief', name: 'Disaster Relief' },
  { id: 'religious', name: 'Religious' },
];
