
import React from 'react';
import { Appointment, Message, Trip, SchedulerItem, Expense } from './types';
import { Calendar, Globe, Map, Plane, Clock } from 'lucide-react';

export const MOCK_USER = {
  id: 'u1',
  name: 'Alex Chen',
  avatarUrl: 'https://picsum.photos/id/64/200/200',
};

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'user',
    text: 'I want to plan a 5-day trip to Kyoto in November. I love historical temples and autumn foliage. Can you suggest some itineraries?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'm2',
    sender: 'ai',
    text: 'Kyoto in November is breathtaking! Based on your preferences, I have created two distinct itinerary options for you. One focuses on the classic heritage sites, and the other explores the hidden scenic nature spots.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9),
    suggestions: [
      {
        id: 's1',
        title: 'Heritage & History',
        description: 'A deep dive into the Golden Pavilion, Fushimi Inari, and traditional tea ceremonies.',
        duration: '5 Days',
        priceEstimate: '$1,200 - $1,500',
        tags: ['Temples', 'Culture', 'Popular'],
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 's2',
        title: 'Autumn Nature Walk',
        description: 'Focus on Arashiyama Bamboo Grove, scenic train rides, and hiking in Kurama.',
        duration: '5 Days',
        priceEstimate: '$900 - $1,100',
        tags: ['Nature', 'Hiking', 'Scenic'],
        imageUrl: 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&q=80&w=400'
      }
    ]
  }
];

export const UPCOMING_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    title: 'Flight to Osaka (KIX)',
    date: new Date(new Date().setHours(10, 30, 0, 0)),
    durationMinutes: 690,
    location: 'Terminal 4, Gate 14B',
    type: 'flight',
    status: 'confirmed',
    color: 'bg-indigo-600',
  },
  {
    id: 'a2',
    title: 'Check-in: Ritz Carlton',
    date: new Date(new Date().setHours(15, 0, 0, 0)),
    durationMinutes: 30,
    location: 'Kyoto, Japan',
    type: 'stay',
    status: 'confirmed',
    color: 'bg-emerald-600',
  },
  {
    id: 'a3',
    title: 'Dinner Reservation: Kichi Kichi',
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    durationMinutes: 90,
    location: 'Nakagyo Ward',
    type: 'activity',
    status: 'pending',
    color: 'bg-amber-600',
  }
];

export const STATS_DATA = [
  {
    title: 'Upcoming Trips',
    value: '3',
    change: 'Next: Kyoto (2d)',
    trend: 'neutral' as const,
    icon: <Plane className="w-5 h-5 text-indigo-400" />,
  },
  {
    title: 'Countries Visited',
    value: '12',
    change: '+2 this year',
    trend: 'up' as const,
    icon: <Globe className="w-5 h-5 text-emerald-400" />,
  },
  {
    title: 'Saved Itineraries',
    value: '8',
    change: 'Last saved 2h ago',
    trend: 'up' as const,
    icon: <Map className="w-5 h-5 text-blue-400" />,
  },
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: 't1',
    destination: 'Kyoto, Japan',
    dates: 'Oct 15 - Oct 22, 2023',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800', 
    status: 'upcoming',
    weather: '18°C',
    flight: {
      code: 'JL 405',
      airline: 'Japan Airlines',
      departureTime: '10:30 AM',
      arrivalTime: '2:45 PM',
      origin: 'LAX',
      destination: 'KIX',
      gate: '14B',
      seat: '4A'
    },
    hotel: {
      name: 'Ritz Carlton Kyoto',
      address: 'Kamogawa Nijo-Ohashi Hotori',
      checkIn: '3:00 PM',
      rating: 5
    }
  },
  {
    id: 't2',
    destination: 'San Francisco, USA',
    dates: 'Nov 10 - Nov 14, 2023',
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&q=80&w=800',
    status: 'planning',
  },
  {
    id: 't3',
    destination: 'London, UK',
    dates: 'Dec 05 - Dec 10, 2023',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800',
    status: 'planning',
  }
];

export const MOCK_SCHEDULER_ITEMS: SchedulerItem[] = [
  {
    id: 'si-1',
    content: 'Remember to buy JR Rail Pass before leaving',
    category: 'note',
    timestamp: new Date(),
    isCompleted: false,
    priority: 'high'
  },
  {
    id: 'si-2',
    content: 'Visit Fushimi Inari Shrine early morning to avoid crowds',
    category: 'ai-suggestion',
    timestamp: new Date(Date.now() - 86400000),
    isCompleted: false,
    priority: 'medium'
  },
  {
    id: 'si-3',
    content: 'Restaurant reservation: Monk (confirm 2 days prior)',
    category: 'activity',
    timestamp: new Date(Date.now() - 172800000),
    isCompleted: true,
    priority: 'high'
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1',
    date: new Date(2023, 9, 15),
    item: 'Airport Taxi',
    location: 'Kyoto',
    amount: 45.00,
    category: 'transport',
    currency: 'USD'
  },
  {
    id: 'e2',
    date: new Date(2023, 9, 15),
    item: 'Welcome Dinner',
    location: 'Gion District',
    amount: 120.50,
    category: 'food',
    currency: 'USD'
  },
  {
    id: 'e3',
    date: new Date(2023, 9, 16),
    item: 'Temple Entrance Fees',
    location: 'Kinkaku-ji',
    amount: 15.00,
    category: 'entertainment',
    currency: 'USD'
  },
  {
    id: 'e4',
    date: new Date(2023, 9, 16),
    item: 'Matcha Souvenirs',
    location: 'Nishiki Market',
    amount: 35.00,
    category: 'shopping',
    currency: 'USD'
  }
];
