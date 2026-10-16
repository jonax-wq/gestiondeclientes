import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  itemLabel = 'elementos'
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar números de página con elipsis inteligente
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className="pagination-container">
      {/* Información de elementos y selector de cantidad */}
      <div className="pagination-info">
        <span>
          Mostrando <strong className="pagination-highlight">{startItem} - {endItem}</strong> de <strong className="pagination-highlight">{totalItems}</strong> {itemLabel}
        </span>

        {onItemsPerPageChange && (
          <div className="pagination-size-selector">
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Por pág:</span>
            <select
              className="pagination-select"
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              title={`Cantidad de ${itemLabel} por página`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de navegación siempre visibles cuando hay elementos */}
      <div className="pagination-nav">
          {/* Ir a la primera página */}
          <button
            type="button"
            className="pagination-btn icon-btn"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="Primera página"
            aria-label="Primera página"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Anterior */}
          <button
            type="button"
            className="pagination-btn icon-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Página anterior"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Números de página */}
          <div className="pagination-pages">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                    •••
                  </span>
                );
              }

              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  className={`pagination-btn page-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handlePageClick(p)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Siguiente */}
          <button
            type="button"
            className="pagination-btn icon-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Página siguiente"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>

          {/* Ir a la última página */}
          <button
            type="button"
            className="pagination-btn icon-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Última página"
            aria-label="Última página"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
    </div>
  );
}
