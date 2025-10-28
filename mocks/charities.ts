import { Charity } from '@/types';

export const AVAILABLE_CHARITIES: Charity[] = [
  // Environmental
  {
    id: 'env-001',
    name: 'World Wildlife Fund',
    description: 'Protecting endangered species and their habitats',
    category: 'Environmental',
  },
  {
    id: 'env-002',
    name: 'Ocean Conservancy',
    description: 'Working to protect the ocean from today\'s greatest challenges',
    category: 'Environmental',
  },
  {
    id: 'env-003',
    name: 'The Nature Conservancy',
    description: 'Conserving the lands and waters on which all life depends',
    category: 'Environmental',
  },
  {
    id: 'env-004',
    name: 'Sierra Club Foundation',
    description: 'Exploring, enjoying, and protecting the planet',
    category: 'Environmental',
  },

  // Human Rights
  {
    id: 'hr-001',
    name: 'Amnesty International',
    description: 'Protecting human rights worldwide',
    category: 'Human Rights',
  },
  {
    id: 'hr-002',
    name: 'Human Rights Watch',
    description: 'Defending human rights for everyone, everywhere',
    category: 'Human Rights',
  },
  {
    id: 'hr-003',
    name: 'ACLU Foundation',
    description: 'Defending individual rights and liberties',
    category: 'Human Rights',
  },
  {
    id: 'hr-004',
    name: 'Equal Justice Initiative',
    description: 'Fighting injustice and ending mass incarceration',
    category: 'Human Rights',
  },

  // Education
  {
    id: 'edu-001',
    name: 'Room to Read',
    description: 'Transforming children\'s lives through education',
    category: 'Education',
  },
  {
    id: 'edu-002',
    name: 'Teach For America',
    description: 'Addressing educational inequity',
    category: 'Education',
  },
  {
    id: 'edu-003',
    name: 'Khan Academy',
    description: 'Providing free world-class education for anyone, anywhere',
    category: 'Education',
  },
  {
    id: 'edu-004',
    name: 'DonorsChoose',
    description: 'Supporting public school teachers and students',
    category: 'Education',
  },

  // Health
  {
    id: 'health-001',
    name: 'Doctors Without Borders',
    description: 'Providing medical care where it\'s needed most',
    category: 'Health',
  },
  {
    id: 'health-002',
    name: 'St. Jude Children\'s Research Hospital',
    description: 'Finding cures and saving children with cancer',
    category: 'Health',
  },
  {
    id: 'health-003',
    name: 'American Cancer Society',
    description: 'Fighting cancer through research, education, and support',
    category: 'Health',
  },
  {
    id: 'health-004',
    name: 'Water.org',
    description: 'Providing access to safe water and sanitation',
    category: 'Health',
  },

  // Poverty & Hunger
  {
    id: 'pov-001',
    name: 'Feeding America',
    description: 'Fighting hunger and poverty in America',
    category: 'Poverty & Hunger',
  },
  {
    id: 'pov-002',
    name: 'Oxfam America',
    description: 'Working to end poverty and injustice',
    category: 'Poverty & Hunger',
  },
  {
    id: 'pov-003',
    name: 'CARE',
    description: 'Fighting global poverty with a focus on women and girls',
    category: 'Poverty & Hunger',
  },
  {
    id: 'pov-004',
    name: 'Heifer International',
    description: 'Ending hunger and poverty sustainably',
    category: 'Poverty & Hunger',
  },

  // Animal Welfare
  {
    id: 'animal-001',
    name: 'ASPCA',
    description: 'Preventing cruelty to animals',
    category: 'Animal Welfare',
  },
  {
    id: 'animal-002',
    name: 'Best Friends Animal Society',
    description: 'Saving the lives of pets through adoption',
    category: 'Animal Welfare',
  },
  {
    id: 'animal-003',
    name: 'The Humane Society',
    description: 'Working to create a humane world for all animals',
    category: 'Animal Welfare',
  },
  {
    id: 'animal-004',
    name: 'Farm Sanctuary',
    description: 'Rescuing and advocating for farm animals',
    category: 'Animal Welfare',
  },

  // Veterans & Military
  {
    id: 'vet-001',
    name: 'Wounded Warrior Project',
    description: 'Honoring and empowering wounded warriors',
    category: 'Veterans & Military',
  },
  {
    id: 'vet-002',
    name: 'Fisher House Foundation',
    description: 'Supporting military families during medical crises',
    category: 'Veterans & Military',
  },
  {
    id: 'vet-003',
    name: 'Iraq and Afghanistan Veterans of America',
    description: 'Supporting post-9/11 veterans',
    category: 'Veterans & Military',
  },
  {
    id: 'vet-004',
    name: 'Team Rubicon',
    description: 'Uniting veterans with first responders for disaster relief',
    category: 'Veterans & Military',
  },
];

export const CHARITY_CATEGORIES = [
  'Environmental',
  'Human Rights',
  'Education',
  'Health',
  'Poverty & Hunger',
  'Animal Welfare',
  'Veterans & Military',
] as const;
