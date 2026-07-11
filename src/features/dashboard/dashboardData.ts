import type { LucideIcon } from 'lucide-react'
import {
  BadgeDollarSign,
  Banknote,
  Bike,
  CalendarDays,
  ClipboardList,
  PanelLeftClose,
  Store,
  Users,
} from 'lucide-react'
import type { DashboardChartPoint } from '../../components/dashboard'

export type Metric = {
  label: string
  value: string
  trend: string
  icon: LucideIcon
  tone?: 'success' | 'warning' | 'danger'
}

export type StoreEarning = {
  id: string
  name: string
  initials: string
  saleCount: number
  totalAmount: string
  cashOnHand: string
  deliveryCharge: string
  platformEarning: string
  payout: string
  remainingAmount: string
  rating: string
}

export const dashboardMetrics: Metric[] = [
  { label: 'Total Stores', value: '124', trend: '+4%', icon: Store },
  { label: 'Customers', value: '8,942', trend: '+12%', icon: Users },
  { label: 'Active Riders', value: '315', trend: '-2%', icon: Bike, tone: 'danger' },
  { label: 'Orders Today', value: '1,208', trend: '+22%', icon: ClipboardList },
  { label: 'Subscriptions', value: '4,520', trend: '+8%', icon: CalendarDays },
  { label: 'Sales', value: '$42,850', trend: '+15%', icon: BadgeDollarSign },
  { label: 'Earnings', value: '$6,427', trend: '+5%', icon: Banknote },
  { label: 'Pending Payouts', value: '1,840', trend: '12 total', icon: PanelLeftClose, tone: 'warning' },
]

export const orderTrend: DashboardChartPoint[] = [
  { label: 'Mon', value: 840 },
  { label: 'Tue', value: 1020 },
  { label: 'Wed', value: 920 },
  { label: 'Thu', value: 1180 },
  { label: 'Fri', value: 1240 },
  { label: 'Sat', value: 1360 },
  { label: 'Sun', value: 1208 },
]

export const payoutTrend: DashboardChartPoint[] = [
  { label: 'W1', value: 4200 },
  { label: 'W2', value: 3800 },
  { label: 'W3', value: 5100 },
  { label: 'W4', value: 6427 },
]

export const storeEarnings: StoreEarning[] = [
  {
    id: 'STR-00129',
    name: 'Sunshine Milkery',
    initials: 'SM',
    saleCount: 458,
    totalAmount: '$12,450.00',
    cashOnHand: '$1,200.00',
    deliveryCharge: '$850.00',
    platformEarning: '$1,867.50',
    payout: '$9,500.00',
    remainingAmount: '$1,082.50',
    rating: '4.8',
  },
  {
    id: 'STR-00431',
    name: 'Green Field Dairy',
    initials: 'GF',
    saleCount: 212,
    totalAmount: '$5,820.00',
    cashOnHand: '$450.00',
    deliveryCharge: '$420.00',
    platformEarning: '$873.00',
    payout: '$4,200.00',
    remainingAmount: '$747.00',
    rating: '4.5',
  },
  {
    id: 'STR-00912',
    name: 'Pure Farm Fresh',
    initials: 'PF',
    saleCount: 892,
    totalAmount: '$22,140.00',
    cashOnHand: '$2,800.00',
    deliveryCharge: '$1,650.00',
    platformEarning: '$3,321.00',
    payout: '$15,000.00',
    remainingAmount: '$3,819.00',
    rating: '4.9',
  },
  {
    id: 'STR-00105',
    name: 'Blue Cow Co.',
    initials: 'BC',
    saleCount: 124,
    totalAmount: '$3,120.00',
    cashOnHand: '$180.00',
    deliveryCharge: '$240.00',
    platformEarning: '$468.00',
    payout: '$2,200.00',
    remainingAmount: '$452.00',
    rating: '4.2',
  },
  {
    id: 'STR-00744',
    name: 'Organic Meadow',
    initials: 'OM',
    saleCount: 341,
    totalAmount: '$8,900.00',
    cashOnHand: '$610.00',
    deliveryCharge: '$580.00',
    platformEarning: '$1,335.00',
    payout: '$7,000.00',
    remainingAmount: '$565.00',
    rating: '4.7',
  },
]
