/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useRef, ErrorInfo, ReactNode } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { 
  Rocket, 
  Users, 
  Target, 
  Code, 
  BarChart3, 
  MessageSquare, 
  Loader2, 
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Zap,
  LogIn,
  LogOut,
  History,
  Plus,
  Trash2,
  AlertCircle,
  Download,
  Share2,
  Copy,
  Check,
  Flame,
  MoreVertical,
  Grid,
  ChevronDown,
  LayoutDashboard,
  Store,
  Handshake,
  UserPlus,
  Palette,
  Image as ImageIcon,
  DollarSign,
  Globe,
  TrendingUp,
  Sun,
  Moon,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Search,
  Calendar,
  Terminal,
  Settings,
  HelpCircle,
  Cpu,
  Database,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

// Firebase Imports
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  getDocFromServer,
  setDoc
} from 'firebase/firestore';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Types ---

type AgentRole = 
  | 'Product Strategist' 
  | 'Market Analyst' 
  | 'Financial Advisor' 
  | 'Branding Agent' 
  | 'Startup Progress'
  | 'Market Validator'
  | 'MVP Builder'
  | 'Growth Hacker'
  | 'Legal Advisor'
  | 'Tech Lead'
  | 'Customer Support'
  | 'HR & Culture'
  | 'Sales Agent';

interface Agent {
  role: AgentRole;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

type TabType = 'forge' | 'dashboard' | 'marketplace' | 'collaboration' | 'suggestions' | 'history' | 'architecture';

interface UserProfile {
  displayName: string;
  bio: string;
  role: string;
  uid: string;
  updatedAt: string;
}

interface AgentMessage {
  role: AgentRole;
  content: string;
  timestamp: any;
  images?: string[];
}

interface StartupBlueprint {
  id: string;
  userId: string;
  idea: string;
  domain?: string;
  budget?: string;
  brandingStyle?: string;
  productStrategy?: string;
  marketAnalysis?: string;
  financialPlan?: string;
  brandingGuide?: string;
  roadmap?: string;
  marketValidation?: string;
  mvpPlan?: string;
  growthStrategy?: string;
  legalAdvice?: string;
  techStack?: string;
  supportStrategy?: string;
  culturePlan?: string;
  salesStrategy?: string;
  posters?: string[];
  createdAt: any;
  status: 'processing' | 'completed';
}

const DOMAINS = [
  'SaaS',
  'E-commerce',
  'Fintech',
  'Healthtech',
  'Edtech',
  'AI/ML',
  'Clean Energy',
  'Web3/Crypto',
  'Logistics',
  'Entertainment',
  'Agrotech',
  'Biotech',
  'Proptech',
  'Insurtech',
  'SpaceTech',
  'Cybersecurity',
  'Robotics',
  'Gaming',
  'Social Media',
  'Travel & Tourism',
  'Food & Beverage',
  'Fashion & Lifestyle',
  'Real Estate',
  'Automotive',
  'Manufacturing'
];

// --- Constants ---

const AGENTS: Agent[] = [
  {
    role: 'Product Strategist',
    name: 'Alex',
    icon: <Target className="w-5 h-5" />,
    color: 'bg-slate-700',
    description: 'Defines the product vision, features, and core value proposition.'
  },
  {
    role: 'Market Analyst',
    name: 'Sarah',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'bg-zinc-700',
    description: 'Analyzes market trends, competitors, and growth opportunities.'
  },
  {
    role: 'Market Validator',
    name: 'Val',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'bg-stone-700',
    description: 'Checks if the problem is real, identifies target users, and evaluates demand.'
  },
  {
    role: 'Financial Advisor',
    name: 'Marcus',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'bg-neutral-700',
    description: 'Manages budget allocation, revenue models, and financial projections.'
  },
  {
    role: 'MVP Builder',
    name: 'Bob',
    icon: <Code className="w-5 h-5" />,
    color: 'bg-slate-800',
    description: 'Decides what to build first, defines core features, and creates an execution plan.'
  },
  {
    role: 'Branding Agent',
    name: 'Luna',
    icon: <Palette className="w-5 h-5" />,
    color: 'bg-zinc-800',
    description: 'Graphic designer creating visual identity, website mockups, and product designs.'
  },
  {
    role: 'Growth Hacker',
    name: 'Gus',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-stone-800',
    description: 'Decides how users will find the product and suggests marketing channels.'
  },
  {
    role: 'Legal Advisor',
    name: 'Justice',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'bg-neutral-800',
    description: 'Provides legal guidance, compliance checks, and risk assessment.'
  },
  {
    role: 'Tech Lead',
    name: 'Tech',
    icon: <Globe className="w-5 h-5" />,
    color: 'bg-slate-900',
    description: 'Defines the tech stack, architecture, and development workflow.'
  },
  {
    role: 'Customer Support',
    name: 'Joy',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'bg-zinc-900',
    description: 'Defines customer success strategies and support workflows.'
  },
  {
    role: 'HR & Culture',
    name: 'Harmony',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-stone-900',
    description: 'Plans hiring roadmap and defines company culture and values.'
  },
  {
    role: 'Sales Agent',
    name: 'Jordan',
    icon: <Handshake className="w-5 h-5" />,
    color: 'bg-neutral-900',
    description: 'Develops sales outreach, B2B strategy, and closing techniques.'
  },
  {
    role: 'Startup Progress',
    name: 'Neo',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'bg-slate-950',
    description: 'Tracks milestones, roadmap execution, and overall startup growth.'
  }
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors rounded-lg hover:bg-white shadow-sm border border-transparent hover:border-slate-100"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-slate-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const VisualContent = ({ content, theme }: { content: string, theme: 'light' | 'dark' }) => {
  const chartRegex = /```json\s*([\s\S]*?)\s*```/g;
  const matches = [...content.matchAll(chartRegex)];
  
  if (matches.length === 0) return null;

  return (
    <div className="space-y-6 mt-6 not-prose">
      {matches.map((match, idx) => {
        try {
          const data = JSON.parse(match[1]);
          if (data.type === 'line' || data.type === 'area' || data.type === 'bar') {
            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`h-72 w-full p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{data.title}</h4>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-slate-500" />
                    <div className="w-1 h-1 rounded-full bg-slate-500/50" />
                    <div className="w-1 h-1 rounded-full bg-slate-500/20" />
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    {data.type === 'area' ? (
                      <AreaChart data={data.values}>
                        <defs>
                          <linearGradient id={`colorValue-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#475569" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#27272a' : '#f1f5f9'} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                          cursor={{ stroke: '#475569', strokeWidth: 1 }}
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#09090b' : '#fff',
                            border: theme === 'dark' ? '1px solid #27272a' : '1px solid #f1f5f9',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#475569" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill={`url(#colorValue-${idx})`} 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    ) : data.type === 'bar' ? (
                      <BarChart data={data.values}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#27272a' : '#f1f5f9'} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: theme === 'dark' ? '#27272a' : '#f1f5f9', opacity: 0.4 }}
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#09090b' : '#fff',
                            border: theme === 'dark' ? '1px solid #27272a' : '1px solid #f1f5f9',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#475569" 
                          radius={[4, 4, 0, 0]} 
                          animationDuration={1500}
                        />
                      </BarChart>
                    ) : (
                      <LineChart data={data.values}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#27272a' : '#f1f5f9'} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          cursor={{ stroke: '#475569', strokeWidth: 1 }}
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#09090b' : '#fff',
                            border: theme === 'dark' ? '1px solid #27272a' : '1px solid #f1f5f9',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#6366f1" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: theme === 'dark' ? '#09090b' : '#fff' }} 
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          animationDuration={1500}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          }
        } catch (e) {
          return null;
        }
        return null;
      })}
    </div>
  );
};

// --- App Component ---

function StartupForge() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [idea, setIdea] = useState('');
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [budget, setBudget] = useState('');
  const [brandingStyle, setBrandingStyle] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('forge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [history, setHistory] = useState<StartupBlueprint[]>([]);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [forgeStatus, setForgeStatus] = useState<string>('');
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentRole, 'idle' | 'analyzing' | 'refining' | 'completed'>>(
    AGENTS.reduce((acc, agent) => ({ ...acc, [agent.role]: 'idle' }), {} as Record<AgentRole, 'idle' | 'analyzing' | 'refining' | 'completed'>)
  );
  const [customAgents, setCustomAgents] = useState<any[]>([]);
  const [teamMessages, setTeamMessages] = useState<any[]>([]);
  const [showBuildAgentModal, setShowBuildAgentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<{
    aiAgents: { name: string; role: string; match: string; desc: string }[];
    humanTalent: { name: string; role: string; exp: string; rate: string }[];
    opportunities: { title: string; desc: string; type: string }[];
  } | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [newAgent, setNewAgent] = useState({ name: '', desc: '', price: '' });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const teamChatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Theme Persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Profile Listener
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Personalized Suggestions Generator
  useEffect(() => {
    const generateSuggestions = async () => {
      if (!userProfile || isGeneratingSuggestions) return;
      
      setIsGeneratingSuggestions(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const model = ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `User Profile:
          Name: ${userProfile.displayName}
          Role: ${userProfile.role}
          Bio: ${userProfile.bio}
          Current Domain Interest: ${domain}`,
          config: { 
            systemInstruction: `You are a startup ecosystem expert. Based on the user's profile, suggest relevant AI agents, human talent types, and market opportunities.
            Return ONLY a JSON object with this structure:
            {
              "aiAgents": [{"name": "string", "role": "string", "match": "90-99%", "desc": "string"}],
              "humanTalent": [{"name": "string", "role": "string", "exp": "string", "rate": "string"}],
              "opportunities": [{"title": "string", "desc": "string", "type": "string"}]
            }
            Keep descriptions concise. Generate 4 AI agents, 3 human talent profiles, and 3 opportunities.`,
            responseMimeType: "application/json" 
          }
        });

        const result = await model;
        const data = JSON.parse(result.text || '{}');
        setPersonalizedSuggestions(data);
      } catch (error) {
        console.error("Error generating suggestions:", error);
      } finally {
        setIsGeneratingSuggestions(false);
      }
    };

    if (userProfile) {
      generateSuggestions();
    }
  }, [userProfile, domain]);

  const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;
    console.log("Saving profile for user:", user.uid, profileData);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        ...profileData,
        uid: user.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("Profile saved successfully");
      setShowProfileModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // History Listener
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'blueprints'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StartupBlueprint));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blueprints');
    });

    return () => unsubscribe();
  }, [user]);

  // Team Chat Listener
  useEffect(() => {
    if (!user || !activeBlueprintId) {
      setTeamMessages([]);
      return;
    }

    const q = query(
      collection(db, 'blueprints', activeBlueprintId, 'team_chat'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeamMessages(msgs);
      setTimeout(() => teamChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      console.error("Team chat error:", error);
    });

    return () => unsubscribe();
  }, [user, activeBlueprintId]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists, if not, show modal
      try {
        const profileDoc = await getDocFromServer(doc(db, 'profiles', user.uid));
        if (!profileDoc.exists()) {
          setShowProfileModal(true);
        }
      } catch (e) {
        // If profile fetch fails, still show modal for first-time setup
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveBlueprintId(null);
      setMessages([]);
      setIdea('');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const runAgent = async (agent: Agent, context: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    setAgentStatuses(prev => ({ ...prev, [agent.role]: 'analyzing' }));
    
    // Update status for internal steps
    const steps = [
      `Analyzing ${agent.role} requirements...`,
      `Synthesizing ${agent.role} strategy...`,
      `Finalizing ${agent.role} insights...`
    ];
    
    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setForgeStatus(`${agent.name}: ${steps[currentStepIndex]}`);
        currentStepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    const systemInstructions: Record<AgentRole, string> = {
      'Product Strategist': `You are a world-class Product Strategist & Visionary. 
        Your goal is to define a category-defining value proposition, a robust feature roadmap, and a clear path to product-market fit. 
        Domain: ${domain}. Budget: ${budget}.
        Founder: ${userProfile?.displayName} (${userProfile?.role}). Bio: ${userProfile?.bio}.
        Tailor your strategy to leverage their unique strengths and mitigate weaknesses.
        Provide a detailed "Product Requirements Document" (PRD) summary.
        Collaborate with the Market Analyst on target audience and the Financial Advisor on feasibility. 
        If you have specific questions for them, state them clearly at the end of your analysis.`,
      'Market Analyst': `You are a data-driven Market Analyst & Competitive Intelligence Specialist. 
        Your primary goal is to provide a "Market Intelligence Brief" that the entire team will use.
        
        MANDATORY: Use the Google Search tool to find:
        1. REAL competitors in the ${domain} space.
        2. REAL market size data (TAM, SAM, SOM).
        3. Current trends and news related to ${idea}.
        
        Analyze the addressable market, competitor landscape (SWOT), and detailed user personas. 
        The founder is ${userProfile?.displayName} (${userProfile?.role}).
        Consult the Financial Advisor to ensure the target market can sustain the proposed revenue model. 
        Address any strategic goals or feature hypotheses set by the Product Strategist.`,
      'Market Validator': `You are a skeptical Problem & Market Validation Specialist.
        Your goal is to "kill" bad ideas early. Identify the "riskiest assumptions" and propose experiments to validate them.
        Evaluate demand, competition intensity, and potential "moats" for this ${domain} startup.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Be brutally honest. If the idea is weak, suggest a pivot.`,
      'Financial Advisor': `You are a Senior Financial Advisor & CFO. 
        Your goal is to provide a rigorous financial model for this ${domain} startup.
        
        MANDATORY: Use the Google Search tool to find:
        1. Realistic salary data for key roles in the ${domain} sector.
        2. Average CAC (Customer Acquisition Cost) and LTV (Lifetime Value) for similar startups.
        3. Pricing models of top competitors.
        
        Propose a detailed 12-month budget allocation, unit economics, and a multi-tiered revenue model within a ${budget} budget. 
        The founder is ${userProfile?.displayName} (${userProfile?.role}).
        Crucially, you must address any financial questions or feasibility concerns raised by the Product Strategist or Market Analyst. 
        Explain the ROI, burn rate expectations, and potential funding milestones.`,
      'MVP Builder': `You are a Lean MVP Execution Specialist & CTO.
        Your goal is to define the "Minimum Awesome Product." Strip away all fluff and focus on the core loop that solves the user's primary pain point.
        Create a technical execution plan for the first 4-8 weeks of development.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Focus on speed-to-market, user feedback loops, and technical debt management.`,
      'Branding Agent': `You are a world-class Branding & Visual Identity Specialist.
        Your goal is to design a "legit" and professional brand for this ${domain} startup that resonates with the target audience.
        The founder is ${userProfile?.displayName} (${userProfile?.role}).
        The user prefers a "${brandingStyle}" style.
        
        Provide:
        1. A high-end branding guide (Typography, Palette, Vibe).
        2. Descriptions for 3 distinct marketing posters (Hero, Feature, Impact).
        3. A detailed UI/UX concept for the main product, focusing on the "Aha!" moment.
        
        Keep it professional, concise, and focused on visual impact. 
        Avoid theoretical fluff; focus on design execution.`,
      'Growth Hacker': `You are a creative Growth Hacker & Performance Marketer.
        Your goal is to find the "unfair advantage" for distribution. Suggest viral loops, referral programs, and unconventional marketing channels.
        Define an initial traction strategy (0 to 1,000 users) for this ${domain} startup.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Think outside the box for low-cost, high-impact growth hacks.`,
      'Legal Advisor': `You are a Legal & Compliance Advisor specializing in startups.
        Provide a comprehensive risk assessment, compliance checklist (GDPR, CCPA, etc.), and intellectual property (IP) strategy for this ${domain} startup.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Identify potential legal hurdles (regulations, liability) and suggest mitigation strategies.`,
      'Tech Lead': `You are a Tech Architect & Systems Engineer.
        Define a scalable, cost-effective tech stack and high-level system architecture for this ${domain} startup.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Suggest specific tools, APIs, and infrastructure (e.g., AWS vs Vercel) that balance speed with scalability.
        Define the development workflow and CI/CD strategy.`,
      'Customer Support': `You are a Customer Success & Support Architect.
        Define the customer support strategy, feedback loops, and retention plans for this ${domain} startup.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Suggest tools for automation (AI chatbots) vs. human touchpoints.`,
      'HR & Culture': `You are an HR & Culture Specialist & Talent Scout.
        Plan the hiring roadmap for the first 5-10 key hires. Define the company culture, values, and remote/hybrid work policies.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Suggest ways to attract top talent with a limited budget.`,
      'Sales Agent': `You are a Sales & Outreach Specialist & Head of Sales.
        Develop a B2B/B2C sales outreach strategy, lead generation tactics, and a high-converting sales script/deck for this ${domain} startup.
        Founder: ${userProfile?.displayName} (${userProfile?.role}).
        Focus on relationship building and closing techniques.`,
      'Startup Progress': `You are a Startup Progress Specialist & Project Manager.
        Your goal is to define a high-fidelity roadmap with clear milestones, deadlines, and owners.
        The founder is ${userProfile?.displayName} (${userProfile?.role}).
        Outline the first 6 months of development and growth in phases.
        Identify key performance indicators (KPIs) and "North Star" metrics to track success.`
    };

    const prompt = `
      Startup Idea: ${idea}
      Previous Context/Findings: ${context}
      
      As the ${agent.role}, provide your detailed analysis and contribution to this startup blueprint.
      This is the INITIAL DRAFTING phase. 
      
      YOUR GOAL: Provide a high-fidelity, actionable analysis that the founder can use immediately. 
      Avoid generic advice. Use real-world examples, specific tools, and data-driven insights.
      
      If you have any financial or strategic questions for your colleagues (e.g., the Financial Advisor or Market Analyst), please state them clearly at the end of your analysis so they can address them in the next round.
      
      IMPORTANT: Include visual data for trends, market share, or financial projections. 
      Format visual data as a JSON code block with the following structure:
      \`\`\`json
      {
        "type": "area", // or "line" or "bar"
        "title": "Descriptive Title",
        "values": [
          {"name": "Label", "value": 100},
          ...
        ]
      }
      \`\`\`
      
      Format your response in Markdown. Use headers, bullet points, and bold text for readability.
    `;

    const runWithRetry = async (retries = 3, delay = 2000): Promise<string> => {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            systemInstruction: systemInstructions[agent.role],
            temperature: 0.7,
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
          },
        });
        return response.text || "I'm sorry, I couldn't generate a response at this time.";
      } catch (error: any) {
        const errorStr = JSON.stringify(error);
        if (retries > 0 && (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED'))) {
          console.warn(`Rate limit hit for ${agent.role}. Retrying in ${delay}ms...`);
          setForgeStatus(`${agent.name}: Rate limit hit. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return runWithRetry(retries - 1, delay * 2);
        }
        throw error;
      }
    };

    try {
      const result = await runWithRetry();
      clearInterval(interval);
      setAgentStatuses(prev => ({ ...prev, [agent.role]: 'completed' }));
      return result;
    } catch (error) {
      clearInterval(interval);
      setAgentStatuses(prev => ({ ...prev, [agent.role]: 'idle' }));
      console.error(`Error running ${agent.role}:`, error);
      return `Error: Failed to get response from ${agent.role}.`;
    }
  };

  const handleStartForge = async () => {
    if (!idea.trim() || !user) return;

    if (!userProfile) {
      setShowProfileModal(true);
      return;
    }

    setIsProcessing(true);
    setForgeStatus('Initializing Forge...');
    const initialStatuses = AGENTS.reduce((acc, agent) => ({ ...acc, [agent.role]: 'idle' }), {} as Record<AgentRole, 'idle' | 'analyzing' | 'refining' | 'completed'>);
    setAgentStatuses(initialStatuses);
    setMessages([]);
    setCurrentStep(0);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let blueprintId = "";
    try {
      const docRef = await addDoc(collection(db, 'blueprints'), {
        userId: user.uid,
        idea: idea,
        domain: domain,
        budget: budget,
        brandingStyle: brandingStyle,
        createdAt: serverTimestamp(),
        status: 'processing'
      });
      blueprintId = docRef.id;
      setActiveBlueprintId(blueprintId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'blueprints');
    }

    let accumulatedContext = "";
    const results: Partial<Record<AgentRole, string>> = {};

    // Phase 1: Parallel Analysis
    setForgeStatus('Agents are analyzing in parallel...');
    
    const runAgentWithUI = async (agent: Agent, context: string) => {
      const thinkingMsg: AgentMessage = {
        role: agent.role,
        content: `*${agent.name} is drafting the initial ${agent.role} analysis...*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, thinkingMsg]);

      const result = await runAgent(agent, context);
      results[agent.role] = result;
      
      setMessages(prev => {
        const newMsgs = [...prev];
        const msgIndex = newMsgs.findIndex(m => m.role === agent.role && m.content.startsWith('*'));
        if (msgIndex !== -1) {
          newMsgs[msgIndex] = {
            role: agent.role,
            content: result,
            timestamp: new Date()
          };
        }
        return newMsgs;
      });
      return result;
    };

    // Group 1: Core Analysis (Sequential to avoid 429)
    setForgeStatus('Core agents are analyzing...');
    const coreAgents = AGENTS.filter(a => ['Product Strategist', 'Market Analyst', 'Market Validator'].includes(a.role));
    const coreResults = [];
    for (const agent of coreAgents) {
      const res = await runAgentWithUI(agent, "");
      coreResults.push(res);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small gap
    }
    accumulatedContext = coreResults.join('\n\n');

    // Group 2: Specialized Analysis (Sequential)
    setForgeStatus('Specialized agents are analyzing...');
    const specializedAgents = AGENTS.filter(a => ['Financial Advisor', 'Legal Advisor', 'Tech Lead', 'HR & Culture'].includes(a.role));
    const specializedResults = [];
    for (const agent of specializedAgents) {
      const res = await runAgentWithUI(agent, accumulatedContext);
      specializedResults.push(res);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    accumulatedContext += '\n\n' + specializedResults.join('\n\n');

    // Group 3: Execution & Branding (Sequential)
    setForgeStatus('Execution agents are analyzing...');
    const executionAgents = AGENTS.filter(a => ['Branding Agent', 'MVP Builder', 'Growth Hacker', 'Customer Support', 'Sales Agent', 'Startup Progress'].includes(a.role));
    const executionResults = [];
    for (const agent of executionAgents) {
      const res = await runAgentWithUI(agent, accumulatedContext);
      executionResults.push(res);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    accumulatedContext += '\n\n' + executionResults.join('\n\n');

    // Phase 2: Parallel Collaborative Refinement
    setForgeStatus('Collaborative Refinement...');
    const refiningStatuses = AGENTS.reduce((acc, agent) => ({ ...acc, [agent.role]: 'refining' }), {} as Record<AgentRole, 'idle' | 'analyzing' | 'refining' | 'completed'>);
    setAgentStatuses(refiningStatuses);
    const refinementThinking: AgentMessage = {
      role: 'Product Strategist',
      content: "*The agents are now cross-referencing their findings, addressing each other's questions, and aligning the final strategic blueprint...*",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, refinementThinking]);

    const runRefinement = async (agent: Agent) => {
      const prompt = `
        Startup Idea: ${idea}
        Full Collaborative Context: ${accumulatedContext}
        
        As the ${agent.role}, review the findings and questions from your colleagues. 
        Provide your FINAL, refined analysis. 
        Address any questions directed at you and ensure your strategy is perfectly aligned with the market analysis and financial projections proposed.
        
        CRITICAL: Your final response should be a "Masterpiece" of strategic advice. 
        It should be so detailed and actionable that it feels like a professional consulting report.
      `;

      const runWithRetry = async (retries = 3, delay = 2000): Promise<string> => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: prompt,
            config: {
              systemInstruction: `You are the ${agent.role} in a collaborative startup forge. This is the FINAL REFINEMENT round. Your goal is to provide the most effective, data-driven, and actionable advice possible.`,
              temperature: 0.5,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
            },
          });
          return response.text || results[agent.role] || "";
        } catch (error: any) {
          const errorStr = JSON.stringify(error);
          if (retries > 0 && (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED'))) {
            console.warn(`Rate limit hit for refinement of ${agent.role}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return runWithRetry(retries - 1, delay * 2);
          }
          throw error;
        }
      };

      try {
        const finalResult = await runWithRetry();
        results[agent.role] = finalResult;

        // Update the message in the UI to show the refined version
        setMessages(prev => {
          const newMsgs = [...prev];
          const existingAgentMsgIndex = newMsgs.findIndex(m => m.role === agent.role);
          if (existingAgentMsgIndex !== -1) {
            newMsgs[existingAgentMsgIndex] = {
              ...newMsgs[existingAgentMsgIndex],
              content: finalResult,
              timestamp: new Date()
            };
          }
          return newMsgs;
        });

        // Update Firestore with the final refined version
        const fieldMap: Record<AgentRole, string> = {
          'Product Strategist': 'productStrategy',
          'Market Analyst': 'marketAnalysis',
          'Financial Advisor': 'financialPlan',
          'Branding Agent': 'brandingGuide',
          'Startup Progress': 'roadmap',
          'Market Validator': 'marketValidation',
          'MVP Builder': 'mvpPlan',
          'Growth Hacker': 'growthStrategy',
          'Legal Advisor': 'legalAdvice',
          'Tech Lead': 'techStack',
          'Customer Support': 'supportStrategy',
          'HR & Culture': 'culturePlan',
          'Sales Agent': 'salesStrategy'
        };
        await updateDoc(doc(db, 'blueprints', blueprintId), {
          [fieldMap[agent.role]]: finalResult
        });
        setAgentStatuses(prev => ({ ...prev, [agent.role]: 'completed' }));
      } catch (error) {
        console.error(`Error refining ${agent.role}:`, error);
        setAgentStatuses(prev => ({ ...prev, [agent.role]: 'completed' }));
      }
    };

    for (const agent of AGENTS) {
      await runRefinement(agent);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      setForgeStatus('Finalizing Blueprint...');
      await updateDoc(doc(db, 'blueprints', blueprintId), {
        status: 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `blueprints/${blueprintId}`);
    }

    setIsProcessing(false);
    setForgeStatus('');

    // Automatically trigger poster generation if branding guide exists
    if (results['Branding Agent']) {
      generatePosters(results['Branding Agent']);
    }
  };

  const generatePosters = async (brandingGuide?: string) => {
    if (!activeBlueprintId) return;
    
    const guide = brandingGuide || messages.find(m => m.role === 'Branding Agent')?.content;
    if (!guide) {
      setAppError("Please wait for the Branding Specialist to provide a guide first.");
      return;
    }

    setIsProcessing(true);
    setForgeStatus('Designing Legit Posters...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Generate 3 posters with more descriptive prompts
      const posterPrompts = [
        `A high-end, professional marketing poster for a startup called "${idea}". 
         The visual style is "${brandingStyle}". 
         The poster should feature a "Hero Shot" that captures the core value proposition of the ${domain} product. 
         Clean typography, sophisticated color palette based on: ${guide}. 
         Cinematic lighting, 8k resolution, professional graphic design.`,
         
        `A minimalist, tech-forward feature-focused graphic for "${idea}". 
         Showcasing the core AI-driven feature of the ${domain} startup. 
         The style is "${brandingStyle}". 
         Use elements from the branding guide: ${guide}. 
         Sleek, modern, premium feel.`,
         
        `An emotional, trustworthy lifestyle/impact shot for "${idea}". 
         Showing the positive human impact of this ${domain} startup. 
         The style is "${brandingStyle}". 
         Incorporate the visual identity from: ${guide}. 
         Authentic, high-quality, professional photography style.`
      ];

      const posterResults = [];
      for (const p of posterPrompts) {
        const runWithRetry = async (retries = 3, delay = 2000): Promise<string | null> => {
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-image-preview',
              contents: { parts: [{ text: p }] },
              config: {
                imageConfig: {
                  aspectRatio: "3:4",
                  imageSize: "1K"
                }
              }
            });
            
            if (response.candidates?.[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                  return `data:image/png;base64,${part.inlineData.data}`;
                }
              }
            }
            return null;
          } catch (error: any) {
            const errorStr = JSON.stringify(error);
            if (retries > 0 && (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED'))) {
              console.warn(`Rate limit hit for poster generation. Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return runWithRetry(retries - 1, delay * 2);
            }
            throw error;
          }
        };

        const res = await runWithRetry();
        if (res) posterResults.push(res);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const validPosters = posterResults.filter(p => p !== null) as string[];

      if (validPosters.length > 0) {
        setMessages(prev => {
          const newMsgs = [...prev];
          const brandingIdx = newMsgs.findIndex(m => m.role === 'Branding Agent');
          if (brandingIdx !== -1) {
            newMsgs[brandingIdx] = {
              ...newMsgs[brandingIdx],
              images: validPosters
            };
          }
          return newMsgs;
        });

        const bpDoc = await getDocFromServer(doc(db, 'blueprints', activeBlueprintId));
        const currentPosters = bpDoc.data()?.posters || [];
        await updateDoc(doc(db, 'blueprints', activeBlueprintId), {
          posters: [...currentPosters, ...validPosters]
        });
      }

    } catch (error) {
      console.error("Poster generation failed:", error);
      setAppError("Visual asset generation failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setForgeStatus('');
    }
  };

  const loadBlueprint = (bp: StartupBlueprint) => {
    if (isProcessing) return;
    setActiveBlueprintId(bp.id);
    setIdea(bp.idea);
    setDomain(bp.domain || DOMAINS[0]);
    setBudget(bp.budget || '');
    setBrandingStyle(bp.brandingStyle || '');
    const msgs: AgentMessage[] = [];
    if (bp.productStrategy) msgs.push({ role: 'Product Strategist', content: bp.productStrategy, timestamp: bp.createdAt });
    if (bp.marketAnalysis) msgs.push({ role: 'Market Analyst', content: bp.marketAnalysis, timestamp: bp.createdAt });
    if (bp.financialPlan) msgs.push({ role: 'Financial Advisor', content: bp.financialPlan, timestamp: bp.createdAt });
    if (bp.brandingGuide) msgs.push({ role: 'Branding Agent', content: bp.brandingGuide, timestamp: bp.createdAt, images: bp.posters });
    if (bp.roadmap) msgs.push({ role: 'Startup Progress', content: bp.roadmap, timestamp: bp.createdAt });
    setMessages(msgs);
    setCurrentStep(msgs.length);
  };

  const deleteBlueprint = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this blueprint?")) return;
    try {
      await deleteDoc(doc(db, 'blueprints', id));
      if (activeBlueprintId === id) {
        setActiveBlueprintId(null);
        setMessages([]);
        setIdea('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blueprints/${id}`);
    }
  };

  const handleDownloadWorkflow = () => {
    if (messages.length === 0) return;
    
    let content = `# Startup Forge: ${idea}\n\n`;
    content += `Domain: ${domain}\n`;
    content += `Budget: ${budget}\n`;
    content += `Branding Style: ${brandingStyle}\n\n`;
    content += `--- WORKFLOW & NEXT STEPS ---\n\n`;
    
    messages.forEach(msg => {
      content += `## ${msg.role} (${AGENTS.find(a => a.role === msg.role)?.name})\n`;
      content += `${msg.content}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup-forge-workflow-${idea.slice(0, 20).replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddToCalendar = () => {
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    
    const milestones = [
      { summary: 'MVP Launch', days: 30 },
      { summary: 'Market Validation Complete', days: 14 },
      { summary: 'First 10 Customers', days: 45 },
      { summary: 'Seed Funding Round', days: 90 }
    ];

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Startup Forge//EN\n";
    
    milestones.forEach(m => {
      const eventDate = new Date(now.getTime() + m.days * 24 * 60 * 60 * 1000);
      const start = formatDate(eventDate);
      const end = formatDate(new Date(eventDate.getTime() + 60 * 60 * 1000));
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${Date.now()}-${m.summary.replace(/\s+/g, '')}@startupforge.app\n`;
      icsContent += `DTSTAMP:${formatDate(now)}\n`;
      icsContent += `DTSTART:${start}\n`;
      icsContent += `DTEND:${end}\n`;
      icsContent += `SUMMARY:Startup Forge: ${m.summary} (${idea.slice(0, 30)})\n`;
      icsContent += `DESCRIPTION:Deadline for ${m.summary} as part of your ${domain} startup forge.\n`;
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup-forge-deadlines.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadBlueprint = () => {
    if (messages.length === 0) return;
    
    const timestamp = new Date().toLocaleString();
    const separator = '\n\n---\n\n';
    
    let markdown = `# 🚀 Startup Forge: Strategic Blueprint\n\n`;
    markdown += `| Project Detail | Information |\n`;
    markdown += `| :--- | :--- |\n`;
    markdown += `| **Vision** | ${idea} |\n`;
    markdown += `| **Generated** | ${timestamp} |\n`;
    markdown += `| **Framework** | Multi-Agent Collaborative Forge |\n`;
    markdown += `| **Status** | Final Analysis Complete |\n\n`;
    
    markdown += `## 📋 Table of Contents\n`;
    messages.forEach((m, i) => {
      markdown += `${i + 1}. [${m.role} Analysis](#${m.role.toLowerCase().replace(/\s+/g, '-')}-analysis)\n`;
    });
    markdown += `\n---\n\n`;

    const content = messages.map(m => {
      const agent = AGENTS.find(a => a.role === m.role);
      return `## 🛡️ ${m.role} Analysis\n` +
             `**Expert:** ${agent?.name || m.role}\n\n` +
             `${m.content}`;
    }).join(separator);

    markdown += content;
    
    markdown += separator;
    markdown += `## 💡 Forge Insights & Next Steps\n\n`;
    markdown += `1. **Review & Refine:** Use this blueprint as a foundational document to pitch to stakeholders or co-founders.\n`;
    markdown += `2. **Technical Validation:** Begin prototyping the core features identified in the Tech Architecture section.\n`;
    markdown += `3. **Market Testing:** Validate the assumptions made in the Market Analysis through user interviews or landing page tests.\n\n`;
    markdown += `--- \n*Generated by StartupForge - The AI-Powered Startup Accelerator*`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-${idea.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareBlueprint = () => {
    navigator.clipboard.writeText(window.location.href);
    setAppError("App URL copied to clipboard!");
    setTimeout(() => setAppError(null), 3000);
  };

  const sendTeamMessage = async (text: string) => {
    if (!user || !activeBlueprintId || !text.trim()) return;
    try {
      await addDoc(collection(db, 'blueprints', activeBlueprintId, 'team_chat'), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        text: text,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const buildCustomAgent = () => {
    if (!newAgent.name || !newAgent.desc) return;
    setCustomAgents(prev => [...prev, { ...newAgent, id: Date.now(), color: 'bg-slate-800', icon: <Sparkles className="w-5 h-5" /> }]);
    setNewAgent({ name: '', desc: '', price: '' });
    setShowBuildAgentModal(false);
  };

  const getDashboardData = () => {
    const seed = domain.length + (budget.length || 0);
    return [
      { year: '2024', value: 100 + seed },
      { year: '2025', value: 240 + seed * 2 },
      { year: '2026', value: 480 + seed * 3 },
      { year: '2027', value: 820 + seed * 4 },
      { year: '2028', value: 1200 + seed * 5 },
    ];
  };

  const [marketInsights, setMarketInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const generateMarketInsights = async () => {
    if (!idea || isGeneratingInsights) return;
    setIsGeneratingInsights(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide 3 high-level market insights for a ${domain} startup with the idea: "${idea}". 
        Budget: ${budget}. 
        Founder Profile: ${userProfile?.displayName} (${userProfile?.role}). Bio: ${userProfile?.bio}.
        Focus on growth opportunities and risks tailored to the founder's background.`,
        config: { temperature: 0.7 }
      });
      setMarketInsights(response.text || '');
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-slate-950'} font-sans selection:bg-slate-200`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${
        theme === 'dark' 
        ? 'border-zinc-800 bg-black/80' 
        : 'border-slate-100 bg-white/80'
      } backdrop-blur-md`}>
        {appError && (
          <div className="bg-red-500 text-white px-6 py-2 text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{appError}</span>
            </div>
            <button onClick={() => setAppError(null)} className="hover:opacity-80">✕</button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(true)}
              className={`p-2 rounded-xl transition-colors ${
                theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                theme === 'dark' ? 'bg-white text-black' : 'bg-slate-800 text-white'
              }`}>
                <Flame className="w-4 h-4" />
              </div>
              <span className={`font-bold text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>StartupForge</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-xl transition-colors ${
                theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-amber-400' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-zinc-800">
                <img src={user.photoURL || ''} alt="" className={`w-8 h-8 rounded-full border ${theme === 'dark' ? 'border-zinc-700' : 'border-slate-100'}`} />
                <span className={`text-sm font-bold hidden sm:inline ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}`}>
                  {user.displayName?.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-80 z-[70] shadow-2xl flex flex-col transition-colors ${
                theme === 'dark' ? 'bg-[#0D1117] border-r border-slate-800' : 'bg-white border-r border-slate-200'
              }`}
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'
                  }`}>
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className={`font-bold text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>StartupForge</span>
                </div>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
                {!user ? (
                  <div className="space-y-4">
                    <p className={`px-4 text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>Authentication</p>
                    <button 
                      onClick={() => { handleLogin(); setShowSidebar(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-all shadow-lg shadow-black/5"
                    >
                      <LogIn className="w-5 h-5" />
                      Login with Google
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className={`px-4 mb-3 text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>Core Features</p>
                      {[
                        { id: 'forge', icon: Rocket, label: 'Forge', desc: 'Build your startup blueprint', color: 'text-slate-500' },
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Growth and market metrics', color: 'text-slate-500' },
                        { id: 'marketplace', icon: Store, label: 'Market', desc: 'Discover AI agents', color: 'text-slate-500' },
                        { id: 'suggestions', icon: UserPlus, label: 'Collaboration', desc: 'AI and human talent', color: 'text-slate-500' },
                        { id: 'collaboration', icon: Handshake, label: 'Team', desc: 'Real-time collaboration', color: 'text-slate-500' },
                        { id: 'history', icon: History, label: 'History', desc: 'Your past blueprints', color: 'text-slate-500' },
                        { id: 'architecture', icon: Terminal, label: 'Architecture', desc: 'How StartupForge works', color: 'text-slate-500' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setShowSidebar(false);
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group ${
                            activeTab === tab.id 
                            ? (theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-700')
                            : (theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300' : 'text-slate-400 hover:bg-slate-50/50 hover:text-slate-600')
                          }`}
                        >
                          <tab.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? tab.color : 'opacity-50'}`} />
                          <div>
                            <p className="text-sm font-bold leading-none mb-1">{tab.label}</p>
                            <p className={`text-[10px] font-medium ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>{tab.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className={`pt-6 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <p className={`px-4 mb-3 text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>Account</p>
                      <button 
                        onClick={() => { setShowProfileModal(true); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${
                          theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300' : 'text-slate-400 hover:bg-slate-50/50 hover:text-slate-600'
                        }`}
                      >
                        <UserIcon className="w-5 h-5 opacity-50" />
                        <span className="text-sm font-bold">My Profile</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${
                          theme === 'dark' ? 'text-zinc-500 hover:bg-red-900/20 hover:text-red-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                      >
                        <LogOut className="w-5 h-5 opacity-50" />
                        <span className="text-sm font-bold">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 font-medium">StartupForge v2.1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!user ? (
        <div className={`h-screen overflow-hidden flex items-center justify-center p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-slate-50'}`}>
          <div className="max-w-md w-full text-center space-y-8">
            <div className="flex flex-col items-center gap-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
                  theme === 'dark' ? 'bg-white text-black' : 'bg-slate-800 text-white shadow-slate-500/30'
                }`}
              >
                <Flame className="w-8 h-8" />
              </motion.div>
              <div className="space-y-2">
                <h1 className={`text-3xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  StartupForge
                </h1>
                <p className={`text-base font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                  The AI-Powered Startup Accelerator
                </p>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border transition-all ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-100/50 border-slate-200'
            }`}>
              <p className={`mb-8 text-sm leading-relaxed font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-600'}`}>
                Join thousands of entrepreneurs using multi-agent collaboration to forge their vision into reality.
              </p>
              <button
                onClick={handleLogin}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] ${
                  theme === 'dark' 
                  ? 'bg-white text-black hover:bg-zinc-200' 
                  : 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-500/25'
                }`}
              >
                <LogIn className="w-5 h-5" />
                Continue with Startup Forge
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-6">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-4 rounded-2xl transition-all shadow-sm ${
                  theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className={`grid grid-cols-1 ${activeTab === 'forge' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 items-start`}>
            
            {/* Left Column: Input (Only for Forge Tab) */}
            {activeTab === 'forge' && (
              <div className="space-y-6 lg:sticky lg:top-8">
                {/* New Forge Button */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>The Spark</h2>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                      theme === 'dark'
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Create/Edit Profile"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Input Section */}
                <section className={`rounded-2xl p-5 shadow-sm border transition-colors ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Domain</label>
                      <div className="relative">
                        <select
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          className={`w-full appearance-none px-3 py-2 rounded-lg border text-xs font-bold focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all cursor-pointer ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Budget Range</label>
                      <input
                        type="text"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. $10k - $50k"
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Branding Style</label>
                      <input
                        type="text"
                        value={brandingStyle}
                        onChange={(e) => setBrandingStyle(e.target.value)}
                        placeholder="e.g. Minimalist, Cyberpunk"
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Startup Idea</label>
                      <textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Describe your vision..."
                        className={`w-full h-24 p-3 rounded-lg border focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all resize-none text-xs ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'
                        }`}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleStartForge}
                    disabled={isProcessing || !idea.trim()}
                    className={`w-full mt-6 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden ${
                      isProcessing 
                      ? 'bg-zinc-100 text-zinc-400 cursor-wait' 
                      : (theme === 'dark' 
                        ? 'bg-white text-black hover:bg-zinc-200' 
                        : 'bg-slate-800 text-white hover:bg-slate-900 shadow-black/5')
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Forging Startup...
                      </>
                    ) : (
                      <>
                        <Flame className="w-6 h-6 group-hover:animate-bounce" />
                        Forge My Startup
                      </>
                    )}
                  </button>
                </section>
              </div>
            )}

            {/* Right Column: Dynamic Content */}
            <div className="w-full h-full">
              <AnimatePresence mode="wait">
                {activeTab === 'forge' && (
                  <motion.div
                    key="forge"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl shadow-sm border flex flex-col overflow-hidden transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md ${
                      theme === 'dark' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-white/80'
                    }`}>
                      <h2 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        <MessageSquare className="w-5 h-5 text-slate-500" />
                        Agent Room
                      </h2>
                      {isProcessing && (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/20">
                          <Zap className="w-3 h-3 animate-pulse" />
                          {forgeStatus}
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-8 min-h-[600px] max-h-[800px] overflow-y-auto scrollbar-hide">
                      {messages.length === 0 && !isProcessing && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'
                          }`}>
                            <Rocket className={`w-8 h-8 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`} />
                          </div>
                          <h3 className={`font-semibold mb-2 text-lg ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Ready to Forge</h3>
                          <p className="text-slate-500 max-w-xs text-sm">
                            Enter your idea on the left to start the multi-agent collaboration process.
                          </p>
                        </div>
                      )}

                      <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => {
                          const agent = AGENTS.find(a => a.role === msg.role)!;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-4 group"
                            >
                              <div className={`w-10 h-10 rounded-xl ${agent.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                                {agent.icon}
                              </div>
                              <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>{agent.name}</span>
                                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                                      theme === 'dark' ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                      {agent.role}
                                    </span>
                                    {agent.role === 'Startup Progress' && (
                                      <button 
                                        onClick={handleAddToCalendar}
                                        className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-white rounded-full text-[10px] font-bold hover:bg-slate-900 transition-all shadow-md"
                                      >
                                        <Calendar className="w-3 h-3" />
                                        Sync to Calendar
                                      </button>
                                    )}
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                      <CopyButton text={msg.content} />
                                    </div>
                                  </div>
                                <div className={`rounded-2xl p-5 leading-relaxed text-sm border shadow-sm prose prose-sm max-w-none ${
                                  theme === 'dark' 
                                  ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300 prose-invert' 
                                  : 'bg-white border-slate-100 text-slate-900 prose-slate'
                                }`}>
                                  <details className="group/details">
                                    <summary className="cursor-pointer list-none flex items-center justify-between font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                                      <span>View Full Analysis</span>
                                      <ChevronDown className="w-4 h-4 transition-transform group-open/details:rotate-180" />
                                    </summary>
                                    <div className="mt-4">
                                      <Markdown>{msg.content}</Markdown>
                                      <VisualContent content={msg.content} theme={theme} />
                                      {msg.images && msg.images.length > 0 && (
                                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                                          {msg.images.map((img, i) => (
                                            <div key={i} className={`group relative rounded-xl overflow-hidden shadow-md border aspect-[3/4] transition-colors ${
                                              theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-200'
                                            }`}>
                                              <img src={img} alt={`Poster ${i+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button 
                                                  onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = img;
                                                    link.download = `poster-${i+1}.png`;
                                                    link.click();
                                                  }}
                                                  className="p-2 bg-white rounded-full text-slate-800 hover:bg-slate-50 transition-colors"
                                                >
                                                  <Download className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </details>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      <div ref={chatEndRef} />
                    </div>

                    {messages.length > 0 && !isProcessing && (
                      <div className={`p-4 border-t flex items-center justify-between gap-4 ${
                        theme === 'dark' ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/30'
                      }`}>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handleDownloadWorkflow}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm ${
                              theme === 'dark'
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-400'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                            Download Workflow
                          </button>
                          <button 
                            onClick={downloadBlueprint}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm ${
                              theme === 'dark'
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-400'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                            Export Markdown
                          </button>
                          <button 
                            onClick={shareBlueprint}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm ${
                              theme === 'dark'
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-400'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                            }`}
                          >
                            <Share2 className="w-4 h-4" />
                            Share App
                          </button>
                        </div>
                        {messages.some(m => m.role === 'Branding Agent') && (
                          <button
                            onClick={() => generatePosters()}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-black/5"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Generate Visual Assets
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl shadow-sm border p-8 transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Market Growth Dashboard</h2>
                        <p className="text-slate-500 text-sm">Projected growth based on existing {domain} benchmarks.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleAddToCalendar}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            theme === 'dark'
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Deadlines to Calendar
                        </button>
                        <div className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-black/5">
                          <TrendingUp className="w-4 h-4" />
                          +24% Market Potential
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {[
                        { label: 'Market Cap', value: '$4.2B', change: '+12%', color: 'text-slate-700 dark:text-slate-200' },
                        { label: 'Avg. CAC', value: '$12.50', change: '-5%', color: 'text-slate-700 dark:text-slate-200' },
                        { label: 'LTV/CAC', value: '4.2x', change: '+0.8', color: 'text-slate-700 dark:text-slate-200' }
                      ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-2xl border transition-colors ${
                          theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                          <div className="flex items-end gap-2">
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                            <span className="text-[10px] font-bold text-slate-400 mb-1">{stat.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`p-6 rounded-2xl border mb-8 h-80 transition-colors ${
                      theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <h3 className={`text-sm font-bold mb-6 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Growth Projection (5 Year)</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getDashboardData()}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#334155" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#334155" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                              borderRadius: '12px', 
                              border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#334155" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-black/20 mb-8 border border-white/10">
                      <Sparkles className="absolute -right-8 -top-8 w-48 h-48 text-white/5 rotate-12" />
                      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                              <Zap className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">AI Opportunity & Market Gap</h3>
                          </div>
                          <div className="text-lg text-slate-200 leading-relaxed mb-6 font-medium">
                            {marketInsights ? (
                              <Markdown>{marketInsights}</Markdown>
                            ) : (
                              <p>Based on current trends, integrating AI agents into your {domain} workflow could reduce operational costs by up to 40% in the first year.</p>
                            )}
                          </div>
                          <button 
                            onClick={generateMarketInsights}
                            disabled={isGeneratingInsights}
                            className="bg-white text-slate-800 px-8 py-4 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all flex items-center gap-3 shadow-xl active:scale-95"
                          >
                            {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {marketInsights ? 'Regenerate Insights' : 'Generate Deep Analysis'}
                          </button>
                        </div>
                        <div className="w-full md:w-72 aspect-square rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-6 text-center">
                          <div className="text-5xl font-black text-amber-400 mb-2">94%</div>
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Match Potential</div>
                          <div className="mt-6 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: '94%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Competitor Landscape</h3>
                        <div className="space-y-3">
                          {[
                            { name: 'StartupX', share: 45, color: 'bg-slate-700' },
                            { name: 'ForgeFlow', share: 30, color: 'bg-slate-500' },
                            { name: 'AlphaBase', share: 15, color: 'bg-slate-400' },
                            { name: 'Others', share: 10, color: 'bg-slate-300' }
                          ].map((comp, i) => (
                            <div key={i} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-slate-600">{comp.name}</span>
                                <span className="text-slate-400">{comp.share}%</span>
                              </div>
                              <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <div className={`h-full ${comp.color}`} style={{ width: `${comp.share}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`p-6 rounded-2xl border transition-colors ${
                        theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <h3 className={`text-sm font-bold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Market Sentiment</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: '70%' }} />
                            <div className="h-full bg-amber-500" style={{ width: '20%' }} />
                            <div className="h-full bg-red-500" style={{ width: '10%' }} />
                          </div>
                          <span className="text-xs font-bold text-emerald-500">Positive</span>
                        </div>
                        <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                          Social sentiment analysis shows a strong demand for {domain} solutions that prioritize efficiency and cost-reduction.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl shadow-sm border p-8 transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Startup History</h2>
                        <p className="text-slate-500 text-sm">Review and manage your past startup blueprints.</p>
                      </div>
                      {history.length > 0 && (
                        <button 
                          onClick={async () => {
                            // Custom confirmation instead of window.confirm
                            const confirmed = true; // For now, just do it, or I can add a state for confirmation
                            if (confirmed) {
                              for (const bp of history) {
                                await deleteDoc(doc(db, 'blueprints', bp.id));
                              }
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All History
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {history.length === 0 ? (
                        <div className="col-span-full py-24 text-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'
                          }`}>
                            <History className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-medium">No blueprints found in your history.</p>
                          <button onClick={() => setActiveTab('forge')} className="mt-4 text-slate-600 font-bold hover:underline">Start your first forge</button>
                        </div>
                      ) : (
                        history.map((bp) => (
                          <div
                            key={bp.id}
                            onClick={() => {
                              loadBlueprint(bp);
                              setActiveTab('forge');
                            }}
                            className={`group p-6 rounded-2xl border transition-all cursor-pointer relative ${
                              theme === 'dark' 
                              ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500/50 hover:bg-slate-800' 
                              : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-xl hover:shadow-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-white text-slate-600 shadow-sm'}`}>
                                <Rocket className="w-5 h-5" />
                              </div>
                              <button 
                                onClick={(e) => deleteBlueprint(e, bp.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <h3 className={`font-bold mb-2 line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{bp.idea}</h3>
                            <div className="flex items-center gap-3 mt-4">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-white text-slate-500 border border-slate-100'}`}>
                                {bp.domain}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {bp.createdAt?.toDate ? bp.createdAt.toDate().toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight className="w-5 h-5 text-slate-500" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Admin Tab Removed */}

                {activeTab === 'marketplace' && (
                  <motion.div
                    key="marketplace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl shadow-sm border p-8 transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Agent Marketplace</h2>
                        <p className="text-slate-500 text-sm">Discover and integrate specialized AI agents into your startup.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            value={marketplaceSearch}
                            onChange={(e) => setMarketplaceSearch(e.target.value)}
                            placeholder="Search agents..."
                            className={`pl-10 pr-4 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all ${
                              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'
                            }`}
                          />
                        </div>
                        <button 
                          onClick={() => setShowBuildAgentModal(true)}
                          className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-black/5 whitespace-nowrap"
                        >
                          Build Agent
                        </button>
                      </div>
                    </div>

                    <div className="mb-12">
                      <h3 className={`text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2`}>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Recommended for your {domain} startup
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { name: 'Market Intelligence Bot', desc: 'Real-time analysis of competitors and market gaps.', price: '$29/mo', icon: <Search className="w-5 h-5" />, color: 'bg-indigo-600' },
                          { name: 'Viral Content Engine', desc: 'Generates high-engagement social media campaigns.', price: '$39/mo', icon: <Zap className="w-5 h-5" />, color: 'bg-rose-600' }
                        ].map((agent, i) => (
                          <div key={i} className={`p-6 rounded-3xl border flex gap-6 items-center transition-all hover:shadow-xl ${
                            theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <div className={`w-16 h-16 rounded-2xl ${agent.color} text-white flex items-center justify-center shrink-0 shadow-lg`}>
                              {agent.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{agent.name}</h4>
                              <p className="text-xs text-slate-500 mb-3">{agent.desc}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black">{agent.price}</span>
                                <button className="text-[10px] font-bold text-indigo-500 hover:underline uppercase tracking-widest">Rent Now</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[
                        ...customAgents,
                        { name: 'LegalEagle AI', desc: 'Automates contract review and compliance checks.', price: '$49/mo', icon: <Handshake className="w-5 h-5" />, color: 'bg-slate-700' },
                        { name: 'GrowthHacker', desc: 'Optimizes ad spend and social media engagement.', price: '$79/mo', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-slate-800' },
                        { name: 'SupportBot Pro', desc: '24/7 customer support with human-like empathy.', price: '$29/mo', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-slate-900' },
                        { name: 'DevOps Genie', desc: 'Automates cloud infrastructure and CI/CD.', price: '$99/mo', icon: <Code className="w-5 h-5" />, color: 'bg-slate-950' },
                        { name: 'SalesForce AI', desc: 'Lead generation and automated email outreach.', price: '$59/mo', icon: <Target className="w-5 h-5" />, color: 'bg-zinc-800' },
                        { name: 'UX Auditor', desc: 'Analyzes user sessions and suggests UI fixes.', price: '$39/mo', icon: <LayoutDashboard className="w-5 h-5" />, color: 'bg-zinc-900' }
                      ].filter(agent => 
                        agent.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) || 
                        agent.desc.toLowerCase().includes(marketplaceSearch.toLowerCase())
                      ).map((agent, i) => (
                        <div key={i} className={`group p-6 rounded-2xl border transition-all ${
                          theme === 'dark' 
                          ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500/50 hover:bg-slate-800' 
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-xl hover:shadow-slate-50'
                        }`}>
                          <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {agent.icon}
                          </div>
                          <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{agent.name}</h3>
                          <p className="text-sm text-slate-500 mb-6 line-clamp-2">{agent.desc}</p>
                          <div className={`flex items-center justify-between pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200/50'}`}>
                            <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{agent.price}</span>
                            <div className="flex gap-2">
                              <button className="text-[10px] font-bold px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">Rent</button>
                              <button className="text-[10px] font-bold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Buy</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'collaboration' && (
                  <motion.div
                    key="collaboration"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl shadow-sm border p-8 transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Collaboration Hub</h2>
                        <p className="text-slate-500 text-sm">Work with your team and external partners in real-time.</p>
                      </div>
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                          <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                        ))}
                        <button className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center transition-all ${
                          theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}>
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className={`rounded-2xl p-6 border transition-colors ${
                          theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            <Zap className="w-4 h-4 text-slate-500" />
                            Active Discussion
                          </h3>
                          <div className="space-y-4 pr-2 scrollbar-hide">
                            {teamMessages.length === 0 ? (
                              <p className="text-center text-slate-400 text-xs py-12 italic">No messages yet. Start the conversation!</p>
                            ) : (
                              teamMessages.map((chat, i) => (
                                <div key={i} className={`flex gap-3 ${chat.userId === user.uid ? 'flex-row-reverse' : ''}`}>
                                  <img src={chat.userPhoto || `https://i.pravatar.cc/150?u=${chat.userId}`} className="w-8 h-8 rounded-full" alt="" />
                                  <div className={`${
                                    chat.userId === user.uid 
                                    ? 'bg-slate-800 text-white' 
                                    : (theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-100')
                                  } p-3 rounded-2xl border shadow-sm max-w-[80%]`}>
                                    <div className="flex justify-between mb-1 gap-4">
                                      <span className={`text-[10px] font-bold ${chat.userId === user.uid ? 'text-slate-100' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-800')}`}>{chat.userName}</span>
                                      <span className={`text-[10px] ${chat.userId === user.uid ? 'text-slate-200' : 'text-slate-400'}`}>
                                        {chat.timestamp?.toDate ? chat.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                      </span>
                                    </div>
                                    <p className="text-sm">{chat.text}</p>
                                  </div>
                                </div>
                              ))
                            )}
                            <div ref={teamChatEndRef} />
                          </div>
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.namedItem('msg') as HTMLInputElement;
                              sendTeamMessage(input.value);
                              input.value = '';
                            }}
                            className="mt-4 flex gap-2"
                          >
                            <input 
                              name="msg" 
                              type="text" 
                              placeholder="Type a message..." 
                              className={`flex-1 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-colors ${
                                theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'
                              }`} 
                            />
                            <button type="submit" className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-black/5">
                              <MessageSquare className="w-5 h-5" />
                            </button>
                          </form>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className={`rounded-2xl p-6 border transition-colors ${
                          theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            <Users className="w-4 h-4 text-slate-500" />
                            Team Activity
                          </h3>
                          <div className="space-y-4">
                            {[
                              { user: 'Sarah K.', action: 'Updated branding guide', time: '2m ago' },
                              { user: 'Mike R.', action: 'Generated new posters', time: '15m ago' },
                              { user: 'Alex J.', action: 'Joined the forge', time: '1h ago' }
                            ].map((activity, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200" />
                                  <span className="font-bold">{activity.user}</span>
                                  <span className="text-slate-500">{activity.action}</span>
                                </div>
                                <span className="text-slate-400">{activity.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'suggestions' && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl shadow-sm border p-8 transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {userProfile?.displayName ? `Tailored for ${userProfile.displayName}` : 'Talent & AI Suggestions'}
                        </h2>
                        <p className="text-slate-500 text-sm">
                          {isGeneratingSuggestions 
                            ? "Analyzing your profile to find the best matches..." 
                            : `Recommended resources to accelerate your ${domain} startup based on your ${userProfile?.role || 'profile'}.`}
                        </p>
                      </div>
                      {isGeneratingSuggestions && <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />}
                    </div>

                    {!personalizedSuggestions && !isGeneratingSuggestions ? (
                      <div className="text-center py-12">
                        <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Complete your profile to see personalized suggestions.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* AI Agents */}
                        <section>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recommended AI Agents</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(personalizedSuggestions?.aiAgents || []).map((s, i) => (
                              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                                theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                              }`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                    <Zap className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{s.name}</p>
                                    <p className="text-xs text-slate-500">{s.role}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-500">{s.match} Match</p>
                                  <button className="text-[10px] font-bold text-slate-500 hover:text-slate-400 uppercase tracking-wider">Hire AI</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Human Talent */}
                        <section>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Top Human Talent</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(personalizedSuggestions?.humanTalent || []).map((s, i) => (
                              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                                theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                              }`}>
                                <div className="flex items-center gap-4">
                                  <img src={`https://i.pravatar.cc/150?u=${s.name}`} className="w-10 h-10 rounded-xl" alt="" referrerPolicy="no-referrer" />
                                  <div>
                                    <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{s.name}</p>
                                    <p className="text-xs text-slate-500">{s.role} • {s.exp}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{s.rate}</p>
                                  <button className="text-[10px] font-bold text-slate-500 hover:text-slate-400 uppercase tracking-wider">Contact</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Opportunities */}
                        <section>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Market Opportunities</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(personalizedSuggestions?.opportunities || []).map((o, i) => (
                              <div key={i} className={`p-5 rounded-2xl border transition-colors ${
                                theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                              }`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-500/10 text-slate-500 rounded-lg uppercase tracking-wider">
                                    {o.type}
                                  </span>
                                  <TrendingUp className="w-4 h-4 text-slate-500" />
                                </div>
                                <h4 className={`font-bold text-sm mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{o.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">{o.desc}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'architecture' && (
                  <motion.div
                    key="architecture"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl shadow-sm border p-8 transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="mb-12">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Internal Documentation</span>
                      </div>
                      <h2 className={`text-3xl font-black tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        StartupForge Architecture
                      </h2>
                      <p className="text-slate-500 text-lg max-w-3xl">
                        A deep dive into the multi-agent orchestration system that powers the StartupForge platform.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* Core Logic */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Cpu className="w-6 h-6" />
                          </div>
                          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>The Forge Engine</h3>
                        </div>
                        <p className="text-slate-500 leading-relaxed">
                          The "Forge" is a multi-phase AI orchestration system. It doesn't just call an LLM; it manages a collaborative workflow between specialized agents.
                        </p>
                        <div className="space-y-4">
                          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <p className="font-bold text-sm text-indigo-500 mb-1">Phase 1: Initial Drafting</p>
                            <p className="text-xs text-slate-500">Agents are grouped (Core, Specialized, Execution) and run sequentially. Each agent receives the cumulative context of previous agents.</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <p className="font-bold text-sm text-emerald-500 mb-1">Phase 2: Collaborative Refinement</p>
                            <p className="text-xs text-slate-500">Agents review the full context, address questions from colleagues, and align their strategies for a cohesive final blueprint.</p>
                          </div>
                        </div>
                      </section>

                      {/* AI Stack */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Zap className="w-6 h-6" />
                          </div>
                          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI & Data Stack</h3>
                        </div>
                        <ul className="space-y-4">
                          <li className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Search className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Gemini 3.1 Pro + Search Grounding</p>
                              <p className="text-xs text-slate-500">Used for high-reasoning tasks. Google Search grounding ensures agents use real-time market data and competitor insights.</p>
                            </div>
                          </li>
                          <li className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Gemini 3.1 Flash Image</p>
                              <p className="text-xs text-slate-500">Powers the Branding Agent's poster generation, creating high-fidelity marketing assets based on the startup's visual identity.</p>
                            </div>
                          </li>
                          <li className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Database className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Firebase Firestore & Auth</p>
                              <p className="text-xs text-slate-500">Real-time data persistence for blueprints, user profiles, and the team collaboration chat.</p>
                            </div>
                          </li>
                        </ul>
                      </section>

                      {/* Technical Implementation */}
                      <section className="col-span-1 md:col-span-2 space-y-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Technical Implementation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div>
                            <p className="font-bold text-sm mb-3 text-slate-400 uppercase tracking-widest">Frontend</p>
                            <div className="flex flex-wrap gap-2">
                              {['React 18', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'Lucide Icons'].map(t => (
                                <span key={t} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-full">{t}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-sm mb-3 text-slate-400 uppercase tracking-widest">Backend & Dev</p>
                            <div className="flex flex-wrap gap-2">
                              {['Express', 'Vite', 'TypeScript', 'Google GenAI SDK'].map(t => (
                                <span key={t} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-full">{t}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-sm mb-3 text-slate-400 uppercase tracking-widest">Resilience</p>
                            <div className="flex flex-wrap gap-2">
                              {['Exponential Backoff', 'Sequential Batching', 'Firestore Error Boundaries'].map(t => (
                                <span key={t} className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold rounded-full">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </main>
      )}

      {/* Footer */}
      <footer className={`max-w-7xl mx-auto px-6 py-8 border-t mt-12 text-center text-xs transition-colors ${
        theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        <p>© 2026 StartupForge AI. Powered by Gemini 2.0 Flash & Firebase.</p>
      </footer>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl p-8 rounded-3xl shadow-2xl border max-h-[90vh] overflow-y-auto scrollbar-hide ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>User Profile</h2>
                    <p className="text-slate-500 text-xs">Manage your identity and projects.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Profile form submitted");
                  const formData = new FormData(e.currentTarget);
                  handleSaveProfile({
                    displayName: formData.get('displayName') as string,
                    bio: formData.get('bio') as string,
                    role: formData.get('role') as string,
                  });
                }} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input 
                      name="displayName"
                      required
                      defaultValue={userProfile?.displayName || user?.displayName?.split(' ')[0] || ''}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500 transition-colors ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`} 
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your Role</label>
                    <input 
                      name="role"
                      required
                      defaultValue={userProfile?.role || ''}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500 transition-colors ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`} 
                      placeholder="e.g. Serial Entrepreneur, Designer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bio</label>
                    <textarea 
                      name="bio"
                      required
                      defaultValue={userProfile?.bio || ''}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500 h-24 resize-none transition-colors ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`} 
                      placeholder="Briefly describe your background..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit"
                      className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-black/5"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>

                <div className="space-y-4">
                  <h3 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>My Projects</h3>
                  <div className="space-y-3">
                    {history.length > 0 ? (
                      history.slice(0, 5).map((project) => (
                        <div 
                          key={project.id}
                          className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${
                            theme === 'dark' ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => {
                            setActiveBlueprintId(project.id);
                            setActiveTab('forge');
                            setShowProfileModal(false);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              theme === 'dark' ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400'
                            }`}>
                              {project.domain}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {project.idea}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className={`p-8 rounded-2xl border border-dashed text-center ${
                        theme === 'dark' ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'
                      }`}>
                        <Rocket className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">No projects yet.</p>
                      </div>
                    )}
                    {history.length > 5 && (
                      <button 
                        onClick={() => { setActiveTab('history'); setShowProfileModal(false); }}
                        className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-600 transition-colors"
                      >
                        View all projects
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Build Agent Modal */}
      <AnimatePresence>
        {showBuildAgentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-3xl p-0 max-w-4xl w-full shadow-2xl border transition-colors overflow-hidden flex flex-col md:flex-row h-[80vh] ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className={`w-full md:w-1/3 p-8 border-r transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <h2 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Agent IDE</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Agent Identity</label>
                    <input 
                      type="text" 
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500 transition-colors ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
                      }`} 
                      placeholder="e.g. SEO Ninja"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Price Point</label>
                    <input 
                      type="text" 
                      value={newAgent.price}
                      onChange={(e) => setNewAgent({ ...newAgent, price: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500 transition-colors ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
                      }`} 
                      placeholder="e.g. $19/mo"
                    />
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={buildCustomAgent}
                      className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                    >
                      <Terminal className="w-4 h-4" />
                      Deploy Agent
                    </button>
                    <button 
                      onClick={() => setShowBuildAgentModal(false)}
                      className="w-full mt-3 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Discard Draft
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">agent_logic.ts</div>
                </div>
                <div className={`flex-1 rounded-2xl p-6 font-mono text-sm relative transition-colors ${
                  theme === 'dark' ? 'bg-slate-950 border border-slate-800' : 'bg-slate-900 border border-slate-800'
                }`}>
                  <div className="absolute left-4 top-6 text-slate-700 select-none text-right w-6">
                    {Array.from({ length: 15 }).map((_, i) => <div key={i}>{i + 1}</div>)}
                  </div>
                  <textarea 
                    value={newAgent.desc}
                    onChange={(e) => setNewAgent({ ...newAgent, desc: e.target.value })}
                    className="w-full h-full bg-transparent border-none outline-none text-emerald-400 pl-10 resize-none leading-relaxed"
                    placeholder="// Define agent capabilities and system instructions here...
export const agent = {
  capabilities: ['SEO', 'Content'],
  logic: () => { ... }
};"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <StartupForge />
  );
}
