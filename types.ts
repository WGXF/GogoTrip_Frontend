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
  BILLING = 'BILLING',
  RECEIPT = 'receipt',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',        // 🔥 新增：公告列表
  ANNOUNCEMENT_DETAIL = 'ANNOUNCEMENT_DETAIL'  // 🔥 新增：公告详情
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
  SETTINGS = 'SETTINGS'
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
  provider: string;
  identifier: string;
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
  role?: 'user' | 'admin' | 'super_admin' | 'Administrator'| 'Admin';
  email?: string;
  authProvider?: 'google' | 'email';
  // 🆕 Google Account Linking
  hasGoogleLinked?: boolean;  // True if Google account is linked (has google_id)
  hasGoogleCalendar?: boolean;  // True if Google Calendar tokens exist
  subscription?: {
    status: 'active' | 'inactive' | 'expired';
    endDate: string;
    plan: string;
  };
  paymentMethods?: PaymentMethod[];
  transactions?: Transaction[];
  passwordHash?: string;
  lastLogin?: string;
  status?: 'Active' | 'Inactive' | 'suspended' | 'pending_verification';
  isPremium?: boolean;
  emailNotifications: boolean;
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
  itinerary?: ItineraryDay[] | null;
  reviews?: string[];
  fullAddress?: string;
  rating?: number | string;
}

export interface FoodRecommendation {
  id?: number | string;
  name: string;
  cuisine_type?: string;
  address: string;
  rating?: number;
  price_level?: number | string;
  photo_reference?: string;
  place_id?: number;
  google_place_id?: string;
  is_open_now?: boolean;
  dietary_tags?: string[];
  description?: string;
  signature_dishes?: string[];
  tips?: string;
  distance?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  attachments?: string[];
  suggestions?: TripSuggestion[];
  dailyPlans?: any[]; // DailyPlanData array for multi-day itineraries
  foodRecommendations?: FoodRecommendation[]; // Food wizard results
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
  total_expenses: number;
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

// =============================================
// 🔔 Notification System Types - 新增
// =============================================

export interface Notification {
  message: React.ReactNode;
  id: string | number;
  title?: string;
  text: string;
  time: string;
  unread: boolean;
  type?: 'info' | 'success' | 'warning' | 'alert' | 'system';
  icon?: string;
  tabId?: number;
  hasTab?: boolean;
  actionUrl?: string;
  createdAt?: string;
  isBroadcast?: boolean;
}

export interface NotificationTab {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  contentType: 'markdown' | 'html' | 'plain';
  coverImage?: string;
  bannerImage?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaStyle: 'primary' | 'secondary' | 'danger';
  targetAudience: 'all' | 'premium' | 'free' | 'new_users';
  category: 'announcement' | 'promotion' | 'update' | 'alert';
  priority: number;
  status: 'draft' | 'active' | 'scheduled' | 'archived';
  startAt?: string;
  endAt?: string;
  views: number;
  ctaClicks: number;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  creatorName?: string;
}

export interface NotificationStats {
  totalTabs: number;
  activeTabs: number;
  totalNotifications: number;
  recentNotifications: number;
  topTabs: { id: number; title: string; views: number }[];
}

// =============================================
// 🔥 更新 NavItem 类型
// =============================================

export type NavItem = 
  | 'Home' 
  | 'Info Blog'
  | 'Advertisement'
  | 'Login Hero'
  | 'Notifications'  // 🔥 新增：通知管理
  | 'User' 
  | 'Email Verification' 
  | 'Place' 
  | 'Trip' 
  | 'Trip Item' 
  | 'Expense' 
  | 'Calendar Event'
  | 'Settings'
  | 'Subscription'
  | 'Support Tickets'    // 🔥 新增
  | 'Admin Messages'
  | 'Admin Chat'
  | 'Voucher Managment'
  | 'Inquiries' 
  | 'Plan Managment'
  | 'Blog Moderation'    // 📝 Blog 审核
  | 'Blog Reports';      // 📝 Blog 举报管理

// =============================================
// 📝 Blog System Types
// =============================================

export interface BlogAuthor {
  id: number;
  name: string;
  avatarUrl?: string;
}

export interface Blog {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'hidden';
  rejectionReason?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface BlogComment {
  id: number;
  blogId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: number;
  status: 'visible' | 'hidden' | 'deleted';
  repliesCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogSubscription {
  id: number;
  subscriberId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  createdAt?: string;
}

export interface BlogReport {
  id: number;
  blogId: number;
  blogTitle: string;
  blogAuthorId?: number;
  blogAuthorName?: string;
  reporterId: number;
  reporterName: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: number;
  reviewerName?: string;
  adminNotes?: string;
  actionTaken?: 'none' | 'warning' | 'hidden' | 'deleted';
  createdAt?: string;
  reviewedAt?: string;
}

export interface BlogStats {
  total: number;
  published: number;
  pending: number;
  draft: number;
  rejected: number;
}

export interface BlogReportStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
}

export interface BlogPagination {
  page: number;
  perPage: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BlogCategory {
  name: string;
  count: number;
}
