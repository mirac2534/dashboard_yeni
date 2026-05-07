import { LogOut, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthentication } from '../../auth';

const titles: Record<string, string> = {
  '/normal-operation': 'Problemsiz Operasyon',
  '/offline-operation': 'İnternet Bağlantısı Olmadığı Operasyon',
  '/emergency-operation': 'Acil Durumlar Operasyonu',
  '/zk-snark': 'zk-SNARK Gösterimi',
  '/profile': 'Profil',
  '/help': 'Yardım ve Sıkça Sorulan Sorular',
};

export function Topbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    clearAuthentication();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div>
        <span>Operasyon Merkezi</span>
        <h1>{titles[location.pathname] ?? 'Synapse Dijital Kara Kutu Sistemi'}</h1>
      </div>
      <div className="topbar__status">
        <div className="profile-menu">
          <button aria-label="Profil menüsü" onClick={() => setOpen((value) => !value)} type="button">
            <UserRound size={20} />
          </button>
          {open ? (
            <div className="profile-menu__dropdown">
              <Link to="/profile" onClick={() => setOpen(false)}>
                <UserRound size={16} />
                Profil sayfasına git
              </Link>
              <button onClick={logout} type="button">
                <LogOut size={16} />
                Çıkış yap
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
