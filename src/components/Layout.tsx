import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CheckCircle,
  CalendarPlus,
  Bell,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store';

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/search', label: '顾客检索', icon: Search },
  { path: '/verify', label: '到店核销', icon: CheckCircle },
  { path: '/appointment', label: '预约占次', icon: CalendarPlus },
  { path: '/alert', label: '预警中心', icon: Bell },
  { path: '/exception', label: '异常处理', icon: AlertTriangle },
  { path: '/handover', label: '交接记录', icon: FileText },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentStaff, unreadAlertCount } = useAppStore();

  const pathLabelMap: Record<string, string> = {
    '/': '工作台',
    '/search': '顾客检索',
    '/verify': '到店核销',
    '/appointment': '预约占次',
    '/alert': '预警中心',
    '/exception': '异常处理',
    '/handover': '交接记录',
  };

  const currentLabel = pathLabelMap[location.pathname] || '疗程卡管理';

  return (
    <div className="flex h-screen overflow-hidden bg-darkBg">
      <nav
        className={`flex flex-col h-full bg-darkBg border-r border-white/5 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-[200px]'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
          {!collapsed && (
            <h1 className="text-roseGold font-serif text-lg font-semibold truncate">
              疗程卡管理
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-softPink/60 hover:text-roseGold hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-roseGold/10 text-roseGold border-l-[3px] border-roseGold'
                    : 'text-softPink/60 hover:text-softPink hover:bg-white/5 border-l-[3px] border-transparent'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 border-b border-white/5 bg-darkBg/80 glass">
          <div className="flex items-center gap-2 text-sm text-softPink/50">
            <span>疗程卡管理</span>
            <span>/</span>
            <span className="text-softPink">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/alert"
              className="relative p-2 rounded-lg text-softPink/60 hover:text-roseGold hover:bg-white/5 transition-colors"
            >
              <Bell size={20} />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-coral text-white text-[10px] font-bold px-1">
                  {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-roseGold/20 flex items-center justify-center">
                <User size={16} className="text-roseGold" />
              </div>
              <div className="text-sm">
                <p className="text-softPink font-medium leading-tight">{currentStaff.name}</p>
                <p className="text-softPink/40 text-xs">
                  {currentStaff.role === 'manager' ? '店长' : '前台'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" id="toast-container" />
      </div>
    </div>
  );
}
