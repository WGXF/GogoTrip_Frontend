
import React from 'react';

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  CHAT = 'CHAT',
  TRAVEL = 'TRAVEL',
  SCHEDULER = 'SCHEDULER',
  TRANSLATE = 'TRANSLATE',
  EXPENSES = 'EXPENSES',
  SETTINGS = 'SETTINGS',
  BILLING = 'BILLING'
}

// Admin View States
export enum AdminViewState {
  DASHBOARD = 'DASHBOARD',
  USERS = 'USERS',
  TRIPS = 'TRIPS',
  AI_CONFIG = 'AI_CONFIG',
  SPONSORS = 'SPONSORS',
  ACCOUNT = 'ACCOUNT',
  INFO_WEBSITE = 'INFO_WEBSITE',
  SETTINGS = 'SETTINGS' // System settings
}

export interface Subscription {
  plan: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'ewallet' | 'banking';
  provider: string; // 'Visa', 'TNG', 'Maybank2u'
  identifier: string; // Last 4 digits or phone number
  expiry?: string;
  isDefault: boolean;
  nickname?: string;
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
  invoiceUrl?: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role?: 'user' | 'admin' | 'super_admin';
  email?: string;
  authProvider?: 'google' | 'email'; // Track how the user registered
  subscription?: {
    status: 'active' | 'inactive' | 'expired';
    endDate: string; // ISO Date string
    plan: string;
  };
  paymentMethods?: PaymentMethod[];
  transactions?: Transaction[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'premium' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  totalTrips: number;
}

export interface Sponsor {
  id: string;
  name: string;
  industry: string;
  status: 'Active' | 'Paused' | 'Pending';
  activeAds: number;
  totalSpent: string;
  contact: string;
}

export interface AdminTrip {
  id: string;
  user: string;
  destination: string;
  dates: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'planning';
  budget: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft';
  views: number;
  date: string;
}

export interface SystemStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface ItineraryItem {
  time: string;
  activity: string;
  description?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  items: ItineraryItem[];
}

export interface TripSuggestion {
  id: string;
  title: string;
  description: string;
  duration: string;
  priceEstimate: string;
  tags: string[];
  imageUrl: string;
  itinerary?: ItineraryDay[];
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

export interface Notification {
  id: string | number;
  text: string;
  time: string;
  unread: boolean;
  type?: 'system' | 'alert' | 'info';
}
