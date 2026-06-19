'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Save, Loader2, ArrowLeft, Upload, X, HelpCircle, FileText, ChevronDown } from 'lucide-react';

export interface ResourceFormProps {
  initialData?: any;
  isEdit?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ResourceForm({ initialData, isEdit = false }: ResourceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('prompt_llm');
  const [status, setStatus] = useState('published');
  const [categoryId, setCategoryId] = useState('');
  const [compatibleModels, setCompatibleModels] = useState<string[]>([]);
  const [modelInput, setModelInput] = useState('');
  const [exampleInput, setExampleInput] = useState('');
  const [exampleOutput, setExampleOutput] = useState('');
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [outputType, setOutputType] = useState<'text' | 'image'>('text');
  const [uploadingInput, setUploadingInput] = useState(false);
  const [uploadingOutput, setUploadingOutput] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Obtener categorías dinámicamente
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/categories');
      const payload = await res.json();
      return payload.data || [];
    },
  });

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setContent(initialData.content || '');
      setType(initialData.type || 'prompt_llm');
      setStatus(initialData.status || 'published');
      setCategoryId(initialData.categoryId || '');
      setCompatibleModels(initialData.compatibleModels || []);
      
      const valInput = initialData.exampleInput || '';
      const valOutput = initialData.exampleOutput || '';
      setExampleInput(valInput);
      setExampleOutput(valOutput);

      if (valInput.startsWith('http://') || valInput.startsWith('https://')) {
        setInputType('image');
      } else {
        setInputType('text');
      }

      if (valOutput.startsWith('http://') || valOutput.startsWith('https://')) {
        setOutputType('image');
      } else {
        setOutputType('text');
      }

      setTags(initialData.tags || []);
      setFiles(initialData.files || []);
    }
  }, [initialData]);

  // Manejo de chips de modelos compatibles
  const handleModelAdd = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && modelInput.trim()) {
      e.preventDefault();
      const cleanInput = modelInput.trim().replace(/,$/, '');
      if (cleanInput && !compatibleModels.includes(cleanInput)) {
        setCompatibleModels([...compatibleModels, cleanInput]);
      }
      setModelInput('');
    }
  };

  const handleModelRemove = (idxToRemove: number) => {
    setCompatibleModels(compatibleModels.filter((_, idx) => idx !== idxToRemove));
  };

  // Manejo de chips de tags
  const handleTagAdd = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const cleanInput = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (cleanInput && !tags.includes(cleanInput)) {
        if (tags.length >= 5) {
          setErrorMsg('No puedes añadir más de 5 etiquetas.');
          return;
        }
        setTags([...tags, cleanInput]);
        setErrorMsg(null);
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (idxToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== idxToRemove));
  };

  // Subida de archivos (imagen/JSON)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploadingFile(true);
    setErrorMsg(null);

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || 'Error al subir archivo.');
      }

      if (payload.data) {
        setFiles([
          ...files,
          {
            fileUrl: payload.data.fileUrl,
            fileType: payload.data.fileType,
            fileSize: payload.data.fileSize,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al subir el archivo.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'input' | 'output') => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const setUploading = field === 'input' ? setUploadingInput : setUploadingOutput;
    const setValue = field === 'input' ? setExampleInput : setExampleOutput;

    setUploading(true);
    setErrorMsg(null);

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || 'Error al subir la imagen.');
      }

      if (payload.data?.fileUrl) {
        setValue(payload.data.fileUrl);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileRemove = (idxToRemove: number) => {
    setFiles(files.filter((_, idx) => idx !== idxToRemove));
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Auto-agregar modelo pendiente si el usuario no presionó Enter
    let finalCompatibleModels = [...compatibleModels];
    if (modelInput.trim()) {
      const cleanInput = modelInput.trim().replace(/,$/, '');
      if (cleanInput && !finalCompatibleModels.includes(cleanInput)) {
        finalCompatibleModels.push(cleanInput);
        setCompatibleModels(finalCompatibleModels);
        setModelInput('');
      }
    }

    // Auto-agregar etiqueta pendiente si el usuario no presionó Enter
    let finalTags = [...tags];
    if (tagInput.trim()) {
      const cleanInput = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (cleanInput && !finalTags.includes(cleanInput)) {
        if (finalTags.length < 5) {
          finalTags.push(cleanInput);
          setTags(finalTags);
          setTagInput('');
        }
      }
    }

    const url = isEdit ? `/api/v1/resources/${initialData.id}` : '/api/v1/resources';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || null,
          content,
          type,
          status,
          categoryId: categoryId || null,
          compatibleModels: finalCompatibleModels,
          exampleInput: exampleInput || null,
          exampleOutput: exampleOutput || null,
          tags: finalTags,
          files,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || 'Error al guardar prompt.');
      }

      if (payload.data) {
        router.push(`/resource/${payload.data.slug}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar el recurso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8">
      {/* Botón Volver y Cabecera */}
      <div className="flex flex-col gap-4 border-b border-zinc-850 pb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-350 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Editar Prompt / Recurso' : 'Publicar nuevo Prompt / Recurso'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Comparte tus prompts estructurados y haz que la comunidad cree mejores respuestas de IA.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Título */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Título del recurso</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Redactor Creativo SEO con GPT-4"
            className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-650 outline-none text-sm transition-all"
          />
        </div>

        {/* Tipo de recurso */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Tipo de recurso</label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-300 outline-none text-sm transition-all appearance-none cursor-pointer"
            >
              <option value="prompt_llm" className="bg-zinc-950 text-zinc-350">Prompt LLM (Texto)</option>
              <option value="prompt_image" className="bg-zinc-950 text-zinc-350">Prompt Imagen (Midjourney, DALL-E)</option>
              <option value="prompt_video" className="bg-zinc-950 text-zinc-350">Prompt Video (Sora, Runway)</option>
              <option value="agent" className="bg-zinc-950 text-zinc-350">Agente IA (GPTs, Agent)</option>
              <option value="workflow" className="bg-zinc-950 text-zinc-350">Workflow (n8n, Make)</option>
              <option value="other" className="bg-zinc-950 text-zinc-350">Otro</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 h-4.5 w-4.5 pointer-events-none" />
          </div>
        </div>

        {/* Descripción corta */}
        <div className="md:col-span-3 space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Descripción resumida</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Prompt optimizado para estructurar posts largos en formato Markdown utilizando técnicas avanzadas de copywriting."
            className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-650 outline-none text-sm transition-all"
          />
        </div>
      </div>

      {/* El Prompt Principal */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">El Prompt o Instrucciones</label>
          <span className="text-[10px] text-purple-400 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            Soporta formato Markdown
          </span>
        </div>
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ej. Actúa como un experto en SEO copywriter. A continuación te pasaré una palabra clave..."
          rows={10}
          className="w-full px-4 py-4 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-650 outline-none text-sm transition-all font-mono leading-relaxed"
        />
      </div>

      {/* Modelos, Categorías y Tags */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categoría */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Categoría</label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-300 outline-none text-sm transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-zinc-950 text-zinc-350">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-950 text-zinc-350">
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 h-4.5 w-4.5 pointer-events-none" />
          </div>
        </div>

        {/* Modelos Compatibles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Modelos compatibles</label>
          <div className="space-y-2">
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              onKeyDown={handleModelAdd}
              placeholder="Ej. GPT-4o, Claude 3.5 Sonnet..."
              className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-650 outline-none text-sm transition-all"
            />
            {compatibleModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {compatibleModels.map((model, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300"
                  >
                    <span>{model}</span>
                    <button type="button" onClick={() => handleModelRemove(idx)}>
                      <X className="h-3 w-3 hover:text-white transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Etiquetas (Máx. 5)</label>
          <div className="space-y-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagAdd}
              placeholder="Ej. seo, copy, redaccion..."
              className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-650 outline-none text-sm transition-all"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-purple-950/20 border border-purple-900/30 rounded-lg text-purple-400 font-medium"
                  >
                    <span>#{tag}</span>
                    <button type="button" onClick={() => handleTagRemove(idx)}>
                      <X className="h-3 w-3 hover:text-white transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ejemplos de Entrada y Salida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-850">
        {/* Entrada */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Ejemplo de Entrada (Input)</label>
            <div className="flex bg-zinc-950 border border-zinc-850 rounded-lg p-0.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setInputType('text')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  inputType === 'text' ? 'bg-purple-650 text-white' : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Texto
              </button>
              <button
                type="button"
                onClick={() => setInputType('image')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  inputType === 'image' ? 'bg-purple-650 text-white' : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Imagen
              </button>
            </div>
          </div>

          {inputType === 'text' ? (
            <textarea
              value={exampleInput}
              onChange={(e) => setExampleInput(e.target.value)}
              placeholder="Ej. Tema: Alimentación saludable, Keyword: Dieta keto"
              rows={4}
              className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-650 outline-none text-sm transition-all resize-none animate-fadeIn"
            />
          ) : (
            exampleInput && (exampleInput.startsWith('http://') || exampleInput.startsWith('https://')) ? (
              <div className="relative border border-zinc-850 bg-zinc-950/40 rounded-2xl overflow-hidden h-32 flex items-center justify-center p-2 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exampleInput}
                  alt="Entrada de ejemplo"
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setExampleInput('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/5 rounded-2xl cursor-pointer transition-all h-32 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'input')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploadingInput}
                />
                {uploadingInput ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-zinc-500 group-hover:text-purple-400 transition-colors mb-1.5" />
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors text-center font-medium">Subir Imagen de Entrada</span>
                  </>
                )}
              </label>
            )
          )}
        </div>

        {/* Salida */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Ejemplo de Salida (Output)</label>
            <div className="flex bg-zinc-950 border border-zinc-850 rounded-lg p-0.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setOutputType('text')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  outputType === 'text' ? 'bg-purple-650 text-white' : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Texto
              </button>
              <button
                type="button"
                onClick={() => setOutputType('image')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  outputType === 'image' ? 'bg-purple-650 text-white' : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Imagen
              </button>
            </div>
          </div>

          {outputType === 'text' ? (
            <textarea
              value={exampleOutput}
              onChange={(e) => setExampleOutput(e.target.value)}
              placeholder="Ej. Generará una tabla comparativa con 5 alimentos..."
              rows={4}
              className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-100 placeholder-zinc-650 outline-none text-sm transition-all resize-none animate-fadeIn"
            />
          ) : (
            exampleOutput && (exampleOutput.startsWith('http://') || exampleOutput.startsWith('https://')) ? (
              <div className="relative border border-zinc-850 bg-zinc-950/40 rounded-2xl overflow-hidden h-32 flex items-center justify-center p-2 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exampleOutput}
                  alt="Salida de ejemplo"
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setExampleOutput('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/5 rounded-2xl cursor-pointer transition-all h-32 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'output')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploadingOutput}
                />
                {uploadingOutput ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-zinc-500 group-hover:text-purple-400 transition-colors mb-1.5" />
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors text-center font-medium">Subir Imagen de Salida</span>
                  </>
                )}
              </label>
            )
          )}
        </div>
      </div>

      {/* Adjuntos / Dropzone */}
      <div className="space-y-3 pt-4 border-t border-zinc-850">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Imagen de muestra o adjuntos</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tarjeta dropzone */}
          <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/5 rounded-2xl cursor-pointer transition-all h-32 group">
            <input
              type="file"
              accept="image/*,application/json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadingFile}
            />
            {uploadingFile ? (
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-zinc-500 group-hover:text-purple-400 transition-colors mb-2" />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors text-center">Subir Imagen / Config</span>
              </>
            )}
          </label>

          {/* Previsualizadores de archivos */}
          {files.map((file, idx) => (
            <div
              key={idx}
              className="relative border border-zinc-800 bg-zinc-950/30 rounded-2xl overflow-hidden h-32 flex items-center justify-center group p-1.5"
            >
              {file.fileType?.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.fileUrl}
                  alt="Previsualización"
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-zinc-400">
                  <FileText className="h-6 w-6 text-purple-400" />
                  <span className="text-[10px] truncate max-w-[120px]">{file.fileUrl.split('/').pop()}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleFileRemove(idx)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="pt-6 border-t border-zinc-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        {/* Selector de estado */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado:</label>
          <div className="flex bg-zinc-950/80 border border-zinc-850 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setStatus('published')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                status === 'published' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Público
            </button>
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                status === 'draft' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Borrador (Privado)
            </button>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-950/20 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isEdit ? 'Guardar cambios' : 'Publicar prompt'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
