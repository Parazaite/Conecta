import React, { useCallback, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const USER_KEY = 'conecta-bairro-user';
const TOKEN_KEY = 'conecta-bairro-token';

async function api(path, options = {}) {
  const { token, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...requestOptions.headers
    }
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir sua solicitação.');
  return data;
}

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="Conecta Bairro, página inicial">
      <span className="brand-symbol"><i /><i /><i /><i /></span>
      <span className="brand-word">conecta<span>.</span></span>
    </a>
  );
}

function TopBar({ user, onAuth, onDashboard, onSignOut }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <nav className="top-nav" aria-label="Navegação principal">
          <a href="#explorar">Explorar serviços</a>
          <a href="#comunidade">Nossa comunidade</a>
        </nav>
        {user ? (
          <div className="top-actions">
            <button className="button button-outline" onClick={onDashboard}>Meu espaço</button>
            <button className="account-button" onClick={onSignOut} title="Sair da conta">
              <span className="account-avatar">{user.full_name?.charAt(0)}</span>
              <span>{user.full_name?.split(' ')[0]}</span>
              <span className="account-exit">sair</span>
            </button>
          </div>
        ) : (
          <div className="top-actions">
            <button className="button button-text" onClick={() => onAuth('login')}>Entrar</button>
            <button className="button button-dark" onClick={() => onAuth('register')}>Divulgar meu trabalho <span>↗</span></button>
          </div>
        )}
      </div>
    </header>
  );
}

function IntroCollage() {
  return (
    <div className="intro-collage" aria-label="Ilustração de diferentes profissionais locais">
      <div className="collage-paper" />
      <div className="collage-line line-one" />
      <div className="collage-line line-two" />
      <div className="collage-person portrait-plumber"><span>R</span><i>✳</i></div>
      <div className="collage-person portrait-seamstress"><span>M</span><i>✿</i></div>
      <div className="collage-person portrait-carpenter"><span>J</span><i>✦</i></div>
      <div className="collage-label label-near"><b>+</b><span>pertinho</span></div>
      <div className="collage-label label-together"><b>↗</b><span>junto cresce</span></div>
      <span className="collage-star star-a">✳</span>
      <span className="collage-star star-b">✦</span>
    </div>
  );
}

function Welcome({ onSearch }) {
  return (
    <section className="welcome" id="inicio">
      <div className="welcome-inner">
        <div className="welcome-copy">
          <span className="welcome-label"><i /> SERVIÇOS DO SEU LADO</span>
          <h1>Precisa de uma mão?<br />Tem talento <span>por aqui.</span></h1>
          <p>Encontre quem entende do assunto bem perto de casa. Um jeito simples de resolver o que você precisa e fortalecer quem faz parte do seu bairro.</p>
          <button className="button button-light" onClick={onSearch}>Encontrar um serviço <span>↓</span></button>
          <div className="welcome-footnote"><span className="footnote-mark">↗</span> Conexões locais. Impacto que fica por perto.</div>
        </div>
        <IntroCollage />
      </div>
      <div className="welcome-bottom">
        <span>FEITO NA COMUNIDADE</span><span className="welcome-bottom-line" /><span>FEITO PARA A COMUNIDADE</span>
      </div>
    </section>
  );
}

function CategoryStrip({ categories, selected, onSelect }) {
  return (
    <div className="category-strip">
      <button className={`category-pill ${!selected ? 'selected' : ''}`} onClick={() => onSelect('')}>
        <span className="pill-symbol">✳</span> Tudo
      </button>
      {categories.map((category) => (
        <button
          className={`category-pill ${selected === category.slug ? 'selected' : ''}`}
          key={category.id}
          onClick={() => onSelect(category.slug)}
        >
          <span className="pill-symbol">{category.icon}</span>{category.name}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ search, setSearch, neighborhood, setNeighborhood, onSubmit }) {
  return (
    <form className="search-box" onSubmit={onSubmit}>
      <label className="search-input-group">
        <span className="search-glyph">⌕</span>
        <span className="search-input-copy">
          <small>ESTOU PROCURANDO</small>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: alguém para consertar a torneira" />
        </span>
      </label>
      <span className="search-rule" />
      <label className="search-input-group neighborhood-group">
        <span className="neighborhood-glyph">⌖</span>
        <span className="search-input-copy">
          <small>NO BAIRRO</small>
          <input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Qual bairro ou cidade?" />
        </span>
      </label>
      <button className="button button-coral" type="submit">Buscar <span>↗</span></button>
    </form>
  );
}

function Money({ service }) {
  const amount = Number(service.price);
  return (
    <span className="money">
      {amount > 0 ? `${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ${service.price_unit || ''}` : 'A combinar'}
    </span>
  );
}

function WorkerCard({ profile, onOpen, index }) {
  const service = profile.services?.[0];
  return (
    <article className={`worker-card worker-card-${(index % 4) + 1}`}>
      <div className="worker-card-top">
        <span className="worker-category"><span>{profile.category_icon}</span>{profile.category}</span>
        <span className="worker-availability"><i /> Atende no bairro</span>
        <div className="worker-avatar">
          <span>{profile.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <b>✳</b>
        </div>
        <span className="worker-id">LOCAL Nº {String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="worker-card-body">
        <div className="worker-heading">
          <div><h3>{profile.full_name}</h3><p className="worker-location"><span>⌖</span> {profile.neighborhood}, {profile.city}</p></div>
          <span className="worker-check" title="Perfil ativo">✓</span>
        </div>
        <p className="worker-bio">{profile.bio}</p>
        <div className="worker-service">
          <div><small>O QUE FAZ</small><strong>{service?.title || 'Serviços profissionais'}</strong></div>
          {service && <Money service={service} />}
        </div>
        <button className="worker-more" onClick={() => onOpen(profile)}>Ver perfil e contato <span>↗</span></button>
      </div>
    </article>
  );
}

function AuthDialog({ initialMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setMode(initialMode), [initialMode]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await api(`/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      onSuccess(result);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-panel auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-dismiss" onClick={onClose} aria-label="Fechar">×</button>
        <div className="modal-illustration"><span className="modal-flower">✳</span><span>que bom<br />ter você.</span></div>
        <span className="section-tag">{mode === 'register' ? 'CHEGUE MAIS' : 'BEM-VINDO DE VOLTA'}</span>
        <h2 id="auth-title">{mode === 'register' ? 'Seu trabalho tem lugar aqui.' : 'Seu bairro está com saudade.'}</h2>
        <p className="modal-lede">{mode === 'register' ? 'Crie sua conta e mostre para a vizinhança o que você sabe fazer.' : 'Entre para atualizar seu perfil e continuar recebendo novos contatos.'}</p>
        <form className="auth-fields" onSubmit={submit}>
          {mode === 'register' && <label>Nome completo<input name="full_name" autoComplete="name" minLength="2" maxLength="120" placeholder="Como podemos te chamar?" required /></label>}
          <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required /></label>
          <label>Senha<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength="8" placeholder="Pelo menos 8 caracteres" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-violet button-full" disabled={busy}>{busy ? 'Carregando…' : mode === 'register' ? 'Criar minha conta' : 'Entrar'} <span>↗</span></button>
        </form>
        <p className="auth-switch">{mode === 'register' ? 'Já tem uma conta?' : 'Primeira vez por aqui?'} <button onClick={() => { setError(''); setMode(mode === 'register' ? 'login' : 'register'); }}>{mode === 'register' ? 'Entrar' : 'Criar conta'}</button></p>
      </section>
    </div>
  );
}

function WorkerProfile({ profile, onClose }) {
  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-panel profile-panel" role="dialog" aria-modal="true" aria-labelledby="worker-modal-title">
        <button className="modal-dismiss" onClick={onClose} aria-label="Fechar">×</button>
        <div className="profile-modal-band">
          <span className="worker-category"><span>{profile.category_icon}</span>{profile.category}</span>
          <div className="profile-modal-avatar">{profile.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
        </div>
        <h2 id="worker-modal-title">{profile.full_name}</h2>
        <p className="worker-location"><span>⌖</span> {profile.neighborhood}, {profile.city}</p>
        <p className="profile-modal-bio">{profile.bio}</p>
        {profile.availability && <p className="profile-hours"><span>◷</span> {profile.availability}</p>}
        <h3 className="profile-service-heading">Serviços que oferece</h3>
        <div className="profile-service-list">
          {profile.services.map((service) => (
            <div className="profile-service-row" key={service.id}>
              <div><strong>{service.title}</strong>{service.description && <span>{service.description}</span>}</div>
              <Money service={service} />
            </div>
          ))}
        </div>
        <a className="button button-violet button-full call-worker" href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`}>Ligar para {profile.full_name.split(' ')[0]} <span>↗</span></a>
        <p className="profile-contact-note">Converse diretamente para combinar os detalhes do serviço.</p>
      </section>
    </div>
  );
}

function ProfileManager({ token, user, onSignOut }) {
  const [profile, setProfile] = useState(undefined);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [current, availableCategories] = await Promise.all([api('/profiles/me', { token }), api('/categories')]);
      setProfile(current);
      setCategories(availableCategories);
      setForm(current ? {
        category_id: current.category_id,
        phone: current.phone,
        neighborhood: current.neighborhood,
        city: current.city,
        bio: current.bio,
        availability: current.availability || '',
        services: current.services.map(({ title, description, price, price_unit }) => ({ title, description, price, price_unit }))
      } : blankProfile());
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function changeField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function changeService(index, field, value) {
    setForm((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) => serviceIndex === index ? { ...service, [field]: value } : service)
    }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/profiles/me', {
        token,
        method: profile ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
          services: form.services.map((service) => ({ ...service, price: Number(service.price) }))
        })
      });
      setProfile(result);
      setNotice('Pronto! Seu perfil foi atualizado na vitrine do bairro.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/profiles/me/status', {
        token,
        method: 'PATCH',
        body: JSON.stringify({ is_active: !profile.is_active })
      });
      setProfile((current) => ({ ...current, is_active: result.is_active }));
      setNotice(result.is_active ? 'Seu perfil voltou para a vitrine.' : 'Seu perfil foi pausado e não aparece na busca.');
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    if (!window.confirm('Excluir seu perfil e todos os serviços? Esta ação não pode ser desfeita.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api('/profiles/me', { token, method: 'DELETE' });
      setProfile(null);
      setForm(blankProfile());
      setNotice('Perfil removido. Sua conta continua ativa.');
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (!window.confirm('Excluir permanentemente sua conta, perfil e serviços?')) return;
    const password = window.prompt('Digite sua senha para confirmar:');
    if (password === null) return;
    setBusy(true);
    setError('');
    try {
      await api('/auth/account', { token, method: 'DELETE', body: JSON.stringify({ password }) });
      onSignOut();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  if (profile === undefined || !form) {
    return <section className="dashboard"><div className="dashboard-container"><p className="loading-note">Preparando seu espaço…</p>{error && <p className="form-error">{error}</p>}</div></section>;
  }

  return (
    <section className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <div className="dashboard-mark">✳</div>
          <div><span className="section-tag">SEU ESPAÇO CONECTA</span><h1>Oi, {user.full_name.split(' ')[0]}.</h1><p>Deixe sua vitrine com a sua cara.</p></div>
          <button className="button button-outline dashboard-signout" onClick={onSignOut}>Sair da conta</button>
        </div>
        <div className="dashboard-status">
          <span className={`status-dot ${profile?.is_active ? 'status-on' : 'status-off'}`} />
          <span>{profile ? profile.is_active ? 'Sua vitrine está no ar' : 'Sua vitrine está pausada' : 'Vamos preparar sua vitrine?'}</span>
          {profile && <button className="text-button" onClick={toggleActive} disabled={busy}>{profile.is_active ? 'Pausar vitrine' : 'Colocar no ar'}</button>}
        </div>
        {notice && <p className="form-success" role="status">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <form className="profile-form" onSubmit={save}>
          <div className="form-section-head"><span className="form-step">01</span><div><h2>Quem é você no bairro?</h2><p>Apresente seu trabalho para quem está por perto.</p></div></div>
          <div className="form-grid">
            <label>Área de trabalho<select name="category_id" value={form.category_id} onChange={changeField} required><option value="">Escolha uma categoria</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
            <label>Telefone de contato<input name="phone" value={form.phone} onChange={changeField} required maxLength="30" placeholder="(11) 99999-9999" /></label>
            <label>Seu bairro<input name="neighborhood" value={form.neighborhood} onChange={changeField} required maxLength="100" placeholder="Ex.: Jardim Aurora" /></label>
            <label>Sua cidade<input name="city" value={form.city} onChange={changeField} required maxLength="100" placeholder="Ex.: São Paulo" /></label>
            <label className="form-full">Conte um pouco sobre seu trabalho<textarea name="bio" value={form.bio} onChange={changeField} required maxLength="2000" rows="4" placeholder="Experiência, especialidades, seu jeito de trabalhar..." /></label>
            <label className="form-full">Quando você atende?<input name="availability" value={form.availability} onChange={changeField} maxLength="180" placeholder="Ex.: De segunda a sábado, das 8h às 18h" /></label>
          </div>
          <div className="form-section-head services-form-head"><span className="form-step">02</span><div><h2>O que você oferece?</h2><p>Cadastre até 10 serviços para os vizinhos encontrarem.</p></div></div>
          <div className="service-editor-list">
            {form.services.map((service, index) => (
              <div className="service-editor" key={index}>
                <div className="service-editor-title"><span>TRABALHO {String(index + 1).padStart(2, '0')}</span>{form.services.length > 1 && <button type="button" className="remove-service" onClick={() => setForm((current) => ({ ...current, services: current.services.filter((_, itemIndex) => itemIndex !== index) }))}>Remover</button>}</div>
                <div className="form-grid">
                  <label>Nome do serviço<input required maxLength="120" value={service.title} onChange={(event) => changeService(index, 'title', event.target.value)} placeholder="Ex.: Instalação de chuveiro" /></label>
                  <label>Preço em reais<input type="number" required min="0" step="0.01" value={service.price} onChange={(event) => changeService(index, 'price', event.target.value)} placeholder="0 para combinar" /></label>
                  <label className="form-full">Detalhes<input maxLength="500" value={service.description} onChange={(event) => changeService(index, 'description', event.target.value)} placeholder="O que está incluído?" /></label>
                </div>
              </div>
            ))}
          </div>
          {form.services.length < 10 && <button type="button" className="add-service" onClick={() => setForm((current) => ({ ...current, services: [...current.services, { title: '', description: '', price: '', price_unit: 'por serviço' }] }))}><span>＋</span> Adicionar serviço</button>}
          <div className="form-footer"><p>Ao publicar, sua vitrine fica visível para todo mundo que procura ajuda por perto.</p><button className="button button-violet" disabled={busy}>{busy ? 'Salvando…' : profile ? 'Salvar minha vitrine' : 'Publicar minha vitrine'} <span>↗</span></button></div>
        </form>
        {profile && <div className="danger-zone"><div><strong>Gerenciar conta</strong><span>Remova seu perfil ou seus dados da plataforma.</span></div><div className="danger-actions"><button className="text-button danger-text" onClick={deleteProfile} disabled={busy}>Excluir perfil</button><button className="text-button danger-text" onClick={deleteAccount} disabled={busy}>Excluir conta</button></div></div>}
      </div>
    </section>
  );
}

function blankProfile() {
  return {
    category_id: '',
    phone: '',
    neighborhood: '',
    city: '',
    bio: '',
    availability: '',
    services: [{ title: '', description: '', price: '', price_unit: 'por serviço' }]
  };
}

function App() {
  const [user, setUser] = useState(readSavedUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [authMode, setAuthMode] = useState('');
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  const loadProfiles = useCallback(async (filters = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.neighborhood) params.set('neighborhood', filters.neighborhood);
      if (filters.q) params.set('q', filters.q);
      setProfiles(await api(`/profiles${params.size ? `?${params}` : ''}`));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api('/categories').then(setCategories).catch((loadError) => setError(loadError.message));
    loadProfiles();
  }, [loadProfiles]);

  function submitSearch(event) {
    event.preventDefault();
    loadProfiles({ category: selectedCategory, neighborhood, q: search });
  }

  function selectCategory(slug) {
    const next = selectedCategory === slug ? '' : slug;
    setSelectedCategory(next);
    loadProfiles({ category: next, neighborhood, q: search });
  }

  function completeAuth(result) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
    setAuthMode('');
    setDashboardOpen(true);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setDashboardOpen(false);
  }

  function openDirectory() {
    document.getElementById('explorar')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <TopBar user={user} onAuth={setAuthMode} onDashboard={() => setDashboardOpen((open) => !open)} onSignOut={signOut} />
      <main>
        {dashboardOpen && user && token ? <ProfileManager token={token} user={user} onSignOut={signOut} /> : (
          <>
            <Welcome onSearch={openDirectory} />
            <section className="directory" id="explorar">
              <div className="directory-wrap">
                <div className="directory-heading">
                  <div><span className="section-tag">O BAIRRO TEM O QUE VOCÊ PRECISA</span><h2>Qual é a sua missão?</h2></div>
                  <p>Uma busca pequena pode<br />fazer uma diferença enorme.</p>
                </div>
                <SearchBox search={search} setSearch={setSearch} neighborhood={neighborhood} setNeighborhood={setNeighborhood} onSubmit={submitSearch} />
                <div className="category-heading"><h3>Explore por categoria</h3><span>{categories.length ? `${categories.length} áreas` : 'novas áreas chegando'}</span></div>
                <CategoryStrip categories={categories} selected={selectedCategory} onSelect={selectCategory} />
                <div className="listing-heading">
                  <div><span className="section-tag">PESSOAS QUE FAZEM ACONTECER</span><h2>{selectedCategory ? categories.find((item) => item.slug === selectedCategory)?.name : 'Talento por perto'}</h2></div>
                  <span className="listing-count"><b>{profiles.length}</b> {profiles.length === 1 ? 'profissional' : 'profissionais'}</span>
                </div>
                {error && <div className="catalog-error" role="alert"><span>!</span><div><strong>Não deu para carregar a lista.</strong><p>{error} Verifique se a API e o MySQL estão disponíveis.</p></div><button onClick={() => loadProfiles()}>Tentar de novo ↗</button></div>}
                {loading ? <div className="loading-state"><span className="loading-orbit" /><p>Procurando gente boa por perto…</p></div> : profiles.length ? (
                  <div className="workers-grid">{profiles.map((profile, index) => <WorkerCard key={profile.id} profile={profile} index={index} onOpen={setSelectedProfile} />)}</div>
                ) : !error ? (
                  <div className="empty-directory"><div className="empty-illustration"><span>?</span><i>✳</i></div><h3>A primeira conexão pode ser a sua.</h3><p>Ainda não encontramos perfis nesta busca. Se você oferece um serviço, coloque sua vitrine no ar.</p><button className="button button-violet" onClick={() => user ? setDashboardOpen(true) : setAuthMode('register')}>Quero participar <span>↗</span></button></div>
                ) : null}
                <div className="directory-foot"><span>✳</span> Contratar no bairro é fazer a oportunidade circular no bairro.</div>
              </div>
            </section>
            <section className="community" id="comunidade">
              <div className="community-wrap">
                <div className="community-art"><div className="community-big-type">P<br />erto.</div><div className="community-stamp"><span>FEITO<br />JUNTO</span><b>✳</b></div><div className="community-mini-card"><span className="mini-avatars"><i>A</i><i>M</i><i>J</i></span><b>Uma comunidade<br />que se reconhece.</b></div></div>
                <div className="community-message"><span className="section-tag">CRESCER JUNTO MUDA TUDO</span><h2>Quando o dinheiro fica no bairro, o bairro inteiro floresce.</h2><p>O Conecta Bairro aproxima quem sabe fazer de quem precisa de ajuda. Uma rede simples para gerar renda, confiança e mais oportunidades onde a vida acontece.</p><a href="#inicio" className="community-link">Descubra quem está por perto <span>↗</span></a></div>
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="footer">
        <div className="footer-content"><Brand /><p>Talento do bairro. Oportunidade para todo mundo.</p><button className="footer-invite" onClick={() => user ? setDashboardOpen(true) : setAuthMode('register')}>Tem um serviço? Vem pra rede <span>↗</span></button></div>
        <div className="footer-credits"><span>© 2026 Conecta Bairro</span><span>Uma rede boa começa perto de casa <b>✳</b></span><a href="#inicio">Voltar ao topo ↑</a></div>
      </footer>
      {authMode && <AuthDialog initialMode={authMode} onClose={() => setAuthMode('')} onSuccess={completeAuth} />}
      {selectedProfile && <WorkerProfile profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}
    </>
  );
}

export default App;
