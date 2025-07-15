import { VestingCategory } from '../types';

export const vestingCategories: Array<{
  id: VestingCategory;
  name: string;
  description: string;
  icon: string;
  suggestedPercentage: number;
  suggestedDuration: number;
}> = [
  {
    id: 'team',
    name: 'Team',
    description: 'Tokens allocated to team members and advisors',
    icon: 'Users',
    suggestedPercentage: 20,
    suggestedDuration: 730 // 2 years
  },
  {
    id: 'advertising',
    name: 'Advertising',
    description: 'Marketing and promotional activities',
    icon: 'Megaphone',
    suggestedPercentage: 10,
    suggestedDuration: 365 // 1 year
  },
  {
    id: 'publicSale',
    name: 'Public Sale',
    description: 'Tokens available for public purchase',
    icon: 'Store',
    suggestedPercentage: 25,
    suggestedDuration: 180 // 6 months
  },
  {
    id: 'privateSale',
    name: 'Private Sale',
    description: 'Early investor and private sale allocations',
    icon: 'Lock',
    suggestedPercentage: 15,
    suggestedDuration: 365 // 1 year
  },
  {
    id: 'ecosystem',
    name: 'Ecosystem',
    description: 'Community rewards and ecosystem development',
    icon: 'Globe',
    suggestedPercentage: 15,
    suggestedDuration: 545 // 1.5 years
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Partnership and marketing initiatives',
    icon: 'TrendingUp',
    suggestedPercentage: 10,
    suggestedDuration: 365 // 1 year
  },
  {
    id: 'development',
    name: 'Development',
    description: 'Technical development and maintenance',
    icon: 'Code',
    suggestedPercentage: 5,
    suggestedDuration: 910 // 2.5 years
  }
];