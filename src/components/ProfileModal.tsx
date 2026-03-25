import React, { useState, useRef } from 'react';
import { X, Camera, Save, Lock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [address, setAddress] = useState((profile as any)?.address || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [_currentPassword, _setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  if (!isOpen || !user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarUrl: string | undefined;

      // Upload avatar if changed
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      }

      // Update profile
      const updatePayload: Record<string, string> = {};
      if (fullName !== profile?.full_name) updatePayload.full_name = fullName;
      if (avatarUrl) updatePayload.avatar_url = avatarUrl;
      if (phone !== ((profile as any)?.phone || '')) updatePayload.phone = phone;
      if (address !== ((profile as any)?.address || '')) updatePayload.address = address;

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);
        if (error) throw error;
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('As senhas não coincidem.');
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error('A senha deve ter no mínimo 6 caracteres.');
          setIsSaving(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }

      toast.success('Perfil atualizado com sucesso!');
      onClose();
      // Reload to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarPreview || (profile as any)?.avatar_url || null;
  const avatarLetter = (profile?.full_name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal glass" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Editar Perfil</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">{avatarLetter}</div>
            )}
            <div className="profile-avatar-overlay">
              <Camera size={20} />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          <p className="profile-avatar-hint">Clique para alterar a foto</p>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Nome Completo</label>
            <input className="input-text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input className="input-text" value={user.email || ''} disabled />
          </div>

          <div className="form-group">
            <label>Telefone / WhatsApp</label>
            <input className="input-text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>

          <div className="form-group">
            <label>Endereço</label>
            <input className="input-text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro..." />
          </div>

          <div className="form-group">
            <label>Função</label>
            <input className="input-text" value={
              profile?.role === 'super_admin' ? 'Super Admin'
                : profile?.role === 'matriz_admin' ? 'Admin Paróquia'
                : profile?.role === 'comunidade_lead' ? 'Líder Comunidade'
                : 'Fiel'
            } disabled />
          </div>

          <button
            className="btn-secondary password-toggle"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Lock size={16} /> {showPasswordSection ? 'Cancelar alteração de senha' : 'Alterar senha'}
          </button>

          {showPasswordSection && (
            <div className="password-section">
              <div className="form-group">
                <label>Nova Senha</label>
                <input className="input-text" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="form-group">
                <label>Confirmar Nova Senha</label>
                <input className="input-text" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="profile-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
