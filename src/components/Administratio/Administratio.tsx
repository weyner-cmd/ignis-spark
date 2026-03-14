import React, { useState, useEffect } from 'react';
import {
  Wallet, Plus, Trash2, Edit2, DollarSign, Package,
  Search, X, Save
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import './Administratio.css';

type Tab = 'tithes' | 'assets';

interface Tithe {
  id: string;
  tenant_id: string;
  donor_name: string;
  amount: number;
  tithe_date: string;
  category: string;
  payment_method: string;
  notes: string | null;
}

interface ParishAsset {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  acquisition_date: string | null;
  estimated_value: number;
  condition: string;
  location: string | null;
  notes: string | null;
}

const TITHE_CATEGORIES = [
  { value: 'dizimo', label: 'Dízimo' },
  { value: 'oferta', label: 'Oferta' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'doacao', label: 'Doação' },
  { value: 'outro', label: 'Outro' },
];

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência' },
];

const ASSET_CATEGORIES = [
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'liturgico', label: 'Litúrgico' },
  { value: 'eletronico', label: 'Eletrônico' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'outro', label: 'Outro' },
];

const ASSET_CONDITIONS = [
  { value: 'otimo', label: 'Ótimo' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Ruim' },
];

interface AdministratioProps {
  tenantId: string;
}

export const Administratio: React.FC<AdministratioProps> = ({ tenantId }) => {
  const [tab, setTab] = useState<Tab>('tithes');
  const [tithes, setTithes] = useState<Tithe[]>([]);
  const [assets, setAssets] = useState<ParishAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Tithe form
  const [titheForm, setTitheForm] = useState({
    donor_name: '', amount: '', tithe_date: new Date().toISOString().split('T')[0],
    category: 'dizimo', payment_method: 'dinheiro', notes: ''
  });

  // Asset form
  const [assetForm, setAssetForm] = useState({
    name: '', category: 'mobiliario', acquisition_date: '',
    estimated_value: '', condition: 'bom', location: '', notes: ''
  });

  useEffect(() => { loadData(); }, [tenantId, tab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (tab === 'tithes') {
        const { data, error } = await supabase
          .from('tithes')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('tithe_date', { ascending: false });
        if (error) throw error;
        setTithes((data || []) as Tithe[]);
      } else {
        const { data, error } = await supabase
          .from('parish_assets')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name', { ascending: true });
        if (error) throw error;
        setAssets((data || []) as ParishAsset[]);
      }
    } catch (err) {
      console.error('Administratio load error:', err);
      toast.error('Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setTitheForm({ donor_name: '', amount: '', tithe_date: new Date().toISOString().split('T')[0], category: 'dizimo', payment_method: 'dinheiro', notes: '' });
    setAssetForm({ name: '', category: 'mobiliario', acquisition_date: '', estimated_value: '', condition: 'bom', location: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveTithe = async () => {
    if (!titheForm.donor_name || !titheForm.amount) {
      toast.error('Preencha nome do doador e valor.');
      return;
    }
    try {
      const payload = {
        tenant_id: tenantId,
        donor_name: titheForm.donor_name,
        amount: parseFloat(titheForm.amount),
        tithe_date: titheForm.tithe_date,
        category: titheForm.category,
        payment_method: titheForm.payment_method,
        notes: titheForm.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from('tithes').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Registro atualizado.');
      } else {
        const { error } = await supabase.from('tithes').insert([payload]);
        if (error) throw error;
        toast.success('Registro criado.');
      }
      resetForms();
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar.');
    }
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name) {
      toast.error('Preencha o nome do patrimônio.');
      return;
    }
    try {
      const payload = {
        tenant_id: tenantId,
        name: assetForm.name,
        category: assetForm.category,
        acquisition_date: assetForm.acquisition_date || null,
        estimated_value: assetForm.estimated_value ? parseFloat(assetForm.estimated_value) : 0,
        condition: assetForm.condition,
        location: assetForm.location || null,
        notes: assetForm.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from('parish_assets').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Patrimônio atualizado.');
      } else {
        const { error } = await supabase.from('parish_assets').insert([payload]);
        if (error) throw error;
        toast.success('Patrimônio cadastrado.');
      }
      resetForms();
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar.');
    }
  };

  const handleDelete = async (id: string) => {
    const table = tab === 'tithes' ? 'tithes' : 'parish_assets';
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toast.success('Registro excluído.');
      loadData();
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  const editTithe = (t: Tithe) => {
    setTitheForm({
      donor_name: t.donor_name, amount: String(t.amount), tithe_date: t.tithe_date,
      category: t.category, payment_method: t.payment_method, notes: t.notes || ''
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const editAsset = (a: ParishAsset) => {
    setAssetForm({
      name: a.name, category: a.category, acquisition_date: a.acquisition_date || '',
      estimated_value: String(a.estimated_value), condition: a.condition,
      location: a.location || '', notes: a.notes || ''
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const filteredTithes = tithes.filter(t =>
    t.donor_name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalTithes = tithes.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.estimated_value), 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="administratio-module">
      <header className="admin-header glass">
        <div className="admin-header-top">
          <h2><Wallet size={24} className="text-accent" /> Administratio</h2>
          <button className="btn-primary" onClick={() => { resetForms(); setShowForm(true); }}>
            <Plus size={18} /> {tab === 'tithes' ? 'Novo Registro' : 'Novo Patrimônio'}
          </button>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'tithes' ? 'active' : ''}`} onClick={() => { setTab('tithes'); setShowForm(false); }}>
            <DollarSign size={16} /> Dízimos e Ofertas
          </button>
          <button className={`admin-tab ${tab === 'assets' ? 'active' : ''}`} onClick={() => { setTab('assets'); setShowForm(false); }}>
            <Package size={16} /> Patrimônio
          </button>
        </div>

        <div className="admin-summary">
          {tab === 'tithes' ? (
            <>
              <div className="summary-card">
                <span className="summary-label">Total do Mês</span>
                <span className="summary-value">{formatCurrency(totalTithes)}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Registros</span>
                <span className="summary-value">{tithes.length}</span>
              </div>
            </>
          ) : (
            <>
              <div className="summary-card">
                <span className="summary-label">Valor Total Estimado</span>
                <span className="summary-value">{formatCurrency(totalAssets)}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Itens Cadastrados</span>
                <span className="summary-value">{assets.length}</span>
              </div>
            </>
          )}
        </div>

        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder={tab === 'tithes' ? 'Buscar por doador...' : 'Buscar patrimônio...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      {showForm && (
        <div className="admin-form glass">
          <div className="form-header">
            <h3>{editingId ? 'Editar' : 'Novo'} {tab === 'tithes' ? 'Registro Financeiro' : 'Patrimônio'}</h3>
            <button className="btn-icon" onClick={resetForms}><X size={18} /></button>
          </div>

          {tab === 'tithes' ? (
            <div className="form-grid">
              <div className="form-group">
                <label>Nome do Doador *</label>
                <input className="input-text" value={titheForm.donor_name} onChange={e => setTitheForm(f => ({ ...f, donor_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input className="input-text" type="number" step="0.01" value={titheForm.amount} onChange={e => setTitheForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input className="input-text" type="date" value={titheForm.tithe_date} onChange={e => setTitheForm(f => ({ ...f, tithe_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select className="input-select" value={titheForm.category} onChange={e => setTitheForm(f => ({ ...f, category: e.target.value }))}>
                  {TITHE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Forma de Pagamento</label>
                <select className="input-select" value={titheForm.payment_method} onChange={e => setTitheForm(f => ({ ...f, payment_method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Observações</label>
                <textarea className="input-textarea" value={titheForm.notes} onChange={e => setTitheForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group">
                <label>Nome do Item *</label>
                <input className="input-text" value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select className="input-select" value={assetForm.category} onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))}>
                  {ASSET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Data de Aquisição</label>
                <input className="input-text" type="date" value={assetForm.acquisition_date} onChange={e => setAssetForm(f => ({ ...f, acquisition_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Valor Estimado (R$)</label>
                <input className="input-text" type="number" step="0.01" value={assetForm.estimated_value} onChange={e => setAssetForm(f => ({ ...f, estimated_value: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Condição</label>
                <select className="input-select" value={assetForm.condition} onChange={e => setAssetForm(f => ({ ...f, condition: e.target.value }))}>
                  {ASSET_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Localização</label>
                <input className="input-text" value={assetForm.location} onChange={e => setAssetForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="form-group full-width">
                <label>Observações</label>
                <textarea className="input-textarea" value={assetForm.notes} onChange={e => setAssetForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="btn-secondary" onClick={resetForms}>Cancelar</button>
            <button className="btn-primary" onClick={tab === 'tithes' ? handleSaveTithe : handleSaveAsset}>
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-container glass">
        {isLoading ? (
          <div className="admin-loading">
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />)}
          </div>
        ) : tab === 'tithes' ? (
          filteredTithes.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Doador</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Categoria</th>
                  <th>Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTithes.map(t => (
                  <tr key={t.id}>
                    <td>{t.donor_name}</td>
                    <td className="text-accent">{formatCurrency(Number(t.amount))}</td>
                    <td>{new Date(t.tithe_date).toLocaleDateString('pt-BR')}</td>
                    <td>{TITHE_CATEGORIES.find(c => c.value === t.category)?.label || t.category}</td>
                    <td>{PAYMENT_METHODS.find(m => m.value === t.payment_method)?.label || t.payment_method}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon-sm" onClick={() => editTithe(t)}><Edit2 size={14} /></button>
                        <button className="btn-icon-sm danger" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <DollarSign size={48} />
              <p>Nenhum registro financeiro encontrado.</p>
            </div>
          )
        ) : (
          filteredAssets.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Categoria</th>
                  <th>Valor Est.</th>
                  <th>Condição</th>
                  <th>Local</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{ASSET_CATEGORIES.find(c => c.value === a.category)?.label || a.category}</td>
                    <td className="text-accent">{formatCurrency(Number(a.estimated_value))}</td>
                    <td>
                      <span className={`condition-badge ${a.condition}`}>
                        {ASSET_CONDITIONS.find(c => c.value === a.condition)?.label || a.condition}
                      </span>
                    </td>
                    <td>{a.location || '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon-sm" onClick={() => editAsset(a)}><Edit2 size={14} /></button>
                        <button className="btn-icon-sm danger" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Package size={48} />
              <p>Nenhum patrimônio cadastrado.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
