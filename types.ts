
import React from 'react';

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  CHAT = 'CHAT',
  TRAVEL = 'TRAVEL',
  SCHEDULER = 'SCHEDULER',
  TRANSLATE = 'TRANSLATE',
  EXPENSES = 'EXPENSES',
  SETTINGS = 'SETTINGS'
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface TripSuggestion {
  id: string;
  title: string;
  description: string;
  duration: string;
  priceEstimate: string;
  tags: string[];
  imageUrl: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  attachments?: string[];
  suggestions?: TripSuggestion[];
}

export interface Appointment {
  id: string;
  title: string;
  date: Date;
  durationMinutes: number;
  location?: string;
  type: 'flight' | 'activity' | 'stay' | 'meeting';
  status: 'confirmed' | 'pending' | 'cancelled';
  color: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export interface Trip {
  id: string;
  destination: string;
  dates: string;
  imageUrl: string;
  status: 'upcoming' | 'planning' | 'completed';
  weather?: string;
  flight?: {
    code: string;
    airline: string;
    departureTime: string;
    arrivalTime: string;
    origin: string;
    destination: string;
    gate: string;
    seat: string;
  };
  hotel?: {
    name: string;
    address: string;
    checkIn: string;
    rating: number;
  };
}

export interface SchedulerItem {
  id: string;
  content: string;
  category: 'note' | 'activity' | 'logistics' | 'ai-suggestion';
  timestamp: Date;
  isCompleted: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface Expense {
  id: string;
  date: Date;
  item: string;
  location: string;
  amount: number;
  category: 'food' | 'transport' | 'accommodation' | 'shopping' | 'entertainment' | 'other';
  currency: string;
}
