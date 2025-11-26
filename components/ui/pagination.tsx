'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from './button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  currentPage: number
  totalPages: number
  total: number
}

export function Pagination({ currentPage, totalPages, total }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  // Calcular rango de páginas a mostrar
  const maxPagesToShow = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }

  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="text-sm text-gray-500">
        Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
        <span className="font-medium">{totalPages}</span> ({total} registros en total)
      </div>

      <div className="flex items-center gap-2">
        {/* Botón Anterior */}
        <Link
          href={createPageURL(currentPage - 1)}
          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
        >
          <Button variant="outline" size="sm" disabled={currentPage <= 1}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
        </Link>

        {/* Primera página si no está visible */}
        {startPage > 1 && (
          <>
            <Link href={createPageURL(1)}>
              <Button variant="outline" size="sm">
                1
              </Button>
            </Link>
            {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}

        {/* Páginas */}
        {pages.map((page) => (
          <Link key={page} href={createPageURL(page)}>
            <Button
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
            >
              {page}
            </Button>
          </Link>
        ))}

        {/* Última página si no está visible */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
            <Link href={createPageURL(totalPages)}>
              <Button variant="outline" size="sm">
                {totalPages}
              </Button>
            </Link>
          </>
        )}

        {/* Botón Siguiente */}
        <Link
          href={createPageURL(currentPage + 1)}
          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
        >
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
