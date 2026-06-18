'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { MessageSquare, CornerDownRight, Trash2, Send, Calendar } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { createClient } from '@/lib/supabase/client';

interface CommentProfile {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  resourceId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  authorProfile: CommentProfile | null;
}

interface CommentSectionProps {
  resourceId: string;
}

export default function CommentSection({ resourceId }: CommentSectionProps) {
  const { session, profile } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/v1/resources/${resourceId}/comments`);
      const payload = await res.json();
      if (res.ok && payload.data) {
        setComments(payload.data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    const supabase = createClient();
    const channel = supabase
      .channel(`resource-comments-${resourceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `resource_id=eq.${resourceId}`
        },
        (payload) => {
          // Refrescamos si el cambio no es de una inserción propia (las inserciones propias ya se agregan optimistamente)
          const isMyInsert = payload.eventType === 'INSERT' && payload.new && (payload.new as any).author_id === profile?.id;
          if (!isMyInsert) {
            fetchComments();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resourceId, profile?.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/resources/${resourceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      const payload = await res.json();
      if (res.ok && payload.data) {
        setComments((prev) => [...prev, payload.data]);
        setNewComment('');
      } else {
        alert(payload.error?.message || 'Error al enviar el comentario.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!session || !replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/resources/${resourceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentId }),
      });
      const payload = await res.json();
      if (res.ok && payload.data) {
        setComments((prev) => [...prev, payload.data]);
        setReplyContent('');
        setReplyToId(null);
      } else {
        alert(payload.error?.message || 'Error al enviar la respuesta.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Eliminar también las respuestas asociadas localmente
        setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
      } else {
        const payload = await res.json();
        alert(payload.error?.message || 'Error al eliminar el comentario.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Separar comentarios raíz de las respuestas
  const rootComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  const getRepliesForRoot = (parentId: string) => {
    return replies.filter((r) => r.parentId === parentId);
  };

  const formatDate = (dateInput: string | Date) => {
    return new Date(dateInput).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-400" />
        <span>Comentarios ({comments.length})</span>
      </h3>

      {/* Formulario para comentar */}
      {session ? (
        <form onSubmit={handleAddComment} className="flex gap-3 items-start">
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.displayName || profile?.username || 'U'}
            size="sm"
            className="h-9 w-9"
          />
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Añade un comentario..."
              className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors resize-none pr-12"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="absolute right-3.5 bottom-3.5 p-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 rounded-lg transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-zinc-900/20 border border-zinc-850 rounded-xl text-center text-sm text-zinc-400">
          <Link href="/login" className="text-purple-400 hover:underline font-medium">
            Inicia sesión
          </Link>{' '}
          para dejar un comentario o responder.
        </div>
      )}

      {/* Lista de comentarios */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-16 bg-zinc-900/40 animate-pulse rounded-xl" />
          <div className="h-16 bg-zinc-900/40 animate-pulse rounded-xl" />
        </div>
      ) : rootComments.length > 0 ? (
        <div className="space-y-6">
          {rootComments.map((comment) => {
            const commentReplies = getRepliesForRoot(comment.id);
            const isAuthor = profile && profile.id === comment.authorId;

            return (
              <div key={comment.id} className="space-y-3">
                {/* Comentario Raíz */}
                <div className="bg-zinc-900/20 border border-zinc-900/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Link href={`/u/${comment.authorProfile?.username}`}>
                        <Avatar
                          src={comment.authorProfile?.avatarUrl}
                          alt={comment.authorProfile?.displayName || comment.authorProfile?.username || 'U'}
                          size="sm"
                          className="h-8 w-8"
                        />
                      </Link>
                      <div>
                        <Link href={`/u/${comment.authorProfile?.username}`} className="text-xs font-bold text-white hover:text-purple-400 transition-colors">
                          {comment.authorProfile?.displayName || `@${comment.authorProfile?.username}`}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {isAuthor && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                        title="Eliminar comentario"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-zinc-300 pl-1 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>

                  {session && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => {
                          setReplyToId(replyToId === comment.id ? null : comment.id);
                          setReplyContent('');
                        }}
                        className="text-[10px] font-semibold text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer"
                      >
                        Responder
                      </button>
                    </div>
                  )}
                </div>

                {/* Formulario de Respuesta */}
                {replyToId === comment.id && (
                  <div className="ml-6 flex gap-3 items-start border-l-2 border-zinc-850 pl-4 animate-in slide-in-from-top-1 duration-150">
                    <textarea
                      rows={1}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Responder a ${comment.authorProfile?.displayName || `@${comment.authorProfile?.username}`}...`}
                      className="flex-1 bg-zinc-900/40 border border-zinc-850 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReplyToId(null)}
                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Respuestas anidadas (Hijos) */}
                {commentReplies.length > 0 && (
                  <div className="ml-6 space-y-3 border-l border-zinc-900/60 pl-4">
                    {commentReplies.map((reply) => {
                      const isReplyAuthor = profile && profile.id === reply.authorId;

                      return (
                        <div key={reply.id} className="bg-zinc-900/10 border border-zinc-900/50 rounded-2xl p-4.5 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <CornerDownRight className="h-3.5 w-3.5 text-zinc-600" />
                              <Link href={`/u/${reply.authorProfile?.username}`}>
                                <Avatar
                                  src={reply.authorProfile?.avatarUrl}
                                  alt={reply.authorProfile?.displayName || reply.authorProfile?.username || 'U'}
                                  size="sm"
                                  className="h-7 w-7"
                                />
                              </Link>
                              <div>
                                <Link href={`/u/${reply.authorProfile?.username}`} className="text-xs font-bold text-white hover:text-purple-400 transition-colors">
                                  {reply.authorProfile?.displayName || `@${reply.authorProfile?.username}`}
                                </Link>
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-550 mt-0.5">
                                  <Calendar className="h-2.5 w-2.5" />
                                  <span>{formatDate(reply.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            {isReplyAuthor && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-zinc-650 hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                                title="Eliminar respuesta"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-zinc-350 pl-5 whitespace-pre-wrap leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-2xl">
          <p className="text-zinc-550 text-sm">Aún no hay comentarios. ¡Sé el primero en opinar!</p>
        </div>
      )}
    </div>
  );
}
