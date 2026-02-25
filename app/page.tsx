'use client'

import { useState, useCallback, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import {
  getDocuments, uploadAndTrainDocument, deleteDocuments, validateFile,
  useRAGKnowledgeBase, type RAGDocument
} from '@/lib/ragKnowledgeBase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Home, MessageSquare, Package, FileText, Users, Send, BarChart3, Settings, Search, Bell,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Bot, User, Plus, Edit, Trash2,
  X, Check, Loader2, Eye, Filter, ArrowUp, ArrowDown, Clock, ShoppingCart, DollarSign,
  AlertCircle, Info, Menu, ChevronDown, RefreshCw, Download, Mail, Sparkles, Hash, Star,
  Upload, File, Database
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell
} from 'recharts'

// ============ CONSTANTS ============
const LINE_SALES_BOT_ID = '699a8f14e6195f9129d6b924'
const ADMIN_CHAT_AGENT_ID = '6999b71afdb12766dbc0177e'
const RAG_ID = '699a8efd3dc9e9e5282826a4'

// ============ THEME COLORS ============
const theme = {
  bg: 'hsl(160,30%,4%)',
  card: 'hsl(160,30%,6%)',
  cardHover: 'hsl(160,30%,8%)',
  fg: 'hsl(160,20%,95%)',
  accent: 'hsl(160,70%,40%)',
  accentFg: 'hsl(160,20%,98%)',
  muted: 'hsl(160,22%,15%)',
  mutedFg: 'hsl(160,15%,60%)',
  border: 'hsl(160,22%,15%)',
  input: 'hsl(160,22%,20%)',
  secondary: 'hsl(160,25%,12%)',
  destructive: 'hsl(0,63%,31%)',
  sidebarBg: 'hsl(160,30%,5%)',
  sidebarBorder: 'hsl(160,22%,12%)',
  chart1: 'hsl(160,75%,50%)',
  chart2: 'hsl(142,65%,45%)',
  chart3: 'hsl(180,55%,50%)',
  chart4: 'hsl(120,50%,50%)',
  chart5: 'hsl(200,50%,55%)',
}

// ============ TYPES ============
type ScreenType = 'dashboard' | 'conversations' | 'products' | 'orders' | 'users' | 'broadcast' | 'analytics' | 'channels'

interface MockUser {
  id: string; name: string; avatar: string; lastMessage: string; timestamp: string
  unread: number; botActive: boolean; totalOrders: number; totalSpent: number
  lastActive: string; segments: string[]; channelId: string
}

interface MockMessage {
  id: string; sender: 'user' | 'bot' | 'admin'; text: string; timestamp: string
  intent?: string; products?: { name: string; price: string; availability: string }[]
}

interface MockProduct {
  id: string; name: string; description: string; price: number; category: string
  stock: number; imageUrl: string
}

interface MockOrder {
  id: string; userId: string; userName: string; products: string; total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'; date: string
}

interface MockBroadcast {
  id: string; date: string; audience: string; message: string; sentCount: number; status: string
}

interface StatusMsg { text: string; type: 'success' | 'error' | 'info' }

type PlatformType = 'line' | 'facebook' | 'tiktok' | 'lazada'

interface PlatformConfig {
  platform: PlatformType
  label: string
  icon: string
  color: string
  fields: { key: string; label: string; type: 'text' | 'password'; placeholder: string; required: boolean; helpText?: string }[]
}

interface ConnectedChannel {
  id: string
  platform: PlatformType
  name: string
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, string>
  connectedAt: string
  lastActivity?: string
  messagesCount?: number
}

// ============ MOCK DATA ============
const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Somchai W.', avatar: 'SW', lastMessage: 'Do you have wireless earbuds?', timestamp: '2 min ago', unread: 3, botActive: true, totalOrders: 8, totalSpent: 15400, lastActive: '2 min ago', segments: ['VIP', 'Active'], channelId: 'ch1' },
  { id: 'u2', name: 'Nattaporn K.', avatar: 'NK', lastMessage: 'I want to track my order #1042', timestamp: '5 min ago', unread: 1, botActive: false, totalOrders: 3, totalSpent: 4200, lastActive: '5 min ago', segments: ['Active'], channelId: 'ch1' },
  { id: 'u3', name: 'Priya S.', avatar: 'PS', lastMessage: 'Thanks for the recommendation!', timestamp: '15 min ago', unread: 0, botActive: true, totalOrders: 12, totalSpent: 28900, lastActive: '15 min ago', segments: ['VIP', 'Active'], channelId: 'ch2' },
  { id: 'u4', name: 'Tanawat R.', avatar: 'TR', lastMessage: 'Can I return the scarf?', timestamp: '1 hr ago', unread: 2, botActive: false, totalOrders: 2, totalSpent: 1800, lastActive: '1 hr ago', segments: ['New'], channelId: 'ch3' },
  { id: 'u5', name: 'Kannika M.', avatar: 'KM', lastMessage: 'What flavors of tea do you have?', timestamp: '2 hr ago', unread: 0, botActive: true, totalOrders: 5, totalSpent: 7600, lastActive: '2 hr ago', segments: ['Active'], channelId: 'ch1' },
  { id: 'u6', name: 'Araya P.', avatar: 'AP', lastMessage: 'Is the face cream suitable for sensitive skin?', timestamp: '3 hr ago', unread: 0, botActive: true, totalOrders: 1, totalSpent: 890, lastActive: '3 hr ago', segments: ['New'], channelId: 'ch2' },
  { id: 'u7', name: 'Wichai L.', avatar: 'WL', lastMessage: 'I need a laptop stand for my desk', timestamp: '5 hr ago', unread: 0, botActive: true, totalOrders: 15, totalSpent: 42300, lastActive: '5 hr ago', segments: ['VIP'], channelId: 'ch3' },
  { id: 'u8', name: 'Supatra N.', avatar: 'SN', lastMessage: 'Do you ship to Chiang Mai?', timestamp: '1 day ago', unread: 0, botActive: true, totalOrders: 0, totalSpent: 0, lastActive: '1 day ago', segments: ['Inactive'], channelId: 'ch1' },
]

const mockConversations: Record<string, MockMessage[]> = {
  u1: [
    { id: 'm1', sender: 'user', text: 'Hi! Do you have wireless earbuds?', timestamp: '10:30 AM' },
    { id: 'm2', sender: 'bot', text: 'Hello Somchai! Yes, we have the Premium Wireless Earbuds available for ฿1,290. They feature noise cancellation and 24-hour battery life. Would you like to know more or place an order?', timestamp: '10:30 AM', intent: 'inquiry', products: [{ name: 'Wireless Earbuds', price: '฿1,290', availability: 'In Stock' }] },
    { id: 'm3', sender: 'user', text: 'What colors are available?', timestamp: '10:32 AM' },
    { id: 'm4', sender: 'bot', text: 'The Wireless Earbuds come in Black, White, and Midnight Green. All colors are currently in stock. Shall I help you place an order?', timestamp: '10:32 AM', intent: 'inquiry' },
  ],
  u2: [
    { id: 'm1', sender: 'user', text: 'I want to track my order #1042', timestamp: '10:25 AM' },
    { id: 'm2', sender: 'bot', text: 'Let me look up order #1042 for you. Your order containing a Silk Scarf was shipped yesterday and is expected to arrive within 2-3 business days.', timestamp: '10:25 AM', intent: 'faq' },
    { id: 'm3', sender: 'user', text: 'But I ordered 2 items, not 1', timestamp: '10:27 AM' },
    { id: 'm4', sender: 'admin', text: 'Hi Nattaporn, let me check that for you. I see the second item (Phone Case) is being prepared separately and will ship today.', timestamp: '10:35 AM' },
  ],
}

const mockProducts: MockProduct[] = [
  { id: 'p1', name: 'Wireless Earbuds', description: 'Premium noise-cancelling earbuds with 24hr battery', price: 1290, category: 'Electronics', stock: 45, imageUrl: '' },
  { id: 'p2', name: 'Smart Watch Pro', description: 'Fitness tracking with heart rate monitor', price: 3490, category: 'Electronics', stock: 12, imageUrl: '' },
  { id: 'p3', name: 'Silk Scarf', description: 'Handwoven Thai silk scarf, multiple patterns', price: 890, category: 'Fashion', stock: 28, imageUrl: '' },
  { id: 'p4', name: 'Organic Face Cream', description: 'Natural ingredients, suitable for all skin types', price: 650, category: 'Beauty', stock: 3, imageUrl: '' },
  { id: 'p5', name: 'Thai Tea Gift Set', description: 'Premium oolong and jasmine tea collection', price: 420, category: 'Food', stock: 67, imageUrl: '' },
  { id: 'p6', name: 'Laptop Stand', description: 'Adjustable aluminum stand with cable management', price: 790, category: 'Electronics', stock: 0, imageUrl: '' },
  { id: 'p7', name: 'Phone Case', description: 'Shockproof case with card holder', price: 350, category: 'Electronics', stock: 120, imageUrl: '' },
  { id: 'p8', name: 'Perfume Gift Set', description: 'Luxury fragrance collection, 3 scents', price: 2100, category: 'Beauty', stock: 8, imageUrl: '' },
]

const mockOrders: MockOrder[] = [
  { id: '#1048', userId: 'u1', userName: 'Somchai W.', products: 'Wireless Earbuds x1', total: 1290, status: 'pending', date: '2026-02-22' },
  { id: '#1047', userId: 'u3', userName: 'Priya S.', products: 'Smart Watch Pro x1, Phone Case x2', total: 4190, status: 'pending', date: '2026-02-22' },
  { id: '#1046', userId: 'u7', userName: 'Wichai L.', products: 'Laptop Stand x2', total: 1580, status: 'pending', date: '2026-02-22' },
  { id: '#1045', userId: 'u5', userName: 'Kannika M.', products: 'Thai Tea Gift Set x3', total: 1260, status: 'confirmed', date: '2026-02-21' },
  { id: '#1044', userId: 'u1', userName: 'Somchai W.', products: 'Perfume Gift Set x1', total: 2100, status: 'confirmed', date: '2026-02-21' },
  { id: '#1043', userId: 'u3', userName: 'Priya S.', products: 'Silk Scarf x2', total: 1780, status: 'shipped', date: '2026-02-20' },
  { id: '#1042', userId: 'u2', userName: 'Nattaporn K.', products: 'Silk Scarf x1, Phone Case x1', total: 1240, status: 'shipped', date: '2026-02-19' },
  { id: '#1041', userId: 'u4', userName: 'Tanawat R.', products: 'Organic Face Cream x1', total: 650, status: 'delivered', date: '2026-02-18' },
  { id: '#1040', userId: 'u7', userName: 'Wichai L.', products: 'Smart Watch Pro x1', total: 3490, status: 'delivered', date: '2026-02-17' },
  { id: '#1039', userId: 'u5', userName: 'Kannika M.', products: 'Wireless Earbuds x1', total: 1290, status: 'delivered', date: '2026-02-16' },
  { id: '#1038', userId: 'u3', userName: 'Priya S.', products: 'Perfume Gift Set x1, Thai Tea Gift Set x2', total: 2940, status: 'delivered', date: '2026-02-15' },
  { id: '#1037', userId: 'u1', userName: 'Somchai W.', products: 'Phone Case x3', total: 1050, status: 'pending', date: '2026-02-22' },
]

const mockBroadcasts: MockBroadcast[] = [
  { id: 'b1', date: '2026-02-20', audience: 'All Users', message: 'Weekend Flash Sale! 20% off all electronics. Use code WEEKEND20', sentCount: 1247, status: 'Sent' },
  { id: 'b2', date: '2026-02-15', audience: 'VIP', message: 'Exclusive VIP preview: New spring collection arriving next week!', sentCount: 89, status: 'Sent' },
  { id: 'b3', date: '2026-02-10', audience: 'Active', message: 'Free shipping on orders over ฿1,000 this week only!', sentCount: 634, status: 'Sent' },
  { id: 'b4', date: '2026-02-05', audience: 'New Users', message: 'Welcome! Here is your 15% first-order discount code: HELLO15', sentCount: 156, status: 'Sent' },
]

const revenueData = Array.from({ length: 30 }, (_, i) => ({
  date: `Feb ${i + 1}`,
  revenue: Math.floor(Math.random() * 30000) + 15000,
  orders: Math.floor(Math.random() * 20) + 5,
}))

const conversationVolumeData = Array.from({ length: 30 }, (_, i) => ({
  date: `Feb ${i + 1}`,
  messages: Math.floor(Math.random() * 150) + 50,
}))

const topProductsData = [
  { name: 'Wireless Earbuds', sales: 142 },
  { name: 'Smart Watch Pro', sales: 98 },
  { name: 'Phone Case', sales: 87 },
  { name: 'Thai Tea Gift Set', sales: 76 },
  { name: 'Silk Scarf', sales: 64 },
]

const userGrowthData = Array.from({ length: 30 }, (_, i) => ({
  date: `Feb ${i + 1}`,
  users: 1200 + Math.floor(Math.random() * 5) * (i + 1),
}))

const weeklyRevenueData = revenueData.slice(0, 7)

// ============ PLATFORM CONFIGS ============
const platformConfigs: PlatformConfig[] = [
  {
    platform: 'line', label: 'LINE Official Account', icon: 'LINE', color: '#06C755',
    fields: [
      { key: 'channelId', label: 'Channel ID', type: 'text', placeholder: 'e.g. 1234567890', required: true, helpText: 'Found in LINE Developers Console > Basic Settings' },
      { key: 'channelSecret', label: 'Channel Secret', type: 'password', placeholder: 'e.g. a1b2c3d4e5f6...', required: true, helpText: 'Found in LINE Developers Console > Basic Settings' },
      { key: 'channelAccessToken', label: 'Channel Access Token', type: 'password', placeholder: 'Long-lived channel access token', required: true, helpText: 'Issue from LINE Developers Console > Messaging API' },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://your-domain.com/api/webhook/line', required: true, helpText: 'Set this URL in LINE Developers Console > Messaging API > Webhook settings' },
    ],
  },
  {
    platform: 'facebook', label: 'Facebook Messenger', icon: 'FB', color: '#1877F2',
    fields: [
      { key: 'pageId', label: 'Page ID', type: 'text', placeholder: 'e.g. 123456789012345', required: true, helpText: 'Found in Facebook Page Settings > Page ID' },
      { key: 'appId', label: 'App ID', type: 'text', placeholder: 'e.g. 123456789012345', required: true, helpText: 'Found in Meta for Developers > Settings > Basic' },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'Your app secret key', required: true, helpText: 'Found in Meta for Developers > Settings > Basic' },
      { key: 'pageAccessToken', label: 'Page Access Token', type: 'password', placeholder: 'Long-lived page access token', required: true, helpText: 'Generate from Meta for Developers > Messenger > Settings' },
      { key: 'verifyToken', label: 'Webhook Verify Token', type: 'text', placeholder: 'Custom verify token string', required: true, helpText: 'A custom string you define for webhook verification' },
    ],
  },
  {
    platform: 'tiktok', label: 'TikTok Shop', icon: 'TT', color: '#000000',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', placeholder: 'TikTok Shop App ID', required: true, helpText: 'Found in TikTok Shop Partner Center > App Management' },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'TikTok Shop App Secret', required: true, helpText: 'Found in TikTok Shop Partner Center > App Management' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Shop access token', required: true, helpText: 'Generated via TikTok Shop OAuth flow' },
      { key: 'shopId', label: 'Shop ID', type: 'text', placeholder: 'e.g. 7123456789012345678', required: false, helpText: 'Your TikTok Shop ID (optional for multi-shop setup)' },
    ],
  },
  {
    platform: 'lazada', label: 'Lazada Seller Center', icon: 'LZ', color: '#0F146D',
    fields: [
      { key: 'appKey', label: 'App Key', type: 'text', placeholder: 'Lazada Open Platform App Key', required: true, helpText: 'Found in Lazada Open Platform > App Management' },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'Lazada Open Platform App Secret', required: true, helpText: 'Found in Lazada Open Platform > App Management' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Seller access token', required: true, helpText: 'Generated via Lazada OAuth authorization flow' },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'e.g. TH, MY, SG, ID, PH, VN', required: true, helpText: 'Country code for your Lazada seller account' },
      { key: 'sellerId', label: 'Seller ID', type: 'text', placeholder: 'e.g. 200012345678', required: false, helpText: 'Your Lazada Seller Center ID' },
    ],
  },
]

const initialChannels: ConnectedChannel[] = [
  { id: 'ch1', platform: 'line', name: 'Main Store OA', status: 'connected', config: { channelId: '1656789012', channelSecret: '********', channelAccessToken: '********', webhookUrl: 'https://api.example.com/webhook/line/main' }, connectedAt: '2026-01-15', lastActivity: '2 min ago', messagesCount: 3421 },
  { id: 'ch2', platform: 'line', name: 'Promo Channel', status: 'connected', config: { channelId: '1656789099', channelSecret: '********', channelAccessToken: '********', webhookUrl: 'https://api.example.com/webhook/line/promo' }, connectedAt: '2026-02-01', lastActivity: '1 hr ago', messagesCount: 872 },
  { id: 'ch3', platform: 'facebook', name: 'Shop Facebook Page', status: 'disconnected', config: { pageId: '123456789012345', appId: '987654321098765', appSecret: '********', pageAccessToken: '********', verifyToken: 'myverifytoken123' }, connectedAt: '2026-02-10', lastActivity: '3 days ago', messagesCount: 156 },
]

// ============ MAIN COMPONENT ============
export default function Page() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [statusMessage, setStatusMessage] = useState<StatusMsg | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Conversations state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [botPausedMap, setBotPausedMap] = useState<Record<string, boolean>>({ u2: true, u4: true })
  const [conversationMessages, setConversationMessages] = useState<Record<string, MockMessage[]>>(mockConversations)
  const [messageInput, setMessageInput] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const [draftReply, setDraftReply] = useState('')
  const [agentSuggestion, setAgentSuggestion] = useState<any>(null)
  const [convFilter, setConvFilter] = useState('all')

  // Products state
  const [products, setProducts] = useState<MockProduct[]>(mockProducts)
  const [productDialog, setProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MockProduct | null>(null)
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: 'Electronics', stock: '', imageUrl: '' })

  // Orders state
  const [orders, setOrders] = useState<MockOrder[]>(mockOrders)
  const [orderFilter, setOrderFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null)

  // Users state
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null)

  // Broadcast state
  const [broadcastAudience, setBroadcastAudience] = useState('all')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastSegments, setBroadcastSegments] = useState<string[]>([])
  const [broadcasts, setBroadcasts] = useState<MockBroadcast[]>(mockBroadcasts)

  // Analytics state
  const [analyticsRange, setAnalyticsRange] = useState('month')
  const [exportSuccess, setExportSuccess] = useState(false)

  // Knowledge Base state
  const { documents: kbDocuments, loading: kbLoading, error: kbError, fetchDocuments: kbFetchDocuments, uploadDocument: kbUploadDocument, removeDocuments: kbRemoveDocuments } = useRAGKnowledgeBase()
  const [kbUploading, setKbUploading] = useState(false)

  // Load KB documents on mount
  useEffect(() => {
    kbFetchDocuments(RAG_ID)
  }, [])

  const handleKBFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validation = validateFile(file)
    if (!validation.valid) {
      showStatus(validation.error || 'Invalid file type', 'error')
      return
    }
    setKbUploading(true)
    const result = await kbUploadDocument(RAG_ID, file)
    if (result.success) {
      showStatus('Document uploaded and training started. The AI bot will use this data to answer customer questions.')
    } else {
      showStatus(result.error || 'Upload failed', 'error')
    }
    setKbUploading(false)
    e.target.value = ''
  }

  const handleKBDeleteDoc = async (fileName: string) => {
    const result = await kbRemoveDocuments(RAG_ID, [fileName])
    if (result.success) {
      showStatus('Document removed from knowledge base')
    } else {
      showStatus(result.error || 'Delete failed', 'error')
    }
  }

  const showStatus = useCallback((text: string, type: StatusMsg['type'] = 'success') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }, [])

  // ============ AGENT HANDLERS ============
  const handleSimulateMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return
    setAgentLoading(true)
    const userMsg: MockMessage = {
      id: `m${Date.now()}`, sender: 'user', text: messageInput, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setConversationMessages(prev => ({
      ...prev,
      [selectedUserId]: [...(prev[selectedUserId] || []), userMsg]
    }))
    setMessageInput('')

    try {
      const result = await callAIAgent(messageInput, LINE_SALES_BOT_ID)
      if (result.success && result.response?.status === 'success') {
        const data = result.response.result
        const botMsg: MockMessage = {
          id: `m${Date.now() + 1}`, sender: 'bot',
          text: data?.response_text || result.response?.message || 'I can help you with that!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intent: data?.intent,
          products: Array.isArray(data?.products_mentioned) ? data.products_mentioned : undefined
        }
        setConversationMessages(prev => ({
          ...prev,
          [selectedUserId]: [...(prev[selectedUserId] || []), botMsg]
        }))
        if (data?.order_collected) {
          showStatus(`Order collected: ${data?.order_summary || 'New order pending confirmation'}`, 'success')
        }
      } else {
        showStatus(result.response?.message || 'Failed to get bot response', 'error')
      }
    } catch {
      showStatus('Error communicating with bot agent', 'error')
    }
    setAgentLoading(false)
  }

  const handleGetAISuggestion = async () => {
    if (!selectedUserId) return
    setAgentLoading(true)
    setAgentSuggestion(null)
    const msgs = conversationMessages[selectedUserId] || []
    const context = msgs.map(m => `${m.sender}: ${m.text}`).join('\n')
    const user = mockUsers.find(u => u.id === selectedUserId)

    try {
      const result = await callAIAgent(
        `Customer: ${user?.name || 'Unknown'}. Conversation history:\n${context}\n\nPlease suggest a reply draft for the admin.`,
        ADMIN_CHAT_AGENT_ID
      )
      if (result.success && result.response?.status === 'success') {
        const data = result.response.result
        setAgentSuggestion(data)
        setDraftReply(data?.draft_reply || result.response?.message || '')
      } else {
        showStatus(result.response?.message || 'Failed to get suggestion', 'error')
      }
    } catch {
      showStatus('Error communicating with admin agent', 'error')
    }
    setAgentLoading(false)
  }

  const handleSendReply = () => {
    if (!draftReply.trim() || !selectedUserId) return
    const adminMsg: MockMessage = {
      id: `m${Date.now()}`, sender: 'admin', text: draftReply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setConversationMessages(prev => ({
      ...prev,
      [selectedUserId]: [...(prev[selectedUserId] || []), adminMsg]
    }))
    setDraftReply('')
    setAgentSuggestion(null)
    showStatus('Reply sent successfully')
  }

  const toggleBotPause = (userId: string) => {
    setBotPausedMap(prev => ({ ...prev, [userId]: !prev[userId] }))
    showStatus(botPausedMap[userId] ? 'Bot resumed for this user' : 'Bot paused - you can now reply manually')
  }

  // ============ PRODUCT HANDLERS ============
  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.price) return
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) } : p))
      showStatus('Product updated')
    } else {
      const newProduct: MockProduct = {
        id: `p${Date.now()}`, ...productForm, price: Number(productForm.price), stock: Number(productForm.stock)
      }
      setProducts(prev => [...prev, newProduct])
      showStatus('Product added')
    }
    setProductDialog(false)
    setEditingProduct(null)
    setProductForm({ name: '', description: '', price: '', category: 'Electronics', stock: '', imageUrl: '' })
  }

  const handleEditProduct = (product: MockProduct) => {
    setEditingProduct(product)
    setProductForm({ name: product.name, description: product.description, price: String(product.price), category: product.category, stock: String(product.stock), imageUrl: product.imageUrl })
    setProductDialog(true)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    showStatus('Product deleted')
  }

  // ============ ORDER HANDLERS ============
  const handleOrderAction = (orderId: string, action: 'confirmed' | 'shipped' | 'delivered') => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: action } : o))
    setSelectedOrder(null)
    showStatus(`Order ${orderId} ${action}`)
  }

  const handleRejectOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
    setSelectedOrder(null)
    showStatus(`Order ${orderId} rejected`)
  }

  // Filtered data
  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter)
  const filteredConvUsers = mockUsers.filter(u => {
    if (convFilter === 'active') return !botPausedMap[u.id]
    if (convFilter === 'paused') return botPausedMap[u.id]
    if (convFilter === 'unread') return u.unread > 0
    return true
  })
  const selectedUser = mockUsers.find(u => u.id === selectedUserId)
  const selectedMessages = selectedUserId ? (conversationMessages[selectedUserId] || []) : []
  const pendingOrders = orders.filter(o => o.status === 'pending')

  // ============ NAVIGATION ============
  const navItems: { key: ScreenType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { key: 'conversations', label: 'Conversations', icon: <MessageSquare size={20} /> },
    { key: 'products', label: 'Products', icon: <Package size={20} /> },
    { key: 'orders', label: 'Orders', icon: <FileText size={20} /> },
    { key: 'users', label: 'Users', icon: <Users size={20} /> },
    { key: 'broadcast', label: 'Broadcast', icon: <Send size={20} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  ]

  const stockBadge = (stock: number) => {
    if (stock === 0) return <Badge style={{ backgroundColor: theme.destructive, color: '#fff' }}>Out of Stock</Badge>
    if (stock <= 5) return <Badge style={{ backgroundColor: '#b45309', color: '#fff' }}>Low Stock</Badge>
    return <Badge style={{ backgroundColor: theme.accent, color: theme.bg }}>In Stock</Badge>
  }

  const statusBadgeOrder = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#d97706', confirmed: theme.accent, shipped: theme.chart5, delivered: theme.chart2
    }
    return <Badge style={{ backgroundColor: colors[status] || theme.muted, color: '#fff' }}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  // ============ CHART CONFIGS ============
  const revenueChartConfig = { revenue: { label: 'Revenue', color: theme.chart1 } }
  const ordersChartConfig = { orders: { label: 'Orders', color: theme.chart2 } }
  const conversationsChartConfig = { messages: { label: 'Messages', color: theme.chart3 } }
  const usersChartConfig = { users: { label: 'Users', color: theme.chart5 } }

  // ============ RENDER ============
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.bg, color: theme.fg, fontFamily: "'Work Sans', 'Segoe UI', sans-serif", letterSpacing: '-0.01em', lineHeight: 1.5 }}>
      {/* Status Message */}
      {statusMessage && (
        <div className="fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2" style={{
          backgroundColor: statusMessage.type === 'success' ? theme.accent : statusMessage.type === 'error' ? theme.destructive : theme.chart5,
          color: '#fff'
        }}>
          {statusMessage.type === 'success' ? <Check size={16} /> : statusMessage.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
          {statusMessage.text}
        </div>
      )}

      {/* Sidebar */}
      <aside className="flex flex-col h-full transition-all duration-300 shrink-0" style={{
        width: sidebarCollapsed ? '72px' : '240px',
        backgroundColor: theme.sidebarBg,
        borderRight: `1px solid ${theme.sidebarBorder}`
      }}>
        <div className="flex items-center gap-3 px-4 h-16 shrink-0" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: theme.accent }}>
            <Bot size={18} style={{ color: theme.bg }} />
          </div>
          {!sidebarCollapsed && <span className="font-bold text-base truncate">LINE Sales Hub</span>}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveScreen(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: activeScreen === item.key ? theme.accent + '18' : 'transparent',
                color: activeScreen === item.key ? theme.accent : theme.mutedFg,
                fontWeight: activeScreen === item.key ? 600 : 400
              }}>
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              {!sidebarCollapsed && item.key === 'orders' && pendingOrders.length > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.destructive, color: '#fff' }}>
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-2 pb-3">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
            style={{ color: theme.mutedFg }}>
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 gap-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search size={18} style={{ color: theme.mutedFg }} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1 placeholder:opacity-50"
              style={{ color: theme.fg }} />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg transition-colors" style={{ backgroundColor: theme.secondary }}>
              <Bell size={18} style={{ color: theme.mutedFg }} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] flex items-center justify-center rounded-full" style={{ backgroundColor: theme.destructive, color: '#fff' }}>3</span>
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback style={{ backgroundColor: theme.accent, color: theme.bg, fontSize: '12px', fontWeight: 600 }}>AD</AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && <span className="text-sm font-medium hidden sm:block">Admin</span>}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* ===== DASHBOARD ===== */}
          {activeScreen === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold">Dashboard</h1>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Active Conversations', value: '28', trend: '+12%', up: true, icon: <MessageSquare size={20} /> },
                  { label: "Today's Orders", value: '12', trend: '+8%', up: true, icon: <ShoppingCart size={20} /> },
                  { label: "Today's Revenue", value: '฿45,800', trend: '+15%', up: true, icon: <DollarSign size={20} /> },
                  { label: 'Total Users', value: '1,247', trend: '+3%', up: true, icon: <Users size={20} /> },
                  { label: 'Pending Confirms', value: String(pendingOrders.length), trend: '', up: false, icon: <Clock size={20} /> },
                ].map((stat, i) => (
                  <Card key={i} className="cursor-pointer transition-colors border-0"
                    style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}
                    onClick={() => {
                      if (i === 0) setActiveScreen('conversations')
                      else if (i === 1 || i === 4) setActiveScreen('orders')
                      else if (i === 2) setActiveScreen('analytics')
                      else if (i === 3) setActiveScreen('users')
                    }}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="p-2 rounded-lg" style={{ backgroundColor: theme.secondary, color: theme.accent }}>{stat.icon}</span>
                        {stat.trend && (
                          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: stat.up ? theme.chart2 : theme.destructive }}>
                            {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {stat.trend}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold" style={{ color: theme.fg }}>{stat.value}</p>
                      <p className="text-xs mt-1" style={{ color: theme.mutedFg }}>{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Two Columns: Recent Convos + Revenue Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Recent Conversations</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveScreen('conversations')}
                        style={{ color: theme.accent, fontSize: '13px' }}>View All</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 px-4 pb-4">
                    {mockUsers.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.secondary)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        onClick={() => { setSelectedUserId(user.id); setActiveScreen('conversations') }}>
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback style={{ backgroundColor: theme.accent + '30', color: theme.accent, fontSize: '11px', fontWeight: 600 }}>{user.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{user.name}</span>
                            <span className="text-[11px] shrink-0" style={{ color: theme.mutedFg }}>{user.timestamp}</span>
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color: theme.mutedFg }}>{user.lastMessage}</p>
                        </div>
                        {user.unread > 0 && (
                          <span className="w-5 h-5 text-[10px] flex items-center justify-center rounded-full shrink-0" style={{ backgroundColor: theme.accent, color: theme.bg }}>{user.unread}</span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                    <CardDescription style={{ color: theme.mutedFg }}>Last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={revenueChartConfig} className="h-[220px] w-full">
                      <AreaChart data={weeklyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="date" stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="revenue" stroke={theme.chart1} fill={theme.chart1} fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Orders */}
              {pendingOrders.length > 0 && (
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Pending Confirmations</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => { setOrderFilter('pending'); setActiveScreen('orders') }}
                        style={{ color: theme.accent, fontSize: '13px' }}>View All Orders</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4">
                    {pendingOrders.slice(0, 4).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.secondary }}>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono font-medium" style={{ color: theme.accent }}>{order.id}</span>
                          <span className="text-sm">{order.userName}</span>
                          <span className="text-xs" style={{ color: theme.mutedFg }}>{order.products}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">฿{order.total.toLocaleString()}</span>
                          <Button size="sm" onClick={() => handleOrderAction(order.id, 'confirmed')}
                            style={{ backgroundColor: theme.accent, color: theme.bg, height: '30px', fontSize: '12px' }}>
                            <Check size={14} className="mr-1" /> Confirm
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRejectOrder(order.id)}
                            style={{ color: theme.destructive, height: '30px', fontSize: '12px' }}>
                            <X size={14} className="mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button onClick={() => setActiveScreen('conversations')} style={{ backgroundColor: theme.accent, color: theme.bg }}>
                  <MessageSquare size={16} className="mr-2" /> View All Conversations
                </Button>
                <Button onClick={() => setActiveScreen('broadcast')} variant="outline" style={{ borderColor: theme.border, color: theme.fg }}>
                  <Send size={16} className="mr-2" /> Broadcast Message
                </Button>
              </div>
            </div>
          )}

          {/* ===== CONVERSATIONS ===== */}
          {activeScreen === 'conversations' && (
            <div className="h-full flex gap-0 -m-6">
              {/* Left: User List */}
              <div className="w-80 shrink-0 flex flex-col h-full" style={{ borderRight: `1px solid ${theme.border}` }}>
                <div className="p-4 space-y-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: theme.input }}>
                    <Search size={16} style={{ color: theme.mutedFg }} />
                    <input type="text" placeholder="Search conversations..." className="bg-transparent border-none outline-none text-sm flex-1" style={{ color: theme.fg }} />
                  </div>
                  <div className="flex gap-1">
                    {['all', 'active', 'paused', 'unread'].map(f => (
                      <button key={f} onClick={() => setConvFilter(f)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: convFilter === f ? theme.accent + '20' : 'transparent',
                          color: convFilter === f ? theme.accent : theme.mutedFg
                        }}>
                        {f === 'all' ? 'All' : f === 'active' ? 'Bot Active' : f === 'paused' ? 'Bot Paused' : 'Unread'}
                      </button>
                    ))}
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-0.5">
                    {filteredConvUsers.map(user => (
                      <button key={user.id} onClick={() => { setSelectedUserId(user.id); setDraftReply(''); setAgentSuggestion(null) }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                        style={{ backgroundColor: selectedUserId === user.id ? theme.secondary : 'transparent' }}>
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback style={{ backgroundColor: theme.accent + '30', color: theme.accent, fontSize: '12px', fontWeight: 600 }}>{user.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                            style={{ borderColor: theme.sidebarBg, backgroundColor: botPausedMap[user.id] ? '#d97706' : theme.chart2 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{user.name}</span>
                            <span className="text-[10px] shrink-0" style={{ color: theme.mutedFg }}>{user.timestamp}</span>
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color: theme.mutedFg }}>{user.lastMessage}</p>
                        </div>
                        {user.unread > 0 && (
                          <span className="w-5 h-5 text-[10px] flex items-center justify-center rounded-full shrink-0" style={{ backgroundColor: theme.accent, color: theme.bg, fontWeight: 700 }}>{user.unread}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Right: Chat Panel */}
              <div className="flex-1 flex flex-col h-full">
                {selectedUserId && selectedUser ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback style={{ backgroundColor: theme.accent + '30', color: theme.accent, fontSize: '11px', fontWeight: 600 }}>{selectedUser.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{selectedUser.name}</p>
                          <p className="text-xs" style={{ color: theme.mutedFg }}>
                            {botPausedMap[selectedUserId] ? 'Bot Paused - Manual Mode' : 'Bot Active'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label className="text-xs" style={{ color: theme.mutedFg }}>
                          {botPausedMap[selectedUserId] ? 'Resume Bot' : 'Pause Bot'}
                        </Label>
                        <Switch
                          checked={!!botPausedMap[selectedUserId]}
                          onCheckedChange={() => toggleBotPause(selectedUserId)}
                        />
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-5">
                      <div className="space-y-4 max-w-3xl mx-auto">
                        {selectedMessages.map(msg => (
                          <div key={msg.id} className={cn('flex gap-2', msg.sender === 'user' ? 'justify-start' : 'justify-end')}>
                            {msg.sender === 'user' && (
                              <Avatar className="h-7 w-7 mt-1 shrink-0">
                                <AvatarFallback style={{ backgroundColor: theme.muted, color: theme.mutedFg, fontSize: '10px' }}>{selectedUser.avatar}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="max-w-[70%] space-y-1.5">
                              <div className="px-4 py-2.5 rounded-2xl text-sm" style={{
                                backgroundColor: msg.sender === 'user' ? theme.muted : msg.sender === 'bot' ? theme.accent + '20' : theme.secondary,
                                borderBottomLeftRadius: msg.sender === 'user' ? '4px' : '16px',
                                borderBottomRightRadius: msg.sender !== 'user' ? '4px' : '16px',
                              }}>
                                {msg.text}
                              </div>
                              {msg.intent && (
                                <Badge variant="outline" className="text-[10px]" style={{ borderColor: theme.accent + '40', color: theme.accent }}>{msg.intent}</Badge>
                              )}
                              {Array.isArray(msg.products) && msg.products.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {msg.products.map((p, pi) => (
                                    <div key={pi} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: theme.secondary }}>
                                      <span className="font-medium">{p.name}</span>
                                      <span className="mx-1.5" style={{ color: theme.mutedFg }}>|</span>
                                      <span style={{ color: theme.accent }}>{p.price}</span>
                                      <span className="mx-1.5" style={{ color: theme.mutedFg }}>|</span>
                                      <span>{p.availability}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-[10px] px-1" style={{ color: theme.mutedFg }}>
                                {msg.sender === 'bot' && <Bot size={10} className="inline mr-1" />}
                                {msg.sender === 'admin' && <User size={10} className="inline mr-1" />}
                                {msg.timestamp}
                              </p>
                            </div>
                            {msg.sender === 'bot' && (
                              <Avatar className="h-7 w-7 mt-1 shrink-0">
                                <AvatarFallback style={{ backgroundColor: theme.accent + '30', color: theme.accent, fontSize: '10px' }}><Bot size={14} /></AvatarFallback>
                              </Avatar>
                            )}
                            {msg.sender === 'admin' && (
                              <Avatar className="h-7 w-7 mt-1 shrink-0">
                                <AvatarFallback style={{ backgroundColor: theme.chart5 + '30', color: theme.chart5, fontSize: '10px' }}><User size={14} /></AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                        {agentLoading && (
                          <div className="flex justify-end gap-2">
                            <div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: theme.secondary }}>
                              <Loader2 size={16} className="animate-spin" style={{ color: theme.accent }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-4 shrink-0 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                      {botPausedMap[selectedUserId] ? (
                        <>
                          {agentSuggestion && (
                            <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: theme.secondary }}>
                              <div className="flex items-center gap-2">
                                <Sparkles size={14} style={{ color: theme.accent }} />
                                <span className="text-xs font-medium" style={{ color: theme.accent }}>AI Suggestion</span>
                                <Badge variant="outline" className="text-[10px] ml-auto" style={{
                                  borderColor: agentSuggestion?.confidence === 'high' ? theme.chart2 : theme.chart5,
                                  color: agentSuggestion?.confidence === 'high' ? theme.chart2 : theme.chart5
                                }}>
                                  {agentSuggestion?.confidence || 'medium'} confidence
                                </Badge>
                              </div>
                              {agentSuggestion?.context_notes && (
                                <p className="text-xs px-2 py-1.5 rounded" style={{ backgroundColor: theme.muted, color: theme.mutedFg }}>{agentSuggestion.context_notes}</p>
                              )}
                              {Array.isArray(agentSuggestion?.suggested_actions) && agentSuggestion.suggested_actions.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {agentSuggestion.suggested_actions.map((action: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: theme.border, color: theme.mutedFg }}>{action}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Textarea placeholder="Type your reply..." value={draftReply} onChange={e => setDraftReply(e.target.value)}
                              className="flex-1 resize-none border-0 text-sm" rows={2}
                              style={{ backgroundColor: theme.input, color: theme.fg }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={handleGetAISuggestion} disabled={agentLoading}
                              style={{ borderColor: theme.border, color: theme.accent }}>
                              {agentLoading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Sparkles size={14} className="mr-1.5" />}
                              Get AI Suggestion
                            </Button>
                            <Button size="sm" onClick={handleSendReply} disabled={!draftReply.trim()}
                              style={{ backgroundColor: theme.accent, color: theme.bg }}>
                              <Send size={14} className="mr-1.5" /> Send Reply
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <Input placeholder="Simulate a customer message..." value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSimulateMessage()}
                            className="flex-1 border-0 text-sm" style={{ backgroundColor: theme.input, color: theme.fg }} />
                          <Button onClick={handleSimulateMessage} disabled={agentLoading || !messageInput.trim()}
                            style={{ backgroundColor: theme.accent, color: theme.bg }}>
                            {agentLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <MessageSquare size={48} style={{ color: theme.muted }} className="mx-auto" />
                      <p className="text-lg font-medium" style={{ color: theme.mutedFg }}>Select a conversation</p>
                      <p className="text-sm" style={{ color: theme.mutedFg }}>Choose a user from the list to view their chat history</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== PRODUCTS ===== */}
          {activeScreen === 'products' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Products & Knowledge Base</h1>
                  <p className="text-sm mt-1" style={{ color: theme.mutedFg }}>
                    Manage your product catalog and the AI knowledge base that powers customer responses
                  </p>
                </div>
                <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', category: 'Electronics', stock: '', imageUrl: '' }); setProductDialog(true) }}
                  style={{ backgroundColor: theme.accent, color: theme.bg }}>
                  <Plus size={16} className="mr-2" /> Add Product
                </Button>
              </div>

              {/* How It Works - Data Flow */}
              <Card className="border-0" style={{ backgroundColor: theme.accent + '08', borderRadius: '0.75rem', border: `1px solid ${theme.accent}25` }}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-6 text-xs overflow-x-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><Upload size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>Admin uploads product docs</span>
                    </div>
                    <ChevronRight size={16} style={{ color: theme.accent }} className="shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><Database size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>Knowledge Base trains on data</span>
                    </div>
                    <ChevronRight size={16} style={{ color: theme.accent }} className="shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><Bot size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>AI bot searches KB for answers</span>
                    </div>
                    <ChevronRight size={16} style={{ color: theme.accent }} className="shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><MessageSquare size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>Customer gets accurate info</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Knowledge Base - Product Catalog Documents */}
              <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-lg" style={{ backgroundColor: theme.accent + '20' }}>
                        <Database size={20} style={{ color: theme.accent }} />
                      </span>
                      <div>
                        <CardTitle className="text-base font-semibold">Product Catalog Knowledge Base</CardTitle>
                        <CardDescription style={{ color: theme.mutedFg }}>
                          Documents the AI bot uses to answer product questions from customers
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => kbFetchDocuments(RAG_ID)}
                        disabled={kbLoading}
                        style={{ borderColor: theme.border, color: theme.mutedFg }}>
                        <RefreshCw size={14} className={cn('mr-1.5', kbLoading && 'animate-spin')} /> Refresh
                      </Button>
                      <label>
                        <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleKBFileUpload} disabled={kbUploading} />
                        <Button size="sm" asChild disabled={kbUploading}
                          style={{ backgroundColor: theme.accent, color: theme.bg, cursor: 'pointer' }}>
                          <span>
                            {kbUploading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Upload size={14} className="mr-1.5" />}
                            Upload Document
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Document List */}
                  {kbLoading && !kbDocuments ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full" style={{ backgroundColor: theme.muted }} />
                      <Skeleton className="h-14 w-full" style={{ backgroundColor: theme.muted }} />
                    </div>
                  ) : Array.isArray(kbDocuments) && kbDocuments.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1 mb-1">
                        <span className="text-xs font-medium" style={{ color: theme.mutedFg }}>
                          {kbDocuments.length} document{kbDocuments.length !== 1 ? 's' : ''} in knowledge base
                        </span>
                        <Badge style={{ backgroundColor: theme.chart2 + '20', color: theme.chart2 }} className="text-[10px]">
                          AI Active
                        </Badge>
                      </div>
                      {kbDocuments.map((doc, i) => (
                        <div key={doc.fileName || i} className="flex items-center justify-between p-3.5 rounded-lg" style={{ backgroundColor: theme.secondary }}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: theme.muted }}>
                              <File size={18} style={{ color: theme.accent }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{doc.fileName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px]" style={{ color: theme.mutedFg }}>
                                  {doc.fileType?.toUpperCase() || 'DOC'}
                                </span>
                                {doc.fileSize && (
                                  <>
                                    <span className="text-[10px]" style={{ color: theme.border }}>|</span>
                                    <span className="text-[11px]" style={{ color: theme.mutedFg }}>
                                      {(doc.fileSize / 1024).toFixed(1)} KB
                                    </span>
                                  </>
                                )}
                                {doc.uploadedAt && (
                                  <>
                                    <span className="text-[10px]" style={{ color: theme.border }}>|</span>
                                    <span className="text-[11px]" style={{ color: theme.mutedFg }}>
                                      {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {doc.status && (
                              <Badge variant="outline" className="text-[10px]" style={{
                                borderColor: doc.status === 'active' ? theme.chart2 : doc.status === 'processing' ? '#d97706' : theme.destructive,
                                color: doc.status === 'active' ? theme.chart2 : doc.status === 'processing' ? '#d97706' : theme.destructive,
                              }}>
                                {doc.status === 'active' ? 'Trained - AI can use' : doc.status === 'processing' ? 'Training...' : doc.status}
                              </Badge>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" style={{ color: theme.destructive, height: '30px', width: '30px', padding: 0 }}>
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove {doc.fileName}?</AlertDialogTitle>
                                  <AlertDialogDescription style={{ color: theme.mutedFg }}>
                                    The AI bot will no longer have access to product data in this file when answering customer questions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel style={{ borderColor: theme.border, color: theme.fg }}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleKBDeleteDoc(doc.fileName)} style={{ backgroundColor: theme.destructive, color: '#fff' }}>Remove</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3 rounded-lg" style={{ backgroundColor: theme.secondary }}>
                      <Database size={44} style={{ color: theme.muted }} />
                      <div className="text-center max-w-sm">
                        <p className="text-sm font-medium">No documents uploaded yet</p>
                        <p className="text-xs mt-1.5" style={{ color: theme.mutedFg }}>
                          Upload your product catalog as a PDF, DOCX, or TXT file. The AI bot will train on this data and use it to answer customer questions accurately.
                        </p>
                      </div>
                    </div>
                  )}
                  {kbError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ backgroundColor: theme.destructive + '15', color: theme.destructive }}>
                      <AlertCircle size={14} className="shrink-0" /> {kbError}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document Format Guide */}
              <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-lg" style={{ backgroundColor: theme.chart5 + '20' }}>
                      <Info size={20} style={{ color: theme.chart5 }} />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold">Recommended Document Format</CardTitle>
                      <CardDescription style={{ color: theme.mutedFg }}>
                        Use this format so the AI bot can accurately retrieve and present product information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Format Example */}
                    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
                      <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: theme.secondary }}>
                        <FileText size={14} style={{ color: theme.accent }} />
                        <span className="text-xs font-semibold" style={{ color: theme.accent }}>product_catalog.txt - Example</span>
                      </div>
                      <div className="p-4" style={{ backgroundColor: theme.bg }}>
                        <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: theme.mutedFg }}>
{`===========================
Product: Wireless Earbuds Pro
SKU: WEP-001
Category: Electronics
Price: 1,290 THB
Stock: 45 units
Status: In Stock
Description: Premium noise-cancelling
wireless earbuds with 24-hour battery
life. Features Bluetooth 5.3, IPX5
water resistance, and touch controls.
Colors: Black, White, Midnight Green
===========================
Product: Smart Watch Pro
SKU: SWP-002
Category: Electronics
Price: 3,490 THB
Stock: 12 units
Status: In Stock
Description: Fitness tracking smartwatch
with heart rate monitor, GPS, sleep
tracking, and 7-day battery life.
Colors: Silver, Black
===========================`}
                        </pre>
                      </div>
                    </div>

                    {/* Field Guide */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium" style={{ color: theme.mutedFg }}>
                        Required fields per product for best AI responses:
                      </p>
                      <div className="space-y-2">
                        {[
                          { field: 'Product Name', desc: 'Full product name the customer might search for', required: true },
                          { field: 'SKU / Product ID', desc: 'Unique identifier for order tracking', required: true },
                          { field: 'Category', desc: 'Product category (Electronics, Fashion, etc.)', required: true },
                          { field: 'Price', desc: 'Price in THB with currency label', required: true },
                          { field: 'Stock / Availability', desc: 'Current stock count or In Stock / Out of Stock', required: true },
                          { field: 'Description', desc: 'Detailed product features, specs, materials', required: true },
                          { field: 'Colors / Variants', desc: 'Available options customers can choose', required: false },
                          { field: 'Shipping Info', desc: 'Delivery time, weight, shipping restrictions', required: false },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded" style={{ backgroundColor: theme.secondary }}>
                            <div className="mt-0.5 shrink-0">
                              {item.required ? (
                                <Check size={12} style={{ color: theme.chart2 }} />
                              ) : (
                                <span className="w-3 h-3 flex items-center justify-center text-[8px]" style={{ color: theme.mutedFg }}>--</span>
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-medium">{item.field}</span>
                              {item.required && <span className="text-[9px] ml-1" style={{ color: theme.chart2 }}>required</span>}
                              <p className="text-[11px] mt-0.5" style={{ color: theme.mutedFg }}>{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-lg space-y-1.5" style={{ backgroundColor: theme.accent + '10', border: `1px solid ${theme.accent}20` }}>
                        <p className="text-xs font-medium" style={{ color: theme.accent }}>Tips for best results:</p>
                        <ul className="text-[11px] space-y-1" style={{ color: theme.mutedFg }}>
                          <li>- Separate each product with a clear divider (=== or ---)</li>
                          <li>- Use consistent field names across all products</li>
                          <li>- Include the price with currency (THB)</li>
                          <li>- Supported formats: PDF, DOCX, TXT</li>
                          <li>- You can upload multiple files for different categories</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Cards Grid (visual reference) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold">Product Display Reference</h2>
                  <span className="text-xs" style={{ color: theme.mutedFg }}>Visual reference - upload documents above for AI data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(product => (
                    <Card key={product.id} className="border-0 overflow-hidden" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                      <div className="h-32 flex items-center justify-center" style={{ backgroundColor: theme.secondary }}>
                        <Package size={36} style={{ color: theme.muted }} />
                      </div>
                      <CardContent className="p-4 space-y-2.5">
                        <div>
                          <h3 className="text-sm font-semibold">{product.name}</h3>
                          <p className="text-xs mt-0.5" style={{ color: theme.mutedFg }}>{product.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold" style={{ color: theme.accent }}>฿{product.price.toLocaleString()}</span>
                          {stockBadge(product.stock)}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[11px]" style={{ borderColor: theme.border, color: theme.mutedFg }}>{product.category}</Badge>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditProduct(product)} style={{ color: theme.mutedFg, height: '28px', width: '28px', padding: 0 }}>
                              <Edit size={14} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" style={{ color: theme.destructive, height: '28px', width: '28px', padding: 0 }}>
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
                                  <AlertDialogDescription style={{ color: theme.mutedFg }}>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel style={{ borderColor: theme.border, color: theme.fg }}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} style={{ backgroundColor: theme.destructive, color: '#fff' }}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Product Dialog */}
              <Dialog open={productDialog} onOpenChange={setProductDialog}>
                <DialogContent style={{ backgroundColor: theme.card, borderColor: theme.border }} className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Name</Label>
                      <Input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                        className="border-0" style={{ backgroundColor: theme.input, color: theme.fg }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                        className="border-0 resize-none" rows={2} style={{ backgroundColor: theme.input, color: theme.fg }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Price (THB)</Label>
                        <Input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                          className="border-0" style={{ backgroundColor: theme.input, color: theme.fg }} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Stock</Label>
                        <Input type="number" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                          className="border-0" style={{ backgroundColor: theme.input, color: theme.fg }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <Select value={productForm.category} onValueChange={v => setProductForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger className="border-0" style={{ backgroundColor: theme.input, color: theme.fg }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                          {['Electronics', 'Fashion', 'Beauty', 'Food'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" style={{ borderColor: theme.border, color: theme.fg }}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveProduct} style={{ backgroundColor: theme.accent, color: theme.bg }}>
                      {editingProduct ? 'Update' : 'Add'} Product
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {activeScreen === 'orders' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold">Orders</h1>

              <Tabs value={orderFilter} onValueChange={setOrderFilter}>
                <TabsList style={{ backgroundColor: theme.secondary }}>
                  {[
                    { v: 'all', l: `All (${orders.length})` },
                    { v: 'pending', l: `Pending (${orders.filter(o => o.status === 'pending').length})` },
                    { v: 'confirmed', l: `Confirmed (${orders.filter(o => o.status === 'confirmed').length})` },
                    { v: 'shipped', l: `Shipped (${orders.filter(o => o.status === 'shipped').length})` },
                    { v: 'delivered', l: `Delivered (${orders.filter(o => o.status === 'delivered').length})` },
                  ].map(tab => (
                    <TabsTrigger key={tab.v} value={tab.v} className="text-xs">{tab.l}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <Card className="border-0 overflow-hidden" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: theme.border }}>
                      <TableHead style={{ color: theme.mutedFg }}>Order ID</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Customer</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Products</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Total</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Status</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Date</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(order => (
                      <TableRow key={order.id} className="cursor-pointer" style={{ borderColor: theme.border }}
                        onClick={() => setSelectedOrder(order)}>
                        <TableCell className="font-mono text-sm" style={{ color: theme.accent }}>{order.id}</TableCell>
                        <TableCell className="text-sm">{order.userName}</TableCell>
                        <TableCell className="text-sm" style={{ color: theme.mutedFg }}>{order.products}</TableCell>
                        <TableCell className="text-sm font-semibold">฿{order.total.toLocaleString()}</TableCell>
                        <TableCell>{statusBadgeOrder(order.status)}</TableCell>
                        <TableCell className="text-sm" style={{ color: theme.mutedFg }}>{order.date}</TableCell>
                        <TableCell>
                          {order.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={e => { e.stopPropagation(); handleOrderAction(order.id, 'confirmed') }}
                                style={{ backgroundColor: theme.accent, color: theme.bg, height: '28px', fontSize: '11px' }}>
                                <Check size={12} className="mr-1" /> Confirm
                              </Button>
                              <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleRejectOrder(order.id) }}
                                style={{ color: theme.destructive, height: '28px', fontSize: '11px' }}>
                                <X size={12} className="mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Order Detail Dialog */}
              <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                  <DialogHeader>
                    <DialogTitle>Order {selectedOrder?.id}</DialogTitle>
                    <DialogDescription style={{ color: theme.mutedFg }}>
                      Placed by {selectedOrder?.userName} on {selectedOrder?.date}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.secondary }}>
                      <p className="text-xs mb-1" style={{ color: theme.mutedFg }}>Products</p>
                      <p className="text-sm">{selectedOrder?.products}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.mutedFg }}>Total</span>
                      <span className="text-xl font-bold" style={{ color: theme.accent }}>฿{selectedOrder?.total?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.mutedFg }}>Status</span>
                      {selectedOrder && statusBadgeOrder(selectedOrder.status)}
                    </div>
                  </div>
                  <DialogFooter>
                    {selectedOrder?.status === 'pending' && (
                      <>
                        <Button variant="outline" onClick={() => { handleRejectOrder(selectedOrder.id) }}
                          style={{ borderColor: theme.destructive, color: theme.destructive }}>Reject</Button>
                        <Button onClick={() => { handleOrderAction(selectedOrder.id, 'confirmed') }}
                          style={{ backgroundColor: theme.accent, color: theme.bg }}>Confirm Order</Button>
                      </>
                    )}
                    {selectedOrder?.status === 'confirmed' && (
                      <Button onClick={() => { handleOrderAction(selectedOrder.id, 'shipped') }}
                        style={{ backgroundColor: theme.chart5, color: '#fff' }}>Mark as Shipped</Button>
                    )}
                    {selectedOrder?.status === 'shipped' && (
                      <Button onClick={() => { handleOrderAction(selectedOrder.id, 'delivered') }}
                        style={{ backgroundColor: theme.chart2, color: '#fff' }}>Mark as Delivered</Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeScreen === 'users' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold">Users</h1>

              <Card className="border-0 overflow-hidden" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: theme.border }}>
                      <TableHead style={{ color: theme.mutedFg }}>User</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Total Orders</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Total Spent</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Last Active</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Segments</TableHead>
                      <TableHead style={{ color: theme.mutedFg }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map(user => (
                      <>
                        <TableRow key={user.id} className="cursor-pointer" style={{ borderColor: theme.border }}
                          onClick={() => setSelectedUserDetail(selectedUserDetail === user.id ? null : user.id)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback style={{ backgroundColor: theme.accent + '30', color: theme.accent, fontSize: '10px', fontWeight: 600 }}>{user.avatar}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.totalOrders}</TableCell>
                          <TableCell className="text-sm font-medium">฿{user.totalSpent.toLocaleString()}</TableCell>
                          <TableCell className="text-sm" style={{ color: theme.mutedFg }}>{user.lastActive}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {Array.isArray(user.segments) && user.segments.map(seg => (
                                <Badge key={seg} variant="outline" className="text-[10px]" style={{
                                  borderColor: seg === 'VIP' ? theme.accent : seg === 'Active' ? theme.chart2 : seg === 'New' ? theme.chart5 : theme.muted,
                                  color: seg === 'VIP' ? theme.accent : seg === 'Active' ? theme.chart2 : seg === 'New' ? theme.chart5 : theme.mutedFg,
                                }}>{seg}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" style={{ color: theme.accent, height: '28px' }}
                              onClick={e => { e.stopPropagation(); setSelectedUserId(user.id); setActiveScreen('conversations') }}>
                              <MessageSquare size={14} className="mr-1" /> Chat
                            </Button>
                          </TableCell>
                        </TableRow>
                        {selectedUserDetail === user.id && (
                          <TableRow key={`${user.id}-detail`} style={{ borderColor: theme.border }}>
                            <TableCell colSpan={6}>
                              <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: theme.secondary }}>
                                <h4 className="text-sm font-semibold">Purchase History</h4>
                                <div className="space-y-2">
                                  {orders.filter(o => o.userId === user.id).length > 0 ? (
                                    orders.filter(o => o.userId === user.id).map(order => (
                                      <div key={order.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: theme.muted }}>
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs font-mono" style={{ color: theme.accent }}>{order.id}</span>
                                          <span className="text-xs" style={{ color: theme.mutedFg }}>{order.products}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs font-medium">฿{order.total.toLocaleString()}</span>
                                          {statusBadgeOrder(order.status)}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs" style={{ color: theme.mutedFg }}>No orders yet</p>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 pt-2">
                                  <div>
                                    <p className="text-xs" style={{ color: theme.mutedFg }}>Avg Order Value</p>
                                    <p className="text-sm font-semibold">
                                      ฿{user.totalOrders > 0 ? Math.round(user.totalSpent / user.totalOrders).toLocaleString() : '0'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: theme.mutedFg }}>Member Since</p>
                                    <p className="text-sm font-semibold">Jan 2026</p>
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: theme.mutedFg }}>Lifetime Value</p>
                                    <p className="text-sm font-semibold" style={{ color: theme.accent }}>฿{user.totalSpent.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* ===== BROADCAST ===== */}
          {activeScreen === 'broadcast' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold">Broadcast Message</h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader>
                    <CardTitle className="text-base">Compose Message</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Audience</Label>
                      <Select value={broadcastAudience} onValueChange={setBroadcastAudience}>
                        <SelectTrigger className="border-0" style={{ backgroundColor: theme.input, color: theme.fg }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                          <SelectItem value="all">All Users (1,247)</SelectItem>
                          <SelectItem value="segment">By Segment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {broadcastAudience === 'segment' && (
                      <div className="space-y-2">
                        <Label className="text-xs">Select Segments</Label>
                        <div className="flex flex-wrap gap-2">
                          {['VIP', 'Active', 'New Users', 'Inactive'].map(seg => (
                            <button key={seg} onClick={() => setBroadcastSegments(prev =>
                              prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]
                            )} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{
                              backgroundColor: broadcastSegments.includes(seg) ? theme.accent + '20' : theme.secondary,
                              color: broadcastSegments.includes(seg) ? theme.accent : theme.mutedFg,
                              border: `1px solid ${broadcastSegments.includes(seg) ? theme.accent : theme.border}`
                            }}>
                              {seg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Message</Label>
                        <span className="text-[11px]" style={{ color: theme.mutedFg }}>{broadcastMessage.length}/500</span>
                      </div>
                      <Textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value.slice(0, 500))}
                        placeholder="Type your broadcast message..."
                        className="border-0 resize-none" rows={5} style={{ backgroundColor: theme.input, color: theme.fg }} />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full" disabled={!broadcastMessage.trim()}
                          style={{ backgroundColor: theme.accent, color: theme.bg }}>
                          <Send size={16} className="mr-2" /> Send Broadcast
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Send Broadcast?</AlertDialogTitle>
                          <AlertDialogDescription style={{ color: theme.mutedFg }}>
                            This will send your message to {broadcastAudience === 'all' ? '1,247 users' : `selected segments (${broadcastSegments.join(', ')})`}. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel style={{ borderColor: theme.border, color: theme.fg }}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => {
                            setBroadcasts(prev => [{
                              id: `b${Date.now()}`, date: new Date().toISOString().split('T')[0],
                              audience: broadcastAudience === 'all' ? 'All Users' : broadcastSegments.join(', '),
                              message: broadcastMessage, sentCount: broadcastAudience === 'all' ? 1247 : Math.floor(Math.random() * 500) + 50,
                              status: 'Sent'
                            }, ...prev])
                            setBroadcastMessage('')
                            showStatus('Broadcast sent successfully')
                          }} style={{ backgroundColor: theme.accent, color: theme.bg }}>Send Now</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader>
                    <CardTitle className="text-base">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: theme.secondary }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                          <Bot size={16} style={{ color: theme.bg }} />
                        </div>
                        <span className="text-sm font-semibold">LINE Sales Hub</span>
                      </div>
                      <div className="px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: theme.muted }}>
                        {broadcastMessage || 'Your message preview will appear here...'}
                      </div>
                      <p className="text-[10px]" style={{ color: theme.mutedFg }}>
                        {broadcastAudience === 'all' ? 'To: All Users (1,247)' : `To: ${broadcastSegments.length > 0 ? broadcastSegments.join(', ') : 'Select segments'}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Broadcast History */}
              <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                <CardHeader>
                  <CardTitle className="text-base">Broadcast History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: theme.border }}>
                        <TableHead style={{ color: theme.mutedFg }}>Date</TableHead>
                        <TableHead style={{ color: theme.mutedFg }}>Audience</TableHead>
                        <TableHead style={{ color: theme.mutedFg }}>Message</TableHead>
                        <TableHead style={{ color: theme.mutedFg }}>Sent</TableHead>
                        <TableHead style={{ color: theme.mutedFg }}>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {broadcasts.map(bc => (
                        <TableRow key={bc.id} style={{ borderColor: theme.border }}>
                          <TableCell className="text-sm">{bc.date}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]" style={{ borderColor: theme.border, color: theme.mutedFg }}>{bc.audience}</Badge></TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate" style={{ color: theme.mutedFg }}>{bc.message}</TableCell>
                          <TableCell className="text-sm">{bc.sentCount.toLocaleString()}</TableCell>
                          <TableCell><Badge style={{ backgroundColor: theme.chart2, color: '#fff' }}>{bc.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== ANALYTICS ===== */}
          {activeScreen === 'analytics' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <div className="flex items-center gap-3">
                  <Select value={analyticsRange} onValueChange={setAnalyticsRange}>
                    <SelectTrigger className="w-36 border-0 text-sm" style={{ backgroundColor: theme.input, color: theme.fg }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => { setExportSuccess(true); setTimeout(() => setExportSuccess(false), 3000) }}
                    style={{ borderColor: theme.border, color: theme.fg }}>
                    {exportSuccess ? <Check size={16} className="mr-2" style={{ color: theme.chart2 }} /> : <Download size={16} className="mr-2" />}
                    {exportSuccess ? 'Exported!' : 'Export to Google Sheets'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Revenue</CardTitle>
                    <CardDescription style={{ color: theme.mutedFg }}>Daily revenue trend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                      <AreaChart data={analyticsRange === 'week' ? revenueData.slice(0, 7) : revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="date" stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="revenue" stroke={theme.chart1} fill={theme.chart1} fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Orders Chart */}
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Orders</CardTitle>
                    <CardDescription style={{ color: theme.mutedFg }}>Daily order count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={ordersChartConfig} className="h-[280px] w-full">
                      <BarChart data={analyticsRange === 'week' ? revenueData.slice(0, 7) : revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="date" stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="orders" fill={theme.chart2} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Conversation Volume */}
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Conversation Volume</CardTitle>
                    <CardDescription style={{ color: theme.mutedFg }}>Messages per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={conversationsChartConfig} className="h-[280px] w-full">
                      <LineChart data={analyticsRange === 'week' ? conversationVolumeData.slice(0, 7) : conversationVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="date" stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="messages" stroke={theme.chart3} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Products by Sales</CardTitle>
                    <CardDescription style={{ color: theme.mutedFg }}>Units sold</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topProductsData.map((product, i) => (
                        <div key={product.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span>{product.name}</span>
                            <span className="font-semibold">{product.sales}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.muted }}>
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${(product.sales / topProductsData[0].sales) * 100}%`,
                              backgroundColor: [theme.chart1, theme.chart2, theme.chart3, theme.chart4, theme.chart5][i]
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* User Growth */}
                <Card className="border-0 lg:col-span-2" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">User Growth</CardTitle>
                    <CardDescription style={{ color: theme.mutedFg }}>Total registered users over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={usersChartConfig} className="h-[280px] w-full">
                      <AreaChart data={analyticsRange === 'week' ? userGrowthData.slice(0, 7) : userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="date" stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="users" stroke={theme.chart5} fill={theme.chart5} fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===== CHANNELS ===== */}
          {activeScreen === 'channels' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Channels</h1>
                  <p className="text-sm mt-1" style={{ color: theme.mutedFg }}>
                    Connect and manage external chat platforms to centralize all customer conversations
                  </p>
                </div>
                <Button onClick={openAddChannel} style={{ backgroundColor: theme.accent, color: theme.bg }}>
                  <Plus size={16} className="mr-2" /> Add Channel
                </Button>
              </div>

              {/* Connected Channels Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platformConfigs.map(pc => {
                  const count = channelsByPlatform(pc.platform).length
                  const connected = channelsByPlatform(pc.platform).filter(c => c.status === 'connected').length
                  return (
                    <Card key={pc.platform} className="border-0 cursor-pointer transition-colors"
                      style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}
                      onClick={() => { if (count === 0) { setSelectedPlatform(pc.platform); setChannelForm({}); setChannelName(''); setChannelSettingsId(null); setShowSecrets({}); setChannelDialog(true) } }}>
                      <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: pc.color + '20', color: pc.color }}>
                            {pc.icon}
                          </div>
                          {count > 0 ? (
                            <Badge style={{ backgroundColor: connected > 0 ? theme.chart2 + '20' : theme.destructive + '20', color: connected > 0 ? theme.chart2 : theme.destructive }} className="text-[10px]">
                              {connected}/{count} Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: theme.border, color: theme.mutedFg }}>
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold">{pc.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: theme.mutedFg }}>
                          {count > 0 ? `${count} channel${count !== 1 ? 's' : ''} configured` : 'Click to connect'}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* All Connected Channels */}
              {channels.length > 0 ? (
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Connected Channels</CardTitle>
                      <span className="text-xs" style={{ color: theme.mutedFg }}>
                        {channels.filter(c => c.status === 'connected').length} of {channels.length} active
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4">
                    {channels.map(channel => {
                      const pc = platformConfigs.find(p => p.platform === channel.platform)
                      return (
                        <div key={channel.id} className="flex items-center justify-between p-4 rounded-xl transition-colors"
                          style={{ backgroundColor: theme.secondary }}>
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ backgroundColor: (pc?.color || theme.accent) + '20', color: pc?.color || theme.accent }}>
                              {pc?.icon || '??'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate">{channel.name}</span>
                                <span className="flex items-center gap-1">
                                  {channel.status === 'connected' ? (
                                    <Wifi size={12} style={{ color: theme.chart2 }} />
                                  ) : channel.status === 'error' ? (
                                    <AlertCircle size={12} style={{ color: theme.destructive }} />
                                  ) : (
                                    <WifiOff size={12} style={{ color: theme.mutedFg }} />
                                  )}
                                  <span className="text-[10px] font-medium" style={{
                                    color: channel.status === 'connected' ? theme.chart2 : channel.status === 'error' ? theme.destructive : theme.mutedFg
                                  }}>
                                    {channel.status === 'connected' ? 'Connected' : channel.status === 'error' ? 'Error' : 'Disconnected'}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[11px]" style={{ color: theme.mutedFg }}>{pc?.label}</span>
                                {channel.lastActivity && (
                                  <>
                                    <span className="text-[10px]" style={{ color: theme.border }}>|</span>
                                    <span className="text-[11px]" style={{ color: theme.mutedFg }}>Last active: {channel.lastActivity}</span>
                                  </>
                                )}
                                {channel.messagesCount !== undefined && (
                                  <>
                                    <span className="text-[10px]" style={{ color: theme.border }}>|</span>
                                    <span className="text-[11px]" style={{ color: theme.mutedFg }}>{channel.messagesCount.toLocaleString()} messages</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <Button size="sm" variant="ghost" onClick={() => handleTestConnection(channel.id)}
                              disabled={channelTestLoading}
                              style={{ color: theme.accent, height: '32px', fontSize: '12px' }}>
                              {channelTestLoading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />}
                              Test
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleToggleChannelStatus(channel.id)}
                              style={{ color: channel.status === 'connected' ? theme.mutedFg : theme.chart2, height: '32px', fontSize: '12px' }}>
                              {channel.status === 'connected' ? <WifiOff size={14} className="mr-1" /> : <Wifi size={14} className="mr-1" />}
                              {channel.status === 'connected' ? 'Disconnect' : 'Connect'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openChannelSettings(channel)}
                              style={{ color: theme.accent, height: '32px', fontSize: '12px' }}>
                              <Settings size={14} className="mr-1" /> Settings
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" style={{ color: theme.destructive, height: '32px', width: '32px', padding: 0 }}>
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove {channel.name}?</AlertDialogTitle>
                                  <AlertDialogDescription style={{ color: theme.mutedFg }}>
                                    This will disconnect and remove this channel. You will stop receiving messages from this channel. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel style={{ borderColor: theme.border, color: theme.fg }}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteChannel(channel.id)} style={{ backgroundColor: theme.destructive, color: '#fff' }}>Remove Channel</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                  <CardContent className="py-16">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Unplug size={48} style={{ color: theme.muted }} />
                      <p className="text-base font-medium">No channels connected</p>
                      <p className="text-sm text-center max-w-sm" style={{ color: theme.mutedFg }}>
                        Connect your first channel to start receiving and managing customer conversations from external platforms.
                      </p>
                      <Button onClick={openAddChannel} style={{ backgroundColor: theme.accent, color: theme.bg }} className="mt-2">
                        <Plus size={16} className="mr-2" /> Add Your First Channel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Setup Guide */}
              <Card className="border-0" style={{ backgroundColor: theme.card, borderRadius: '0.75rem' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-lg" style={{ backgroundColor: theme.chart5 + '20' }}>
                      <Info size={20} style={{ color: theme.chart5 }} />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold">How Channel Integration Works</CardTitle>
                      <CardDescription style={{ color: theme.mutedFg }}>
                        Connect platforms to route all customer messages through your AI sales bot
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-xs overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><Globe size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>Connect platform channel</span>
                    </div>
                    <ChevronRight size={16} style={{ color: theme.accent }} className="shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><Link2 size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>Configure API keys and webhook</span>
                    </div>
                    <ChevronRight size={16} style={{ color: theme.accent }} className="shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><Bot size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>AI bot handles incoming messages</span>
                    </div>
                    <ChevronRight size={16} style={{ color: theme.accent }} className="shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded" style={{ backgroundColor: theme.accent + '20' }}><MessageSquare size={14} style={{ color: theme.accent }} /></span>
                      <span style={{ color: theme.mutedFg }}>View all in Conversations tab</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add/Edit Channel Dialog */}
              <Dialog open={channelDialog} onOpenChange={setChannelDialog}>
                <DialogContent style={{ backgroundColor: theme.card, borderColor: theme.border }} className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{channelSettingsId ? 'Channel Settings' : 'Add New Channel'}</DialogTitle>
                    <DialogDescription style={{ color: theme.mutedFg }}>
                      {channelSettingsId ? 'Update your channel configuration' : 'Select a platform and configure the connection'}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Platform Selection (only for new channels) */}
                  {!channelSettingsId && !selectedPlatform && (
                    <div className="space-y-3 py-2">
                      <Label className="text-xs font-medium" style={{ color: theme.mutedFg }}>Select Platform</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {platformConfigs.map(pc => (
                          <button key={pc.platform} onClick={() => handleSelectPlatform(pc.platform)}
                            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                            style={{
                              backgroundColor: theme.secondary,
                              border: `1px solid ${theme.border}`,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = pc.color; e.currentTarget.style.backgroundColor = pc.color + '10' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.backgroundColor = theme.secondary }}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ backgroundColor: pc.color + '20', color: pc.color }}>
                              {pc.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{pc.label}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: theme.mutedFg }}>
                                {channelsByPlatform(pc.platform).length} connected
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform Config Form */}
                  {selectedPlatform && currentPlatformConfig && (
                    <div className="space-y-4 py-2">
                      {/* Platform Header */}
                      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: theme.secondary }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: currentPlatformConfig.color + '20', color: currentPlatformConfig.color }}>
                          {currentPlatformConfig.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{currentPlatformConfig.label}</p>
                          <p className="text-[11px]" style={{ color: theme.mutedFg }}>
                            {channelSettingsId ? 'Editing configuration' : 'New channel setup'}
                          </p>
                        </div>
                        {!channelSettingsId && (
                          <Button size="sm" variant="ghost" onClick={() => setSelectedPlatform(null)}
                            style={{ color: theme.mutedFg, height: '28px', fontSize: '11px' }}>
                            <ChevronLeft size={14} className="mr-1" /> Back
                          </Button>
                        )}
                      </div>

                      {/* Channel Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Channel Name <span style={{ color: theme.destructive }}>*</span></Label>
                        <Input value={channelName} onChange={e => setChannelName(e.target.value)}
                          placeholder="e.g. Main Store, Promo Channel"
                          className="border-0 text-sm" style={{ backgroundColor: theme.input, color: theme.fg }} />
                        <p className="text-[10px]" style={{ color: theme.mutedFg }}>A friendly name to identify this channel</p>
                      </div>

                      <Separator style={{ backgroundColor: theme.border }} />

                      {/* Dynamic Fields */}
                      {currentPlatformConfig.fields.map(field => (
                        <div key={field.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">
                              {field.label} {field.required && <span style={{ color: theme.destructive }}>*</span>}
                            </Label>
                            {field.type === 'password' && (
                              <button onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                                className="text-[10px] px-2 py-0.5 rounded" style={{ color: theme.accent }}>
                                {showSecrets[field.key] ? 'Hide' : 'Show'}
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                              value={channelForm[field.key] || ''}
                              onChange={e => setChannelForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="border-0 text-sm pr-10"
                              style={{ backgroundColor: theme.input, color: theme.fg }}
                            />
                            {field.key === 'webhookUrl' && channelForm[field.key] && (
                              <button onClick={() => handleCopyWebhook(channelForm[field.key])}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded"
                                style={{ color: theme.mutedFg }}>
                                <Copy size={14} />
                              </button>
                            )}
                          </div>
                          {field.helpText && (
                            <p className="text-[10px] leading-relaxed" style={{ color: theme.mutedFg }}>{field.helpText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPlatform && (
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" style={{ borderColor: theme.border, color: theme.fg }}>Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleSaveChannel} disabled={!channelName.trim()}
                        style={{ backgroundColor: theme.accent, color: theme.bg }}>
                        <Check size={14} className="mr-1.5" />
                        {channelSettingsId ? 'Save Changes' : 'Connect Channel'}
                      </Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
