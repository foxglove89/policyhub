import { useState, useEffect } from 'react'
import { Download, Loader2, FileText, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PDFViewerProps {
  policyTitle: string
  category: string
  version: string
  lastUpdated: string
  pdfUrl?: string | null
}

export default function PDFViewer({ policyTitle, pdfUrl }: PDFViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function getSignedUrl() {
      try {
        if (!pdfUrl) {
          setError('No PDF uploaded for this policy')
          setLoading(false)
          return
        }
        if (pdfUrl.startsWith('http')) {
          setSignedUrl(pdfUrl)
          setLoading(false)
          return
        }
        const { data, error } = await supabase.storage.from('policies').createSignedUrl(pdfUrl, 3600)
        if (error) throw error
        setSignedUrl(data?.signedUrl || null)
      } catch (err: any) {
        setError('Failed to load PDF')
      } finally {
        setLoading(false)
      }
    }
    getSignedUrl()
  }, [pdfUrl])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-neutral-200">
        <Loader2 size={32} className="animate-spin text-accent-500 mb-3" />
        <p className="text-sm text-neutral-500">Loading PDF...</p>
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <FileText size={48} className="text-neutral-300 mb-4" />
        <p className="text-neutral-600 mb-2">{error || 'PDF not available'}</p>
        <p className="text-sm text-neutral-400 mb-4">This policy document has not been uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between h-12 px-4 bg-neutral-50 border-b border-neutral-200">
        <span className="text-xs font-mono text-neutral-500">{policyTitle}</span>
        <div className="flex items-center gap-2">
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <ExternalLink size={14} />
            Open
          </a>
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

      {/* PDF Viewer - Using embed tag for better mobile support */}
      <div style={{ width: '100%', height: '75vh', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <embed
          src={signedUrl}
          type="application/pdf"
          width="100%"
          height="100%"
          style={{ display: 'block', minHeight: '100%' }}
        />
      </div>
    </div>
  )
}
