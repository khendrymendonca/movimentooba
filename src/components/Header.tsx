import Image from 'next/image';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-red-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative w-10 h-10 overflow-hidden rounded-xl flex items-center justify-center bg-red-50/50">
           <Image 
             src="/logo.png" 
             alt="Logo O Bom Amigo" 
             width={40} 
             height={40} 
             className="object-contain"
           />
        </div>
        <h1 className="text-lg font-semibold text-slate-800">O Bom Amigo</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-600 font-medium">Administrador</div>
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
          AD
        </div>
      </div>
    </header>
  );
}
