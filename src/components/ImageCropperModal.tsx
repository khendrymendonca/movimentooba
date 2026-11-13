"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Maximize2,
  Square,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export type CropFormat = 'original' | '1:1' | '3:4';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  defaultFormat?: CropFormat;
}

export function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onCancel,
  defaultFormat = 'original',
}: ImageCropperModalProps) {
  const [format, setFormat] = useState<CropFormat>(defaultFormat);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calcula a proporção numérica atual
  const currentAspectRatio =
    format === '1:1'
      ? 1
      : format === '3:4'
      ? 3 / 4
      : naturalSize.width && naturalSize.height
      ? naturalSize.width / naturalSize.height
      : 1;

  // Quando a imagem carrega, calcula dimensões naturais e ajusta visualização
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Ao trocar de formato, recentraliza a imagem
  const handleFormatChange = (newFormat: CropFormat) => {
    setFormat(newFormat);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Dimensões da caixa de corte no preview (máximo 280px largura por 340px altura na tela mobile)
  const maxBoxWidth = 280;
  const maxBoxHeight = 340;

  let boxWidth = maxBoxWidth;
  let boxHeight = maxBoxWidth / currentAspectRatio;

  if (boxHeight > maxBoxHeight) {
    boxHeight = maxBoxHeight;
    boxWidth = maxBoxHeight * currentAspectRatio;
  }
  if (boxWidth > maxBoxWidth) {
    boxWidth = maxBoxWidth;
    boxHeight = maxBoxWidth / currentAspectRatio;
  }

  // Dimensões base da imagem para caber na caixa de corte (contain)
  const isRotated = rotation % 180 !== 0;
  const effWidth = isRotated ? naturalSize.height : naturalSize.width;
  const effHeight = isRotated ? naturalSize.width : naturalSize.height;

  const baseScale = effWidth && effHeight
    ? Math.min(boxWidth / effWidth, boxHeight / effHeight)
    : 1;

  const displayBaseWidth = naturalSize.width * baseScale;
  const displayBaseHeight = naturalSize.height * baseScale;

  // Drag com Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Gestos Touch (Arraste com 1 dedo e Pinch-to-zoom com 2 dedos)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
      setInitialPinchDistance(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      setInitialPinchDistance(dist);
      setInitialPinchZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / initialPinchDistance;
      const nextZoom = Math.min(3.5, Math.max(0.5, +(initialPinchZoom * ratio).toFixed(2)));
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialPinchDistance(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Girar 90 graus
  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Botão direto: Usar Foto Completa (Exporta a imagem inteira sem nenhum corte)
  const handleUseFullImage = () => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const maxSide = 900;

    let targetW = naturalSize.width;
    let targetH = naturalSize.height;

    if (targetW > maxSide || targetH > maxSide) {
      if (targetW >= targetH) {
        targetH = Math.round((targetH * maxSide) / targetW);
        targetW = maxSide;
      } else {
        targetW = Math.round((targetW * maxSide) / targetH);
        targetH = maxSide;
      }
    }

    // Se houver rotação
    const isRot = rotation % 180 !== 0;
    canvas.width = isRot ? targetH : targetW;
    canvas.height = isRot ? targetW : targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob);
      },
      'image/jpeg',
      0.92
    );
  };

  // Gerar o recorte final usando Canvas
  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');

    // Resolução de saída nítida e otimizada (largura padrão 600px)
    const targetWidth = 600;
    const targetHeight = Math.round(targetWidth / currentAspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Escala entre a caixa de visualização na tela e o canvas de saída
    const exportScale = targetWidth / boxWidth;

    ctx.save();
    // Move origem para o centro da caixa + deslocamento do usuário
    ctx.translate(
      targetWidth / 2 + offset.x * exportScale,
      targetHeight / 2 + offset.y * exportScale
    );

    // Aplica rotação e zoom
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Desenha a imagem centralizada no canvas
    const drawW = displayBaseWidth * exportScale;
    const drawH = displayBaseHeight * exportScale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200">
      {/* Topo / Cabeçalho */}
      <div className="w-full max-w-md flex items-center justify-between text-white py-1.5 z-10">
        <div>
          <h3 className="text-base font-bold tracking-tight">Ajustar Foto de Perfil</h3>
          <p className="text-xs text-white/70">Arraste e ajuste o tamanho como preferir</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Cancelar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Seletor de Formato / Proporção (Livre / 1:1 / 3:4) */}
      <div className="w-full max-w-md flex items-center justify-center gap-1.5 z-10 bg-white/10 p-1 rounded-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => handleFormatChange('original')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            format === 'original'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Maximize2 size={13} />
          <span>Original (Livre)</span>
        </button>

        <button
          type="button"
          onClick={() => handleFormatChange('1:1')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            format === '1:1'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Square size={13} />
          <span>Quadrado (1:1)</span>
        </button>

        <button
          type="button"
          onClick={() => handleFormatChange('3:4')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            format === '3:4'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone size={13} />
          <span>3x4 Carteirinha</span>
        </button>
      </div>

      {/* Área Central de Visualização e Recorte */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-2">
        {/* Caixa de Recorte Dinâmica com Máscara e Borda Limpa */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: `${Math.round(boxWidth)}px`,
            height: `${Math.round(boxHeight)}px`,
          }}
          className="relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 touch-none flex items-center justify-center transition-all duration-200"
        >
          {/* Grade 3x3 sutil de auxílio */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20 opacity-20">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div />
          </div>

          {/* Imagem Sendo Manipulada (Sempre proporcional, sem zoom estourado) */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Foto para ajuste"
            onLoad={handleImageLoad}
            draggable={false}
            style={{
              width: `${displayBaseWidth}px`,
              height: `${displayBaseHeight}px`,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            className="pointer-events-none select-none max-w-none will-change-transform"
          />
        </div>
      </div>

      {/* Controles de Zoom, Rotação e Ações */}
      <div className="w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl p-3.5 space-y-3 z-10 backdrop-blur-md">
        {/* Controle deslizante de Zoom Amplo (0.5x até 3.5x) e Girar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Reduzir zoom"
          >
            <ZoomOut size={16} />
          </button>

          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-red-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.15).toFixed(2)))}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            onClick={rotateClockwise}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1 text-xs"
            title="Girar 90 graus"
          >
            <RotateCw size={15} />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          {/* Opção rápida: Usar Foto Completa sem nenhum corte */}
          <button
            type="button"
            onClick={handleUseFullImage}
            disabled={!imageLoaded}
            className="flex-1 py-2.5 px-3 rounded-xl border border-white/25 hover:bg-white/10 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Salva a foto inteira sem cortar"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Usar Foto Inteira</span>
          </button>

          {/* Confirmar Recorte */}
          <button
            type="button"
            onClick={handleCrop}
            disabled={!imageLoaded}
            className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check size={16} />
            <span>Confirmar Ajuste</span>
          </button>
        </div>
      </div>
    </div>
  );
}
