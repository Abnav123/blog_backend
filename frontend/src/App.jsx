import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  Eye,
  Heart,
  Lock,
  LogIn,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Tag,
  Unlock,
  UserPlus,
  X
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const emptyDebateForm = {
  title: '',
  description: '',
  category: 'General',
  tags: ''
};

const emptyAuthForm = {
  username: '',
  email: '',
  password: ''
};

function App() {
  const [debates, setDebates] = useState([]);
  const [selectedDebate, setSelectedDebate] = useState(null);
  const [argumentsList, setArgumentsList] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', tag: '', status: '' });
  const [debateForm, setDebateForm] = useState(emptyDebateForm);
  const [argumentForm, setArgumentForm] = useState({ content: '', side: 'FOR' });
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [token, setToken] = useState(() => localStorage.getItem('debate-token') || '');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.auth ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  async function loadDebates(nextFilters = filters) {
    setIsLoading(true);
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    try {
      const data = await request(`/debates${params.toString() ? `?${params}` : ''}`);
      setDebates(data.debates || []);
      setNotice('');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDebateDetails(debateId) {
    try {
      const [debateData, argumentsData] = await Promise.all([
        request(`/debates/${debateId}`),
        request(`/arguments/${debateId}`)
      ]);
      setSelectedDebate(debateData.debate);
      setArgumentsList(argumentsData.arguments || []);
      await loadDebates();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function registerUser(event) {
    event.preventDefault();
    try {
      await request('/users/register', {
        method: 'POST',
        body: JSON.stringify(authForm)
      });
      setNotice('Account created. Log in to receive a token.');
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loginUser(event) {
    event.preventDefault();
    try {
      const data = await request('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      setToken(data.token);
      localStorage.setItem('debate-token', data.token);
      setNotice('Logged in successfully.');
      setShowAuth(false);
    } catch (error) {
      setNotice(error.message);
    }
  }

  function logoutUser() {
    setToken('');
    localStorage.removeItem('debate-token');
    setNotice('Logged out.');
  }

  async function createDebate(event) {
    event.preventDefault();
    try {
      await request('/debates', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(debateForm)
      });
      setDebateForm(emptyDebateForm);
      setNotice('Debate created.');
      await loadDebates();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function toggleDebateAction(debateId, action) {
    try {
      const method = action === 'delete' ? 'DELETE' : action === 'close' || action === 'reopen' ? 'PATCH' : 'POST';
      await request(`/debates/${debateId}${action === 'delete' ? '' : `/${action}`}`, {
        method,
        auth: true
      });
      setNotice('Debate updated.');
      await loadDebates();

      if (selectedDebate?._id === debateId && action !== 'delete') {
        await loadDebateDetails(debateId);
      }

      if (selectedDebate?._id === debateId && action === 'delete') {
        setSelectedDebate(null);
        setArgumentsList([]);
      }
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addArgument(event) {
    event.preventDefault();

    if (!selectedDebate) {
      return;
    }

    try {
      await request('/arguments', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          ...argumentForm,
          debateId: selectedDebate._id
        })
      });
      setArgumentForm({ content: '', side: 'FOR' });
      await loadDebateDetails(selectedDebate._id);
      setNotice('Argument added.');
    } catch (error) {
      setNotice(error.message);
    }
  }

  function applyFilters(event) {
    event.preventDefault();
    loadDebates(filters);
  }

  useEffect(() => {
    loadDebates();
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <h1>Debate Room</h1>
            <span>Structured arguments</span>
          </div>
        </div>

        <button className="auth-toggle" onClick={() => setShowAuth(!showAuth)}>
          {token ? <Shield size={18} /> : <LogIn size={18} />}
          {token ? 'Token active' : 'Sign in'}
        </button>

        {showAuth && (
          <section className="panel auth-panel">
            <form onSubmit={loginUser}>
              <label>Email</label>
              <input value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
              <label>Password</label>
              <input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
              <button className="primary-button" type="submit">
                <LogIn size={17} />
                Log in
              </button>
            </form>
            <form onSubmit={registerUser}>
              <label>Username</label>
              <input value={authForm.username} onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })} />
              <button className="ghost-button" type="submit">
                <UserPlus size={17} />
                Register
              </button>
            </form>
            {token && (
              <button className="text-button" onClick={logoutUser} type="button">
                <X size={16} />
                Clear token
              </button>
            )}
          </section>
        )}

        <section className="panel">
          <div className="panel-title">
            <Plus size={18} />
            New Debate
          </div>
          <form onSubmit={createDebate} className="stacked-form">
            <input placeholder="Title" value={debateForm.title} onChange={(event) => setDebateForm({ ...debateForm, title: event.target.value })} />
            <textarea placeholder="Description" value={debateForm.description} onChange={(event) => setDebateForm({ ...debateForm, description: event.target.value })} />
            <input placeholder="Category" value={debateForm.category} onChange={(event) => setDebateForm({ ...debateForm, category: event.target.value })} />
            <input placeholder="Tags, comma separated" value={debateForm.tags} onChange={(event) => setDebateForm({ ...debateForm, tags: event.target.value })} />
            <button className="primary-button" type="submit">
              <Send size={17} />
              Publish
            </button>
          </form>
        </section>
      </aside>

      <section className="content">
        <header className="topbar">
          <form className="filter-bar" onSubmit={applyFilters}>
            <div className="search-field">
              <Search size={18} />
              <input placeholder="Search debates" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            </div>
            <input placeholder="Category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} />
            <input placeholder="Tag" value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })} />
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">All</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button className="icon-button" aria-label="Apply filters" title="Apply filters" type="submit">
              <Check size={18} />
            </button>
            <button className="icon-button" aria-label="Refresh debates" title="Refresh debates" type="button" onClick={() => loadDebates()}>
              <RefreshCw size={18} />
            </button>
          </form>
          {notice && <p className="notice">{notice}</p>}
        </header>

        <div className="workspace">
          <section className="debate-list">
            {isLoading && <div className="empty-state">Loading debates...</div>}
            {!isLoading && debates.length === 0 && <div className="empty-state">No debates found.</div>}

            {debates.map((debate) => (
              <article className={`debate-card ${selectedDebate?._id === debate._id ? 'active' : ''}`} key={debate._id}>
                <button className="card-main" onClick={() => loadDebateDetails(debate._id)}>
                  <div className="card-kicker">
                    <span>{debate.category || 'General'}</span>
                    <span className={debate.status === 'CLOSED' ? 'status closed' : 'status'}>{debate.status || 'OPEN'}</span>
                  </div>
                  <h2>{debate.title}</h2>
                  <p>{debate.description}</p>
                  <div className="tag-row">
                    {(debate.tags || []).slice(0, 4).map((tag) => (
                      <span key={tag}>
                        <Tag size={13} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
                <div className="card-actions">
                  <button title="Like" onClick={() => toggleDebateAction(debate._id, 'like')}>
                    <Heart size={17} />
                    {debate.likes?.length || 0}
                  </button>
                  <button title="Bookmark" onClick={() => toggleDebateAction(debate._id, 'bookmark')}>
                    <Bookmark size={17} />
                  </button>
                  <button title={debate.status === 'CLOSED' ? 'Reopen' : 'Close'} onClick={() => toggleDebateAction(debate._id, debate.status === 'CLOSED' ? 'reopen' : 'close')}>
                    {debate.status === 'CLOSED' ? <Unlock size={17} /> : <Lock size={17} />}
                  </button>
                  <span>
                    <Eye size={17} />
                    {debate.views || 0}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="detail-panel">
            {selectedDebate ? (
              <>
                <div className="detail-header">
                  <span className={selectedDebate.status === 'CLOSED' ? 'status closed' : 'status'}>{selectedDebate.status}</span>
                  <h2>{selectedDebate.title}</h2>
                  <p>{selectedDebate.description}</p>
                </div>

                <div className="argument-columns">
                  <ArgumentColumn title="For" side="FOR" argumentsList={argumentsList} />
                  <ArgumentColumn title="Against" side="AGAINST" argumentsList={argumentsList} />
                </div>

                <form className="argument-form" onSubmit={addArgument}>
                  <div className="side-toggle">
                    <button type="button" className={argumentForm.side === 'FOR' ? 'selected' : ''} onClick={() => setArgumentForm({ ...argumentForm, side: 'FOR' })}>For</button>
                    <button type="button" className={argumentForm.side === 'AGAINST' ? 'selected' : ''} onClick={() => setArgumentForm({ ...argumentForm, side: 'AGAINST' })}>Against</button>
                  </div>
                  <textarea placeholder="Add your argument" value={argumentForm.content} onChange={(event) => setArgumentForm({ ...argumentForm, content: event.target.value })} />
                  <button className="primary-button" type="submit" disabled={selectedDebate.status === 'CLOSED'}>
                    <MessageSquare size={17} />
                    Add argument
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-detail">
                <MessageSquare size={40} />
                <h2>Select a debate</h2>
                <p>Open a thread to inspect arguments, track views, and add a position.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ArgumentColumn({ title, side, argumentsList }) {
  const filteredArguments = argumentsList.filter((argument) => argument.side === side);

  return (
    <div className="argument-column">
      <h3>{title}</h3>
      {filteredArguments.length === 0 && <p className="muted">No arguments yet.</p>}
      {filteredArguments.map((argument) => (
        <article className="argument-item" key={argument._id}>
          <p>{argument.content}</p>
          <span>{argument.author?.username || 'Anonymous'}</span>
        </article>
      ))}
    </div>
  );
}

export default App;
