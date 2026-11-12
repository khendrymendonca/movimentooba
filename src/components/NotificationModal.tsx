"use client";

import { useState, useEffect } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Calendar,
  Newspaper,
  Info,
  CheckCircle2,
  ExternalLink,
  Award,
  LifeBuoy,
} from 'lucide-react';
import { AppNotification } from '@/utils/donationRules';
import Link from 'next/link';

interface NotificationModalProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
}

export function NotificationModal({
  notifications,
  isOpen,
  onClose,
  onMarkAllAsRead,
  onDismiss,
}: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200/90 relative max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                Notificações
              </h2>
              <span className="text-[11px] text-slate-500 font-normal">
                {notifications.length} {notifications.length === 1 ? 'aviso' : 'avisos'} no app
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && onMarkAllAsRead && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] text-slate-500 hover:text-red-600 font-normal underline transition-colors"
                title="Limpar todas as notificações"
              >
                Limpar tudo
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Lista de Notificações com Rolagem */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <CheckCircle2 size={32} className="text-slate-300 mb-2" />
              <p className="text-xs font-normal text-slate-500">Você está em dia!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nenhuma notificação nova no momento.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUrgent = Boolean(item.is_urgent);
              const isSos = item.type === 'sos';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isUrgent
                      ? 'bg-red-50/70 border-red-200'
                      : isSos
                      ? 'bg-amber-50/60 border-amber-200/80'
                      : 'bg-slate-50/70 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 mt-0.5">
                      {isSos ? (
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isUrgent ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <AlertTriangle size={14} />
                        </div>
                      ) : item.type === 'medalha' ? (
                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                          <Award size={14} />
                        </div>
                      ) : item.type === 'chamado' ? (
                        <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <LifeBuoy size={14} />
                        </div>
                      ) : item.type === 'mutirao' ? (
                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Calendar size={14} />
                        </div>
                      ) : item.type === 'noticia' ? (
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Newspaper size={14} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Info size={14} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isUrgent ? 'text-red-900' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(item.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                          {onDismiss && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(item.id);
                              }}
                              title="Limpar notificação"
                              aria-label="Limpar notificação"
                              className="text-slate-400 hover:text-red-600 p-0.5 rounded-md hover:bg-slate-200/60 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 font-normal leading-relaxed">
                        {item.message}
                      </p>

                      {item.link && (
                        <div className="mt-2">
                          <Link
                            href={item.link}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 underline"
                          >
                            Ver detalhes <ExternalLink size={11} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
