import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, LayoutDashboard, Users, FileText, PlusCircle, PenTool, Settings, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/Button";

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clientes', label: 'Clientes', icon: Users },
    { path: '/propostas', label: 'Propostas', icon: FileText },
    { path: '/propostas/nova', label: 'Nova Proposta', icon: PlusCircle },
    { path: '/design-pdf', label: 'Design PDF', icon: PenTool },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Visão Geral';
  };

  return (
    <div className="flex h-screen w-full bg-brand-gray text-brand-dark font-sans overflow-hidden">
      <aside className="w-64 border-r border-brand-border bg-brand-surface flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold">
              <Sun className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-brand-dark">
              SolAmigo <span className="text-brand-blue">Pro</span>
            </h1>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-gray-50 text-brand-dark"
                      : "text-slate-500 hover:text-brand-dark hover:bg-gray-50/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "opacity-100 text-brand-blue" : "opacity-70"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-brand-border space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-blue-hover flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-medium text-brand-dark truncate">{user?.user_metadata?.name || 'Usuário'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.user_metadata?.company_name || 'SolAmigo Pro'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-brand-border flex items-center justify-between px-8 bg-brand-surface shrink-0">
          <div className="flex items-center gap-4">
             <h2 className="text-sm font-medium text-brand-dark">{getPageTitle()}</h2>
             <div className="h-4 w-[1px] bg-gray-100"></div>
             <span className="text-xs text-slate-500">SaaS SolAmigo FV</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/propostas/nova">
              <Button size="sm" className="font-bold text-xs h-9 px-4">
                + Nova Proposta
              </Button>
            </Link>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
