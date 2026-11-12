"use client";

import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, FileText, Trash2, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { sanitizeText, validateSafeUpload } from '@/utils/donationRules';

export default function NoticiasADM() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setLoading(true);
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNews(data);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    let authorName = 'Coordenação';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      if (profile) authorName = profile.name;
    }

    let finalImageUrl = null;
    let finalAttachmentUrl = null;

    if (imageFile) {
      const imgValidation = validateSafeUpload(imageFile, {
        maxSizeMB: 5,
        allowedTypes: ['image'],
      });
      if (!imgValidation.valid) {
        alert(imgValidation.error);
        setSaving(false);
        return;
      }

      const filePath = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${imgValidation.safeExtension}`;
      const { error: uploadError } = await supabase.storage
        .from('news_assets')
        .upload(filePath, imageFile, { contentType: imageFile.type });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('news_assets')
          .getPublicUrl(filePath);
        finalImageUrl = publicUrlData.publicUrl;
      } else {
        alert('Erro no upload da imagem: ' + uploadError.message);
      }
    }

    if (attachmentFile) {
      const docValidation = validateSafeUpload(attachmentFile, {
        maxSizeMB: 10,
        allowedTypes: ['document'],
      });
      if (!docValidation.valid) {
        alert(docValidation.error);
        setSaving(false);
        return;
      }

      const filePath = `attachments/${Date.now()}-${Math.random().toString(36).slice(2)}.${docValidation.safeExtension}`;
      const { error: uploadError } = await supabase.storage
        .from('news_assets')
        .upload(filePath, attachmentFile, { contentType: attachmentFile.type });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('news_assets')
          .getPublicUrl(filePath);
        finalAttachmentUrl = publicUrlData.publicUrl;
      } else {
        alert('Erro no upload do anexo: ' + uploadError.message);
      }
    }

    const newPost = {
      title: sanitizeText(title, 150),
      subtitle: sanitizeText(subtitle, 200),
      content: sanitizeText(content, 4000),
      image_url: finalImageUrl,
      attachment_url: finalAttachmentUrl,
      author_id: userId,
      author_name: authorName,
    };

    const { error } = await supabase.from('news').insert([newPost]);

    setSaving(false);
    if (error) {
      alert('Erro ao publicar: ' + error.message);
    } else {
      setIsModalOpen(false);
      resetForm();
      fetchNews();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente apagar esta notícia?')) return;
    await supabase.from('news').delete().eq('id', id);
    fetchNews();
  }

  function resetForm() {
    setTitle('');
    setSubtitle('');
    setContent('');
    setImageFile(null);
    setAttachmentFile(null);
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-8 pb-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex justify-between items-center gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-1 font-normal"
          >
            <ArrowLeft size={13} /> Voltar para Gestão
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Mural de Notícias</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-full text-xs font-normal transition-colors shrink-0"
        >
          <Plus size={15} />
          Publicar
        </button>
      </div>

      <div className="px-5 py-5 space-y-4">

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Nenhuma postagem ainda</h3>
          <p className="text-slate-500 mt-2 max-w-md">
            Crie sua primeira postagem para manter a comunidade informada.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {news.map((post) => (
            <div
              key={post.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6"
            >
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt="Capa"
                  className="w-full sm:w-48 h-32 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full sm:w-48 h-32 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300">
                  <ImageIcon size={32} />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{post.title}</h2>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {post.subtitle && (
                    <p className="text-red-600 font-medium text-sm mt-1">{post.subtitle}</p>
                  )}
                  <p className="text-slate-500 mt-2 line-clamp-2 text-sm">{post.content}</p>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400 font-medium">
                  <span>Por {post.author_name}</span>
                  <span>&bull;</span>
                  <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                  {post.attachment_url && (
                    <>
                      <span>&bull;</span>
                      <a
                        href={post.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                      >
                        <FileText size={12} /> Ver Anexo PDF
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Nova Postagem */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Criar Nova Postagem</h2>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Título da Postagem
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-900"
                  placeholder="Ex: Convocação para Doação neste Sábado"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subtítulo (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-900"
                  placeholder="Uma breve linha de apoio..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Conteúdo da Matéria
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={4000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all resize-none text-slate-900"
                  placeholder="Escreva os detalhes do comunicado aqui..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Imagem de Capa (JPG/PNG/WEBP até 5MB)
                  </label>
                  <label className="flex items-center justify-center w-full px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <ImageIcon size={18} />
                      {imageFile ? (
                        <span className="truncate max-w-[150px]">{imageFile.name}</span>
                      ) : (
                        <span>Selecionar Imagem</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Documento Anexo (Apenas PDF até 10MB)
                  </label>
                  <label className="flex items-center justify-center w-full px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <FileText size={18} />
                      {attachmentFile ? (
                        <span className="truncate max-w-[150px]">{attachmentFile.name}</span>
                      ) : (
                        <span>Selecionar PDF</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        setAttachmentFile(e.target.files ? e.target.files[0] : null)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Publicar Comunicado</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
