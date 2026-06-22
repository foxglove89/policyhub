import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  FileText,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// --- Types ---

interface PDFViewerProps {
  policyTitle: string
  category: string
  version: string
  lastUpdated: string
  pdfUrl?: string | null
}

interface SimulatedPage {
  pageNumber: number
  content: React.ReactNode
}

// --- Real PDF Viewer ---

function RealPDFViewer({ pdfUrl }: { pdfUrl: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function getSignedUrl() {
      try {
        // If it's already a full signed URL, use it directly
        if (pdfUrl.startsWith('http')) {
          setSignedUrl(pdfUrl)
          setLoading(false)
          return
        }

        // Otherwise, generate a signed URL from Supabase Storage
        const { data, error } = await supabase
          .storage
          .from('policies')
          .createSignedUrl(pdfUrl, 3600) // 1 hour expiry

        if (error) throw error
        setSignedUrl(data?.signedUrl || null)
      } catch (err: any) {
        console.error('Error loading PDF:', err)
        setError('Failed to load PDF. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    getSignedUrl()
  }, [pdfUrl])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl border border-neutral-200">
        <Loader2 size={32} className="animate-spin text-accent-500 mb-3" />
        <p className="text-sm text-neutral-500">Loading PDF...</p>
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <FileText size={48} className="text-neutral-300 mb-4" />
        <p className="text-neutral-600 mb-2">Could not load PDF</p>
        <p className="text-sm text-neutral-400">{error || 'PDF URL not available'}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between h-12 px-4 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
        <span className="text-xs font-mono text-neutral-500">PDF Document</span>
        <div className="flex items-center gap-2">
          <a
            href={signedUrl}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Download size={14} />
            Download
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
            <div className="flex-1 overflow-auto bg-neutral-100" style={{ WebkitOverflowScrolling: 'touch' }}>
        <iframe
          src={signedUrl}
          title="Policy PDF"
          className="w-full"
          style={{ border: 'none', minHeight: '70vh', height: '800px' }}
        />
      </div>
    </div>
  )
}

// --- Simulated Policy Document (fallback when no PDF) ---

function PolicyHeader({ title, category, version, lastUpdated }: {
  title: string
  category: string
  version: string
  lastUpdated: string
}) {
  return (
    <div className="text-center border-b-2 border-neutral-800 pb-6 mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <img src="/foxglove-icon.svg" alt="" className="w-10 h-10 opacity-80" />
        <div>
          <div className="font-display text-lg font-bold text-neutral-800">Foxglove Management Ltd</div>
          <div className="font-body text-xs text-neutral-500">Children&apos;s Residential Care Home</div>
        </div>
      </div>
      <h1 className="font-display text-2xl font-bold text-neutral-900 mb-3 leading-tight">{title}</h1>
      <div className="flex items-center justify-center gap-6 text-xs font-mono text-neutral-500">
        <span>Category: {category}</span>
        <span>Version: {version}</span>
        <span>Updated: {new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  )
}

function buildSimulatedPages(
  title: string,
  category: string,
  version: string,
  lastUpdated: string
): SimulatedPage[] {
  const pages: SimulatedPage[] = [
    {
      pageNumber: 1,
      content: (
        <div>
          <PolicyHeader title={title} category={category} version={version} lastUpdated={lastUpdated} />

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              1. Introduction and Purpose
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              This policy sets out the principles, procedures, and responsibilities for {title.toLowerCase()} at Foxglove Management Ltd. It is designed to ensure that all staff members understand their role in protecting children and young people in our care.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              The purpose of this document is to provide clear guidance in accordance with the Children Act 1989, Working Together to Safeguard Children 2023, and Ofsted regulations.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              All staff, volunteers, and contractors must read, understand, and comply with this policy. A signed acknowledgement is required before commencing duties.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              2. Legal Framework
            </h2>
            <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1.5">
              <li>Children Act 1989 and 2004</li>
              <li>Working Together to Safeguard Children (2023)</li>
              <li>Care Standards Act 2000</li>
              <li>Ofsted inspection framework for social care providers</li>
              <li>Health and Social Care Act 2008 (Regulated Activities) Regulations 2014</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      pageNumber: 2,
      content: (
        <div>
          <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
            3. Definitions
          </h2>
          <div className="space-y-3 text-sm text-neutral-700 mb-6">
            <div className="bg-neutral-50 p-3 rounded-lg">
              <span className="font-semibold text-neutral-800">Child/Young Person:</span> Any person under the age of 18 years who is looked after by Foxglove Management Ltd.
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg">
              <span className="font-semibold text-neutral-800">Staff Member:</span> Any employee, agency worker, volunteer, or contractor working at the home.
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg">
              <span className="font-semibold text-neutral-800">Designated Safeguarding Lead (DSL):</span> The senior staff member responsible for safeguarding matters.
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg">
              <span className="font-semibold text-neutral-800">Significant Harm:</span> Ill-treatment or impairment of health and development.
            </div>
          </div>

          <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
            4. Staff Responsibilities
          </h2>
          <p className="text-sm text-neutral-700 leading-relaxed mb-4">
            All staff members have a responsibility to safeguard and promote the welfare of children. This includes:
          </p>
          <ol className="list-decimal list-inside text-sm text-neutral-700 space-y-1.5">
            <li>Being alert to signs of abuse and neglect</li>
            <li>Recording and reporting concerns promptly</li>
            <li>Attending mandatory safeguarding training</li>
            <li>Following the home's procedures for recording incidents</li>
            <li>Supporting children to understand their rights</li>
          </ol>
        </div>
      ),
    },
    {
      pageNumber: 3,
      content: (
        <div>
          <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
            5. Recognising Concerns
          </h2>
          <p className="text-sm text-neutral-700 leading-relaxed mb-4">
            Staff must be aware of the following categories of abuse:
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {['Physical Abuse', 'Emotional Abuse', 'Sexual Abuse', 'Neglect'].map((type) => (
              <div key={type} className="border border-neutral-200 rounded-lg p-3">
                <h3 className="font-semibold text-sm text-neutral-800 mb-1">{type}</h3>
                <p className="text-xs text-neutral-500">Signs and indicators as outlined in Working Together 2023.</p>
              </div>
            ))}
          </div>

          <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
            6. Responding to Disclosures
          </h2>
          <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-neutral-700 leading-relaxed">
              If a child discloses abuse to you: stay calm, listen carefully, do not promise confidentiality, record accurately using the child's words, and report immediately to the DSL.
            </p>
          </div>
        </div>
      ),
    },
  ]

  return pages
}

function SimulatedPDFViewer({ policyTitle, category, version, lastUpdated }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(100)
  const pages = buildSimulatedPages(policyTitle, category, version, lastUpdated)

  const nextPage = useCallback(() => setCurrentPage((p) => Math.min(p + 1, pages.length - 1)), [pages.length])
  const prevPage = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 0)), [])
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 25, 200)), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 25, 50)), [])

  return (
    <div
      className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between h-12 px-4 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} className="text-neutral-600" />
          </button>
          <span className="text-xs font-mono text-neutral-500 min-w-[80px] text-center">
            Page {currentPage + 1} of {pages.length}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={zoom <= 50}
            className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 transition-colors"
          >
            <ZoomOut size={16} className="text-neutral-600" />
          </button>
          <span className="text-xs font-mono text-neutral-500 min-w-[48px] text-center">{zoom}%</span>
          <button
            onClick={zoomIn}
            disabled={zoom >= 200}
            className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 transition-colors"
          >
            <ZoomIn size={16} className="text-neutral-600" />
          </button>
          <div className="w-px h-5 bg-neutral-300 mx-1" />
          <button className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors">
            <Download size={16} className="text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto bg-neutral-100 p-4 sm:p-6">
        <div
          className="mx-auto bg-white shadow-sm p-8 sm:p-12 min-h-[600px]"
          style={{
            width: `${zoom}%`,
            maxWidth: '800px',
            transformOrigin: 'top center',
          }}
        >
          {pages[currentPage]?.content}
        </div>
      </div>
    </div>
  )
}

// --- Main PDFViewer Component ---

export default function PDFViewer({ policyTitle, category, version, lastUpdated, pdfUrl }: PDFViewerProps) {
  // If a real PDF URL is provided, show the real PDF
  if (pdfUrl) {
    return <RealPDFViewer pdfUrl={pdfUrl} />
  }

  // Otherwise, show the simulated document viewer
  return (
    <SimulatedPDFViewer
      policyTitle={policyTitle}
      category={category}
      version={version}
      lastUpdated={lastUpdated}
      pdfUrl={pdfUrl}
    />
  )
}
