'use client'

/**
 * Centralized icon barrel — wraps @hugeicons/react + @hugeicons/core-free-icons.
 * Drop-in replacement for lucide-react imports across the project.
 *
 * Usage:
 *   import { Search, Sparkles } from '@/components/ui/icons'
 *   <Search className="h-4 w-4" />
 */

import React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  // Nav & Layout
  HouseHeartIcon as _Home,
  LayersLogoIcon as _Layers,
  LayoutGridIcon as _LayoutGrid,
  MenuTwoLineIcon as _Menu,

  // User & Auth
  UserIcon as _User,
  UserCircleIcon as _UserCircle,
  DoorOpenIcon as _LogOut,

  // Content & Media
  VideoReplayIcon as _Video,
  ImageActualSizeIcon as _Image,
  ImageUploadIcon as _ImagePlus,
  VideotapeIcon as _Film,
  VideotapeIcon as _Clapperboard,

  // Files
  FileCodeIcon as _FileCode,
  FileImageIcon as _FileImage,
  FileEditIcon as _FileText,
  FolderAddIcon as _FolderPlus,

  // Actions
  CopyIcon as _Copy,
  DeleteThrowIcon as _Trash2,
  PencilIcon as _Pencil,
  CloudUploadIcon as _Upload,
  CloudDownloadIcon as _Download,
  SearchIcon as _Search,
  RefreshIcon as _RefreshCw,
  RotateClockwiseIcon as _RotateCcw,

  // UI Controls
  CancelCircleIcon as _X,
  ValidationIcon as _Check,
  LockIcon as _Lock,
  MaximizeScreenIcon as _Maximize,
  AttachmentIcon as _Paperclip,
  SendToMobileIcon as _Send,
  SendToMobileIcon as _SendHorizontal,
  CogIcon as _Settings,

  // Media Controls
  PlayIcon as _Play,
  PauseIcon as _Pause,
  VolumeHighIcon as _Volume2,

  // Navigation Arrows
  ArrowTurnBackwardIcon as _ArrowLeft,
  ArrowDownBigIcon as _ArrowDownToLine,
  ArrowMoveDownRightIcon as _ArrowDownRight,
  ArrowMoveUpRightIcon as _ArrowUpRight,
  ArrowLeftBigIcon as _ChevronLeft,
  ArrowRightBigIcon as _ChevronRight,
  ArrowDownBigIcon as _ChevronDown,
  ArrowUpBigIcon as _ChevronUp,

  // Indicators & Status
  SparklesIcon as _Sparkles,
  FlashIcon as _Wand2,
  ZapIcon as _Zap,
  FireIcon as _Flame,
  RefreshIcon as _Loader2,
  NotificationCircleIcon as _Bell,
  InformationCircleIcon as _Info,
  AlertCircleIcon as _AlertCircle,

  // Gamification
  StarIcon as _Trophy,
  BadgeIcon as _Award,
  MedalFirstPlaceIcon as _Medal,
  HeartAddIcon as _Heart,
  GiftIcon as _Gift,
  BotIcon as _Bot,

  // Social
  YoutubeIcon as _Youtube,
  InstagramIcon as _Instagram,

  // Finance
  CoinsDollarIcon as _Coins,
  CrownIcon as _Crown,
  ChartIncreaseIcon as _TrendingUp,

  // Time
  TimeScheduleIcon as _Clock,
  CalendarsIcon as _Calendar,

  // Misc
  TestTubeIcon as _FlaskConical,
  LinkCircleIcon as _ExternalLink,
  ColorPickerIcon as _Palette,
  GamepadDirectionalIcon as _Gamepad2,
  BananaIcon as _Banana,
  CpuIcon as _Cpu,
  MessageSquareDashedIcon as _MessageSquare,

  // Additional icons (discovered from component files)
  MoreHorizontalIcon as _MoreHorizontal,
  ShareKnowledgeIcon as _Share2,
  BookOpenTextIcon as _BookOpen,
  CodeIcon as _Code,
  ChartColumnIcon as _BarChart3,
  PenToolAddIcon as _PenTool,
  HatIcon as _GraduationCap,
  BrainIcon as _Brain,
  EarthIcon as _Wind,
  GlobeIcon as _Globe,
  PlusSignIcon as _Plus,
  ArrowUpBigIcon as _ArrowUp,
  RectangleCircleIcon as _RectangleHorizontal,
  DiamondIcon as _Diamond,
  HelpCircleIcon as _HelpCircle,
  MuteIcon as _VolumeX,
  PlusSignCircleIcon as _Circle,
  StarIcon as _Star,
  RocketIcon as _Rocket,
  TargetDollarIcon as _Target,
} from '@hugeicons/core-free-icons'

// ─── Size resolver ───────────────────────────────────────────────────────────
// Converts Tailwind h-* classes to pixel sizes for HugeIcons
function resolveSize(className: string, defaultSize = 20): number {
  if (className.includes('h-3')) return 12
  if (className.includes('h-4')) return 16
  if (className.includes('h-5')) return 20
  if (className.includes('h-6')) return 24
  if (className.includes('h-7')) return 28
  if (className.includes('h-8')) return 32
  if (className.includes('h-10')) return 40
  if (className.includes('h-12')) return 48
  return defaultSize
}

// ─── Factory ─────────────────────────────────────────────────────────────────
type HugeIconData = Parameters<typeof HugeiconsIcon>[0]['icon']

interface IconProps {
  className?: string
  size?: number
  strokeWidth?: number
}

function icon(data: HugeIconData, defaultSize = 20) {
  const Component = ({ className = '', size, strokeWidth = 1.5 }: IconProps) => (
    <HugeiconsIcon
      icon={data}
      size={size ?? resolveSize(className, defaultSize)}
      color="currentColor"
      strokeWidth={strokeWidth}
      className={className}
    />
  )
  Component.displayName = 'HugeIcon'
  return Component
}

// ─── Loader2 with spin animation ─────────────────────────────────────────────
export const Loader2 = ({ className = '', size, strokeWidth = 1.5 }: IconProps) => (
  <HugeiconsIcon
    icon={_Loader2}
    size={size ?? resolveSize(className)}
    color="currentColor"
    strokeWidth={strokeWidth}
    className={`animate-spin ${className}`}
  />
)

// ─── Named exports (drop-in for lucide-react) ─────────────────────────────────

// Nav & Layout
export const Home = icon(_Home)
export const Layers = icon(_Layers)
export const LayoutGrid = icon(_LayoutGrid)
export const Menu = icon(_Menu)

// User & Auth
export const User = icon(_User)
export const UserCircle = icon(_UserCircle)
export const LogOut = icon(_LogOut)

// Content & Media
export const Video = icon(_Video)
export const Image = icon(_Image)
export const ImageIcon = icon(_Image)
export const ImagePlus = icon(_ImagePlus)
export const Film = icon(_Film)
export const Clapperboard = icon(_Clapperboard)

// Files
export const FileCode = icon(_FileCode)
export const FileImage = icon(_FileImage)
export const FileText = icon(_FileText)
export const FolderPlus = icon(_FolderPlus)

// Actions
export const Copy = icon(_Copy)
export const Trash2 = icon(_Trash2)
export const Pencil = icon(_Pencil)
export const Upload = icon(_Upload)
export const Download = icon(_Download)
export const Search = icon(_Search)
export const RefreshCw = icon(_RefreshCw)
export const RotateCcw = icon(_RotateCcw)

// UI Controls
export const X = icon(_X)
export const Check = icon(_Check)
export const Lock = icon(_Lock)
export const Maximize = icon(_Maximize)
export const Paperclip = icon(_Paperclip)
export const Send = icon(_Send)
export const SendHorizontal = icon(_SendHorizontal)
export const Settings = icon(_Settings)

// Media Controls
export const Play = icon(_Play)
export const Pause = icon(_Pause)
export const Volume2 = icon(_Volume2)

// Navigation Arrows
export const ArrowLeft = icon(_ArrowLeft)
export const ArrowDownToLine = icon(_ArrowDownToLine)
export const ArrowDownRight = icon(_ArrowDownRight)
export const ArrowUpRight = icon(_ArrowUpRight)
export const ChevronLeft = icon(_ChevronLeft)
export const ChevronRight = icon(_ChevronRight)
export const ChevronDown = icon(_ChevronDown)
export const ChevronUp = icon(_ChevronUp)

// Indicators & Status
export const Sparkles = icon(_Sparkles)
export const Wand2 = icon(_Wand2)
export const Zap = icon(_Zap)
export const Flame = icon(_Flame)
export const Bell = icon(_Bell)
export const Info = icon(_Info)
export const AlertCircle = icon(_AlertCircle)

// Gamification
export const Trophy = icon(_Trophy)
export const Award = icon(_Award)
export const Medal = icon(_Medal)
export const Heart = icon(_Heart)
export const Gift = icon(_Gift)
export const Bot = icon(_Bot)

// Social
export const Youtube = icon(_Youtube)
export const Instagram = icon(_Instagram)

// Finance
export const Coins = icon(_Coins)
export const Crown = icon(_Crown)
export const TrendingUp = icon(_TrendingUp)

// Time
export const Clock = icon(_Clock)
export const Calendar = icon(_Calendar)

// Misc
export const FlaskConical = icon(_FlaskConical)
export const ExternalLink = icon(_ExternalLink)
export const Palette = icon(_Palette)
export const Gamepad2 = icon(_Gamepad2)
export const Banana = icon(_Banana)
export const Cpu = icon(_Cpu)
export const MessageSquare = icon(_MessageSquare)

// Additional exports (from component file discovery)
export const MoreHorizontal = icon(_MoreHorizontal)
export const Share2 = icon(_Share2)
export const BookOpen = icon(_BookOpen)
export const Code = icon(_Code)
export const BarChart3 = icon(_BarChart3)
export const PenTool = icon(_PenTool)
export const GraduationCap = icon(_GraduationCap)
export const Brain = icon(_Brain)
export const Wind = icon(_Wind)
export const Globe = icon(_Globe)
export const Plus = icon(_Plus)
export const ArrowUp = icon(_ArrowUp)
export const RectangleHorizontal = icon(_RectangleHorizontal)
export const Diamond = icon(_Diamond)
export const HelpCircle = icon(_HelpCircle)
export const VolumeX = icon(_VolumeX)
export const Circle = icon(_Circle)
export const Star = icon(_Star)
export const Rocket = icon(_Rocket)
export const Target = icon(_Target)

// ─── Type alias for backward compat with any LucideIcon references ────────────
export type LucideIcon = React.ComponentType<IconProps>
