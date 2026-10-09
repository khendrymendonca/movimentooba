"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Image from 'next/image';

import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [initials, setInitials] = useState('..');
  const [name, setName] = useState('Carregando...');
  const [avatar, setAvatar] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', session.user.id)
          .single();
          
        if (data && data.name) {
          setName(data.name);
          setAvatar(data.avatar_url);
          const parts = data.name.split(' ');
          if (parts.length > 1) {
            setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
          } else {
            setInitials(data.name.substring(0, 2).toUpperCase());
          }
        }
      }
    }
    loadUser();
  }, [supabase]);

  return (
    <header className="h-20 bg-white border-b border-red-50 flex items-center justify-between px-4 sm:px-8 shadow-sm w-full shrink-0">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 mr-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg lg:hidden transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-500 font-medium hidden sm:block">{name}</div>
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm shadow-inner shadow-red-200 overflow-hidden border border-red-200">
          {avatar ? (
            <Image src={avatar} alt="Perfil" width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}
