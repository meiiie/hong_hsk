import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Database,
  DatabaseBackup,
  Download,
  Eye,
  EyeOff,
  Ellipsis,
  FileSpreadsheet,
  FileText,
  Keyboard,
  LayoutDashboard,
  PencilLine,
  Play,
  PlayCircle,
  RotateCcw,
  Settings,
  SquareDashed,
  Trash2,
  Trophy,
  Upload,
  UserRound,
  Volume2,
  X,
  type IconNode,
  createElement,
} from "lucide";

const ICONS = {
  alert: AlertCircle,
  arrowRight: ArrowRight,
  book: BookOpen,
  calendar: CalendarDays,
  calendarCheck: CalendarCheck,
  check: CheckCircle,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  help: CircleHelp,
  clipboardList: ClipboardList,
  clock: Clock3,
  database: Database,
  databaseBackup: DatabaseBackup,
  download: Download,
  ellipsis: Ellipsis,
  eye: Eye,
  eyeOff: EyeOff,
  fileSpreadsheet: FileSpreadsheet,
  fileText: FileText,
  keyboard: Keyboard,
  layout: LayoutDashboard,
  pencil: PencilLine,
  play: Play,
  playCircle: PlayCircle,
  rotate: RotateCcw,
  settings: Settings,
  squareDashed: SquareDashed,
  trash: Trash2,
  trophy: Trophy,
  upload: Upload,
  user: UserRound,
  volume: Volume2,
  x: X,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName): string {
  const element = createElement(ICONS[name], {
    width: 18,
    height: 18,
    "aria-hidden": "true",
    focusable: "false",
    "stroke-width": 2.2,
  });
  element.classList.add("icon");
  return element.outerHTML;
}

export function labelWithIcon(name: IconName, label: string): string {
  return `${icon(name)}<span>${escapeText(label)}</span>`;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
