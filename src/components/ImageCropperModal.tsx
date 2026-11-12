"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // padrão 3 / 4 = 0.75
}

export function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 3 / 4,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Carregar dimensões naturais da imagem
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

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

  // Drag com Toque (Touch mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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

  // Rotação
  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Gerar o recorte final usando Canvas
  const handleCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const targetWidth = 600;
    const targetHeight = Math.round(targetWidth / aspectRatio); // 800px para 3:4

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo branco no canvas para evitar transparências
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Precisamos relacionar o tamanho da caixa de corte na tela com a imagem original
    const cropBox = containerRef.current?.getBoundingClientRect();
    if (!cropBox) return;

    // Dimensões do elemento de imagem renderizado
    const imgBox = img.getBoundingClientRect();

    // Centro da caixa de corte
    const cropCenterX = cropBox.left + cropBox.width / 2;
    const cropCenterY = cropBox.top + cropBox.height / 2;

    // Deslocamento do centro da imagem em relação ao centro da caixa de corte
    const diffX = cropCenterX - (imgBox.left + imgBox.width / 2);
    const diffY = cropCenterY - (imgBox.top + imgBox.height / 2);

    // Escala entre a caixa de corte da tela e o canvas de saída
    const outputScale = targetWidth / cropBox.width;

    ctx.save();
    // Mover ponto de origem para o centro do canvas de saída
    ctx.translate(targetWidth / 2, targetHeight / 2);

    // Aplicar rotação
    ctx.rotate((rotation * Math.PI) / 180);

    // Aplicar escala e translação do recorte
    const scaleFactor = (imgBox.width / (rotation % 180 === 0 ? naturalSize.width : naturalSize.height)) * outputScale;

    // Desenhar imagem
    const drawWidth = naturalSize.width * scaleFactor;
    const drawHeight = naturalSize.height * scaleFactor;

    // Considerando rotação na posição de deslocamento
    let drawOffsetX = -diffX * outputScale;
    let drawOffsetY = -diffY * outputScale;

    if (rotation === 90) {
      const temp = drawOffsetX;
      drawOffsetX = -drawOffsetY;
      drawOffsetY = temp;
    } else if (rotation === 180) {
      drawOffsetX = -drawOffsetX;
      drawOffsetY = -drawOffsetY;
    } else if (rotation === 270) {
      const temp = drawOffsetX;
      drawOffsetX = drawOffsetY;
      drawOffsetY = -temp;
    }

    ctx.drawImage(
      img,
      drawOffsetX - drawWidth / 2,
      drawOffsetY - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-between p-4 select-none animate-in fade-in duration-200">
      {/* Topo / Cabeçalho */}
      <div className="w-full max-w-md flex items-center justify-between text-white py-2 z-10">
        <div>
          <h3 className="text-base font-bold">Enquadrar Foto 3x4</h3>
          <p className="text-xs text-white/70">Arraste e ajuste o zoom para a carteirinha</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Cancelar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Área Central de Visualização e Recorte */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-2">
        {/* Caixa de Recorte 3:4 com Máscara e Borda Guia */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-64 h-[340px] sm:w-72 sm:h-[384px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] z-10 touch-none flex items-center justify-center"
        >
          {/* Linhas de grade 3x4 sutis */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20 opacity-30">
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

          {/* Guia de rosto sutil */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-36 rounded-full border border-dashed border-white/40 pointer-events-none z-20 flex items-center justify-center">
            <span className="text-[10px] text-white/60 tracking-wider font-medium">ROSTO</span>
          </div>

          {/* Imagem Sendo Manipulada */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Para recortar"
            onLoad={handleImageLoad}
            draggable={false}
            style={{
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

      {/* Controles de Zoom e Rotação */}
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-4 z-10 backdrop-blur-md">
        {/* Controle deslizante de Zoom */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(2)))}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ZoomOut size={18} />
          </button>

          <input
            type="range"
            min="0.8"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-red-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ZoomIn size={18} />
          </button>

          <button
            type="button"
            onClick={rotateClockwise}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1 text-xs"
            title="Girar 90 graus"
          >
            <RotateCw size={16} />
            <span className="hidden sm:inline">Girar</span>
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/20 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleCrop}
            disabled={!imageLoaded}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check size={16} /> Confirmar Foto
          </button>
        </div>
      </div>
    </div>
  );
}
