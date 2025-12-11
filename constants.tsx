
import React from 'react';
import { Appointment, Message, Trip, SchedulerItem, Expense, User } from './types';
import { Calendar, Globe, Map, Plane, Clock } from 'lucide-react';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Chen',
  avatarUrl: 'https://picsum.photos/id/64/200/200',
  email: 'alex.chen@example.com',
  role: 'user',
  subscription: {
    plan: 'premium',
    status: 'active',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1), // Started 11 months ago
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // Expires in 2 days (48 hours)
    autoRenew: true
  },
  paymentMethods: [
    {
      id: 'pm1',
      type: 'card',
      provider: 'Visa',
      identifier: '•••• 4242',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: 'pm2',
      type: 'ewallet',
      provider: 'Touch \'n Go',
      identifier: '012-345 6789',
      isDefault: false
    }
  ],
  transactions: [
    {
      id: 'tx1',
      date: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      amount: 29.90,
      currency: 'MYR',
      description: 'GogoTrip Premium - Monthly',
      status: 'success'
    },
    {
      id: 'tx2',
      date: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      amount: 29.90,
      currency: 'MYR',
      description: 'GogoTrip Premium - Monthly',
      status: 'success'
    },
    {
      id: 'tx3',
      date: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      amount: 29.90,
      currency: 'MYR',
      description: 'GogoTrip Premium - Monthly',
      status: 'success'
    }
  ]
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
    text: 'Kyoto in November is breathtaking! Based on your preferences, I have created distinct itinerary options for you, ranging from classic heritage sites to hidden culinary gems.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9),
    suggestions: [
      {
        id: 's1',
        title: 'Heritage & History',
        description: 'A deep dive into the Golden Pavilion, Fushimi Inari, and traditional tea ceremonies.',
        duration: '5 Days',
        priceEstimate: 'RM 5,200 - RM 6,500',
        tags: ['Temples', 'Culture', 'Popular'],
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400',
        itinerary: [
          {
            day: 1,
            title: "Arrival & Northern Kyoto",
            items: [
              { time: "09:00 AM", activity: "Kinkaku-ji (Golden Pavilion)", description: "Start early to beat the crowds at this iconic Zen temple." },
              { time: "11:30 AM", activity: "Ryoan-ji Rock Garden", description: "Contemplate the famous dry landscape garden." },
              { time: "01:00 PM", activity: "Lunch at Tofu Restaurant", description: "Try Yudofu (boiled tofu), a local specialty." }
            ]
          },
          {
            day: 2,
            title: "Eastern Kyoto Traditions",
            items: [
              { time: "08:00 AM", activity: "Fushimi Inari Taisha", description: "Hike through the thousands of vermilion torii gates." },
              { time: "02:00 PM", activity: "Kiyomizu-dera", description: "Visit the temple with the massive wooden stage." },
              { time: "06:00 PM", activity: "Gion District Walk", description: "Spot Geishas and enjoy traditional architecture." }
            ]
          },
          {
            day: 3,
            title: "Arashiyama Bamboo Forest",
            items: [
              { time: "08:30 AM", activity: "Bamboo Grove", description: "Walk through the towering bamboo stalks." },
              { time: "10:30 AM", activity: "Tenryu-ji Temple", description: "World Heritage site with a stunning garden." },
              { time: "01:00 PM", activity: "Monkey Park Iwatayama", description: "Hike up to see wild monkeys and a view of the city." }
            ]
          }
        ]
      },
      {
        id: 's2',
        title: 'Autumn Nature Walk',
        description: 'Focus on Arashiyama Bamboo Grove, scenic train rides, and hiking in Kurama.',
        duration: '5 Days',
        priceEstimate: 'RM 4,000 - RM 4,800',
        tags: ['Nature', 'Hiking', 'Scenic'],
        imageUrl: 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&q=80&w=400',
        itinerary: [
          {
            day: 1,
            title: "Kurama to Kibune Hike",
            items: [
              { time: "09:00 AM", activity: "Kurama-dera Temple", description: "Take the train to the mountains north of Kyoto." },
              { time: "11:00 AM", activity: "Mountain Hike", description: "A mystical 2-hour hike over the ridge." },
              { time: "01:30 PM", activity: "Kibune Shrine", description: "Famous for its steps lined with red lanterns." }
            ]
          },
          {
            day: 2,
            title: "Sagano Scenic Railway",
            items: [
              { time: "10:00 AM", activity: "Romantic Train Ride", description: "View the autumn leaves along the Hozu River." },
              { time: "12:00 PM", activity: "Hozugawa River Boat Ride", description: "Return by traditional boat." }
            ]
          }
        ]
      },
      {
        id: 's3',
        title: 'Culinary Journey',
        description: 'Explore Nishiki Market, kaiseki dining experiences, and sake breweries in Fushimi.',
        duration: '4 Days',
        priceEstimate: 'RM 5,500 - RM 7,000',
        tags: ['Foodie', 'Gastronomy', 'Luxury'],
        imageUrl: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&q=80&w=400',
        itinerary: [
           {
            day: 1,
            title: "Kitchen of Kyoto",
            items: [
              { time: "10:00 AM", activity: "Nishiki Market Tour", description: "Sample pickles, seafood, and sweets." },
              { time: "01:00 PM", activity: "Cooking Class", description: "Learn to make authentic home-style obanzai." }
            ]
          }
        ]
      },
      {
        id: 's4',
        title: 'Zen & Meditation',
        description: 'Stay in a temple lodging (shukubo), practice zazen meditation, and visit dry rock gardens.',
        duration: '3 Days',
        priceEstimate: 'RM 3,200 - RM 4,000',
        tags: ['Wellness', 'Relaxing', 'Spiritual'],
        imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d9012356ee?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 's5',
        title: 'Nara Day Trip Extension',
        description: 'A guided side-trip to Nara Park to see the deer and the Great Buddha Hall.',
        duration: '1 Day',
        priceEstimate: 'RM 800 - RM 1,200',
        tags: ['Wildlife', 'Day Trip', 'Family'],
        imageUrl: 'https://images.unsplash.com/photo-1558862107-d49ef2a04d72?auto=format&fit=crop&q=80&w=400'
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
    amount: 190.00,
    category: 'transport',
    currency: 'MYR'
  },
  {
    id: 'e2',
    date: new Date(2023, 9, 15),
    item: 'Welcome Dinner',
    location: 'Gion District',
    amount: 540.00,
    category: 'food',
    currency: 'MYR'
  },
  {
    id: 'e3',
    date: new Date(2023, 9, 16),
    item: 'Temple Entrance Fees',
    location: 'Kinkaku-ji',
    amount: 65.00,
    category: 'entertainment',
    currency: 'MYR'
  },
  {
    id: 'e4',
    date: new Date(2023, 9, 16),
    item: 'Matcha Souvenirs',
    location: 'Nishiki Market',
    amount: 150.00,
    category: 'shopping',
    currency: 'MYR'
  }
];