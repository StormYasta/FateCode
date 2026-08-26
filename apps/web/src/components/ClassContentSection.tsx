import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  Download,
  FileText,
  MessageSquareText,
  Pencil,
  Pin,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

type ContentType = 'POST' | 'TEXT' | 'DOCUMENT';

type ClassContent = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; avatarUrl?: string | null; role: string } | null;
};

type Props = {
  classId: string;
  canManage: boolean;
};

const API_ORIGIN = String(api.defaults.baseURL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ClassContentSection: React.FC<Props> = ({ classId, canManage }) => {
  const [contents, setContents] = useState<ClassContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [type, setType] = useState<ContentType>('POST');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editPinned, setEditPinned] = useState(false);

  const loadContents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/classes/${classId}/contents`);
      setContents(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar os materiais da turma.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
  }, [classId]);

  const resetComposer = () => {
    setType('POST');
    setTitle('');
    setBody('');
    setIsPinned(false);
    setFile(null);
    setShowComposer(false);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (type === 'DOCUMENT') {
        if (!file) throw new Error('Selecione um documento.');
        const data = new FormData();
        data.append('title', title.trim() || file.name);
        data.append('body', body.trim());
        data.append('isPinned', String(isPinned));
        data.append('file', file);
        await api.post(`/classes/${classId}/contents/documents`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/classes/${classId}/contents`, {
          type,
          title: title.trim(),
          body: body.trim(),
          isPinned,
        });
      }
      resetComposer();
      await loadContents();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Não foi possível publicar o conteúdo.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: ClassContent) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body || '');
    setEditPinned(item.isPinned);
  };

  const saveEdit = async (item: ClassContent) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/classes/${classId}/contents/${item.id}`, {
        title: editTitle.trim(),
        body: editBody,
        isPinned: editPinned,
      });
      setEditingId(null);
      await loadContents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível atualizar o conteúdo.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item: ClassContent) => {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    setError('');
    try {
      await api.delete(`/classes/${classId}/contents/${item.id}`);
      await loadContents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível excluir o conteúdo.');
    }
  };

  const contentCountLabel = useMemo(() => `${contents.length} publicação${contents.length === 1 ? '' : 'ões'}`, [contents.length]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <MessageSquareText className="w-4 h-4" /> Sala da Turma
          </div>
          <h2 className="text-xl font-black text-white mt-1">Materiais, textos e avisos</h2>
          <p className="text-xs text-slate-400 mt-1">{contentCountLabel} · conteúdo organizado diretamente pela equipe docente.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowComposer((current) => !current)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2"
          >
            {showComposer ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showComposer ? 'Fechar' : 'Publicar conteúdo'}
          </button>
        )}
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

      {canManage && showComposer && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-2">
            {([
              ['POST', 'Post / aviso'],
              ['TEXT', 'Texto / material'],
              ['DOCUMENT', 'Documento'],
            ] as [ContentType, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${type === value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/70 border-slate-800 text-slate-300'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            required={type !== 'DOCUMENT'}
            minLength={type !== 'DOCUMENT' ? 3 : undefined}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'DOCUMENT' ? 'Título do documento (opcional)' : 'Título'}
            className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white"
          />

          <textarea
            required={type !== 'DOCUMENT'}
            rows={type === 'POST' ? 4 : 7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === 'DOCUMENT' ? 'Descrição ou orientação sobre o arquivo (opcional)' : 'Escreva o conteúdo para a turma...'}
            className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white resize-y"
          />

          {type === 'DOCUMENT' && (
            <label className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-4 flex items-center gap-3 cursor-pointer hover:border-indigo-500/50">
              <Upload className="w-5 h-5 text-indigo-400" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200 truncate">{file?.name || 'Selecionar documento'}</div>
                <div className="text-[11px] text-slate-400">PDF, Office, TXT/CSV ou imagem · até 20 MB</div>
              </div>
              <input
                type="file"
                required
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
              Fixar no topo da turma
            </label>
            <button disabled={saving} type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50">
              {saving ? 'Publicando...' : type === 'DOCUMENT' ? 'Enviar documento' : 'Publicar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0f1628]/80 p-8 text-center text-sm text-slate-400">Carregando conteúdo...</div>
      ) : contents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white mt-3">Nenhum material publicado ainda</h3>
          <p className="text-xs text-slate-400 mt-1">Posts, textos e documentos da turma aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contents.map((item) => (
            <article key={item.id} className={`rounded-2xl border p-5 ${item.isPinned ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-800 bg-[#0f1628]/80'}`}>
              {editingId === item.id ? (
                <div className="space-y-3">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm text-white" />
                  <textarea rows={5} value={editBody} onChange={(e) => setEditBody(e.target.value)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm text-white" />
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={editPinned} onChange={(e) => setEditPinned(e.target.checked)} /> Fixado</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 text-xs text-slate-300">Cancelar</button>
                      <button type="button" disabled={saving} onClick={() => saveEdit(item)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Salvar</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                        {item.isPinned && <span className="text-indigo-300 flex items-center gap-1"><Pin className="w-3 h-3" /> Fixado</span>}
                        <span className="text-slate-500">{item.type === 'POST' ? 'AVISO' : item.type === 'TEXT' ? 'TEXTO' : 'DOCUMENTO'}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{item.author?.name || 'Equipe docente'}</span>
                        <span className="text-slate-500">· {new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">{item.title}</h3>
                    </div>
                    {canManage && (
                      <div className="flex gap-1 shrink-0">
                        <button type="button" title="Editar" onClick={() => startEdit(item)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"><Pencil className="w-3.5 h-3.5" /></button>
                        <button type="button" title="Excluir" onClick={() => removeItem(item)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>

                  {item.body && <p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap leading-relaxed">{item.body}</p>}

                  {item.type === 'DOCUMENT' && item.fileUrl && (
                    <a
                      href={`${API_ORIGIN}${item.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-3 hover:border-indigo-500/40 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-indigo-400" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{item.fileName}</div>
                        <div className="text-[10px] text-slate-500">{item.mimeType} {item.fileSize ? `· ${formatFileSize(item.fileSize)}` : ''}</div>
                      </div>
                      <Download className="w-4 h-4 text-indigo-400" />
                    </a>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
