import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
} from 'lucide-react'

// --- Types ---

interface PDFViewerProps {
  policyTitle: string
  category: string
  version: string
  lastUpdated: string
}

interface SimulatedPage {
  pageNumber: number
  content: React.ReactNode
}

// --- Simulated Policy Document Content ---

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
              This policy sets out the principles, procedures, and responsibilities for safeguarding children and young people placed in the care of Foxglove Management Ltd. It is designed to ensure that all staff members understand their role in protecting children from harm and promoting their welfare.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              The purpose of this document is to provide clear guidance on recognising signs of abuse, responding to disclosures, and following the correct reporting procedures in accordance with the Children Act 1989, Working Together to Safeguard Children 2023, and Ofsted regulations.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              All staff, volunteers, and contractors working with Foxglove Management Ltd must read, understand, and comply with this policy. A signed acknowledgement of understanding is required from all personnel before commencing duties.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              2. Scope and Applicability
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              This policy applies to all staff members, agency workers, volunteers, students on placement, contractors, and any other individuals who have contact with children and young people in our care. It covers all settings and activities, including residential care, educational support, recreational activities, transport, and any off-site visits.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed mb-3">The policy encompasses the following key areas:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 text-sm text-neutral-700 leading-relaxed mb-4">
              <li>Recognition and categories of abuse (physical, emotional, sexual, and neglect)</li>
              <li>Procedures for responding to concerns, allegations, and disclosures</li>
              <li>Reporting mechanisms and lines of accountability</li>
              <li>Information sharing protocols with external agencies</li>
              <li>Risk assessment and management procedures</li>
              <li>Safe recruitment and vetting practices</li>
            </ul>
          </div>

          <div className="bg-neutral-50 border-l-4 border-accent-500 p-4 rounded-r-md mb-4">
            <p className="text-sm font-medium text-neutral-700 mb-1">Legal Framework</p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              This policy is informed by the Children Act 1989, the Children Act 2004, the Care Planning, Placement and Case Review (England) Regulations 2010, and statutory guidance issued by the Department for Education.
            </p>
          </div>
        </div>
      ),
    },
    {
      pageNumber: 2,
      content: (
        <div>
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              3. Definitions
            </h2>
            <div className="space-y-3 text-sm text-neutral-700 leading-relaxed">
              <p>
                <span className="font-semibold text-neutral-800">Safeguarding:</span> The action taken to promote the welfare of children and protect them from harm. Safeguarding is everyone&apos;s responsibility.
              </p>
              <p>
                <span className="font-semibold text-neutral-800">Child Protection:</span> Part of the safeguarding process that focuses on protecting individual children identified as suffering or likely to suffer significant harm.
              </p>
              <p>
                <span className="font-semibold text-neutral-800">Significant Harm:</span> A threshold used to determine whether child protection procedures should be initiated, as defined in Section 31 of the Children Act 1989.
              </p>
              <p>
                <span className="font-semibold text-neutral-800">Designated Safeguarding Lead (DSL):</span> The senior staff member responsible for safeguarding and child protection matters within the organisation.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              4. Staff Responsibilities
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              All members of staff have a fundamental duty of care towards the children and young people they work with. The following responsibilities apply to all personnel:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2 text-sm text-neutral-700 leading-relaxed mb-4">
              <li>
                <span className="font-medium text-neutral-800">Maintain awareness</span> of the signs and indicators that may suggest a child is at risk of harm or is being abused.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Report any concerns</span> immediately to the Designated Safeguarding Lead or, in their absence, to the most senior staff member on duty.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Record all observations</span> and concerns accurately and contemporaneously using the organisation&apos;s recording systems.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Contribute to risk assessments</span> and care planning processes as required.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Attend all mandatory safeguarding training</span> and refresher courses as specified in the training schedule.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Adhere to professional boundaries</span> and the organisation&apos;s code of conduct at all times.
              </li>
            </ol>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              4.1 Designated Safeguarding Lead (DSL) Responsibilities
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-3">
              The DSL holds specific responsibility for overseeing safeguarding arrangements within the organisation. The DSL must:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 text-sm text-neutral-700 leading-relaxed">
              <li>Receive and assess all safeguarding referrals and concerns</li>
              <li>Liaise with Children&apos;s Social Care, police, and other agencies as necessary</li>
              <li>Ensure that appropriate records are maintained securely</li>
              <li>Provide advice and support to staff on safeguarding matters</li>
              <li>Report to the Registered Manager on all safeguarding incidents</li>
            </ul>
          </div>

          <div className="bg-warning-50 border border-warning-500/20 rounded-lg p-4 mt-6">
            <p className="text-sm font-medium text-warning-600 mb-1">Important</p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Failure to report safeguarding concerns may result in disciplinary action and could constitute a breach of professional conduct. Staff who fail to comply with this policy may face dismissal.
            </p>
          </div>
        </div>
      ),
    },
    {
      pageNumber: 3,
      content: (
        <div>
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              5. Recognising Abuse and Neglect
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              Staff should be alert to the following indicators of possible abuse or neglect. It is important to note that the presence of one or more indicators does not necessarily mean that a child is being abused, but they should always prompt further enquiry and recording.
            </p>

            <h3 className="font-display text-sm font-bold text-neutral-800 mb-2 mt-4">5.1 Physical Abuse</h3>
            <p className="text-sm text-neutral-700 leading-relaxed mb-3">
              Physical abuse may involve hitting, shaking, throwing, poisoning, burning or scalding, drowning, suffocating, or otherwise causing physical harm to a child. Physical harm may also be caused when a parent or carer fabricates the symptoms of, or deliberately induces, illness in a child.
            </p>
            <p className="text-sm font-medium text-neutral-700 mb-1">Indicators include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-neutral-600 leading-relaxed mb-4">
              <li>Bruises, burns, or fractures that are unexplained or inconsistent with explanations given</li>
              <li>Injuries in unusual locations or patterns</li>
              <li>Fear of physical contact or flinching when approached</li>
              <li>Wearing inappropriate clothing to cover injuries</li>
            </ul>

            <h3 className="font-display text-sm font-bold text-neutral-800 mb-2 mt-4">5.2 Emotional Abuse</h3>
            <p className="text-sm text-neutral-700 leading-relaxed mb-3">
              Emotional abuse is the persistent emotional maltreatment of a child such as to cause severe and persistent adverse effects on the child&apos;s emotional development. It may involve conveying to children that they are worthless or unloved, inadequate, or valued only insofar as they meet the needs of another person.
            </p>

            <h3 className="font-display text-sm font-bold text-neutral-800 mb-2 mt-4">5.3 Sexual Abuse</h3>
            <p className="text-sm text-neutral-700 leading-relaxed mb-3">
              Sexual abuse involves forcing or enticing a child or young person to take part in sexual activities, not necessarily involving a high level of violence, whether or not the child is aware of what is happening. The activities may involve physical contact, including assault by penetration or non-penetrative acts.
            </p>

            <h3 className="font-display text-sm font-bold text-neutral-800 mb-2 mt-4">5.4 Neglect</h3>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              Neglect is the persistent failure to meet a child&apos;s basic physical and/or psychological needs, likely to result in the serious impairment of the child&apos;s health or development. Neglect may involve a parent or carer failing to provide adequate food, clothing, or shelter.
            </p>
          </div>
        </div>
      ),
    },
    {
      pageNumber: 4,
      content: (
        <div>
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              6. Responding to Disclosures and Concerns
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              When a child discloses information that suggests they may be at risk of harm, or when a member of staff observes signs that raise concern, the following steps must be taken immediately:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2 text-sm text-neutral-700 leading-relaxed mb-4">
              <li>
                <span className="font-medium text-neutral-800">Stay calm.</span> Do not show shock or disbelief. The child needs to feel they are being listened to and taken seriously.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Listen carefully</span> to what the child says without interrupting or asking leading questions.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Reassure the child</span> that they have done the right thing by telling you. Do not promise confidentiality.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Record exactly</span> what was said using the child&apos;s own words, as soon as possible after the disclosure.
              </li>
              <li>
                <span className="font-medium text-neutral-800">Report immediately</span> to the DSL or, if unavailable, to the most senior manager on duty.
              </li>
            </ol>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              7. Recording and Information Sharing
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              All safeguarding concerns must be recorded on the organisation&apos;s Safeguarding Concern Form within 24 hours of the concern arising. Records must be factual, objective, and include dates, times, and verbatim accounts where possible.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              Information relating to safeguarding concerns will be shared with relevant agencies (Children&apos;s Social Care, police, health services) where there is a concern about significant harm or where it is necessary to protect the welfare of the child. All information sharing will be carried out in accordance with the principles of the Data Protection Act 2018 and GDPR.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              8. Allegations Against Staff
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              Where an allegation is made against a member of staff, the DSL will follow the organisation&apos;s Allegations Management Procedure. All allegations will be taken seriously and handled sensitively. The Local Authority Designated Officer (LADO) will be notified within one working day of any allegation that meets the threshold criteria.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Staff against whom an allegation has been made will be kept informed of the progress of the case and will be offered appropriate support throughout the process. Suspension is not a neutral act and will only be considered where it is necessary to protect children or where the allegation is of a serious nature.
            </p>
          </div>
        </div>
      ),
    },
    {
      pageNumber: 5,
      content: (
        <div>
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              9. Risk Assessment
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              Individual risk assessments will be carried out for each child placed with Foxglove Management Ltd. These assessments will identify any specific risks or vulnerabilities and set out the measures to be put in place to mitigate those risks.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed mb-3">
              Risk assessments will be reviewed:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 text-sm text-neutral-700 leading-relaxed mb-4">
              <li>Following any safeguarding incident or near miss</li>
              <li>At each statutory review of the child&apos;s care plan</li>
              <li>When there is a significant change in the child&apos;s circumstances</li>
              <li>At least every three months as a minimum standard</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              10. Training and Development
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              All staff are required to complete mandatory safeguarding training as part of their induction programme. This training must be completed before staff are permitted to work unsupervised with children.
            </p>

            <div className="overflow-hidden rounded-lg border border-neutral-200 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-600 font-medium">
                    <th className="text-left px-4 py-2.5 border-b border-neutral-200">Training Level</th>
                    <th className="text-left px-4 py-2.5 border-b border-neutral-200">Frequency</th>
                    <th className="text-left px-4 py-2.5 border-b border-neutral-200">Audience</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-700">
                  <tr className="border-b border-neutral-100">
                    <td className="px-4 py-2.5 font-medium">Level 1 — Introduction</td>
                    <td className="px-4 py-2.5">Induction + Annual refresher</td>
                    <td className="px-4 py-2.5">All staff</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="px-4 py-2.5 font-medium">Level 2 — Advanced</td>
                    <td className="px-4 py-2.5">Every 2 years</td>
                    <td className="px-4 py-2.5">Senior care staff, team leaders</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium">Level 3 — DSL</td>
                    <td className="px-4 py-2.5">Every 2 years + annual updates</td>
                    <td className="px-4 py-2.5">Designated Safeguarding Leads</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 mb-3 border-b border-neutral-300 pb-1">
              11. Monitoring and Review
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">
              This policy will be reviewed annually by the Registered Manager and the Designated Safeguarding Lead, or sooner if there are changes in legislation, statutory guidance, or following a significant safeguarding incident.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              All staff will be notified of any amendments to this policy and will be required to re-read the updated document and provide a new signed acknowledgement.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-neutral-800 text-center">
            <p className="text-xs text-neutral-500 font-mono mb-1">
              This policy is the property of Foxglove Management Ltd and is confidential.
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              Foxglove Management Ltd | Registered Children&apos;s Home | Ofsted Registered
            </p>
          </div>
        </div>
      ),
    },
  ]

  return pages
}

// --- Skeleton Loading ---

function PDFSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 p-8 animate-pulse">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-sm shadow-md w-full max-w-[600px]"
          style={{ minHeight: '800px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <div className="p-12">
            <div className="h-6 bg-neutral-200 rounded w-3/4 mx-auto mb-6" />
            <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto mb-8" />
            <div className="border-t-2 border-neutral-200 pt-6 space-y-3">
              <div className="h-3 bg-neutral-200 rounded w-full" />
              <div className="h-3 bg-neutral-200 rounded w-full" />
              <div className="h-3 bg-neutral-200 rounded w-5/6" />
              <div className="h-3 bg-neutral-200 rounded w-full mt-4" />
              <div className="h-3 bg-neutral-200 rounded w-full" />
              <div className="h-3 bg-neutral-200 rounded w-4/5" />
              <div className="h-3 bg-neutral-200 rounded w-full mt-4" />
              <div className="h-3 bg-neutral-200 rounded w-full" />
              <div className="h-3 bg-neutral-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- PDF Viewer Component ---

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200]

export default function PDFViewer({ policyTitle, category, version, lastUpdated }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomIndex, setZoomIndex] = useState(2) // 100%
  const [isLoading, setIsLoading] = useState(true)

  const pages = buildSimulatedPages(policyTitle, category, version, lastUpdated)
  const totalPages = pages.length
  const zoom = ZOOM_LEVELS[zoomIndex] / 100

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const goToPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1))
  }, [totalPages])

  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(0, i - 1))
  }, [])

  const handleDownload = useCallback(() => {
    // Create a text representation of the policy
    const element = document.createElement('a')
    const file = new Blob(
      [`${policyTitle}\n\nFoxglove Management Ltd\nVersion: ${version}\nCategory: ${category}\nLast Updated: ${lastUpdated}\n\n[This is a simulated policy document. In production, this would download the actual PDF file.]\n\n---\n\nThis document contains the full policy text with all sections, procedures, and guidelines as outlined in the Foxglove Management Ltd Policy Hub.`],
      { type: 'text/plain' }
    )
    element.href = URL.createObjectURL(file)
    element.download = `${policyTitle.replace(/\s+/g, '-').toLowerCase()}-v${version}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }, [policyTitle, category, version, lastUpdated])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col h-full">
        {/* Toolbar skeleton */}
        <div className="h-12 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-neutral-200 rounded-lg" />
            <div className="h-4 w-20 bg-neutral-200 rounded" />
            <div className="w-9 h-9 bg-neutral-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-neutral-200 rounded-lg" />
            <div className="h-4 w-12 bg-neutral-200 rounded" />
            <div className="w-9 h-9 bg-neutral-200 rounded-lg" />
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <div className="w-9 h-9 bg-neutral-200 rounded-lg" />
          </div>
        </div>
        <PDFSkeleton />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-12 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between px-3 flex-shrink-0">
        {/* Left: Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className={[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
              currentPage <= 1
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-neutral-600 hover:bg-neutral-200 cursor-pointer',
            ].join(' ')}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="font-mono text-[13px] text-neutral-500 px-2 min-w-[90px] text-center">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className={[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
              currentPage >= totalPages
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-neutral-600 hover:bg-neutral-200 cursor-pointer',
            ].join(' ')}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Right: Zoom + Download */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={zoomIndex <= 0}
            className={[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
              zoomIndex <= 0
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-neutral-600 hover:bg-neutral-200 cursor-pointer',
            ].join(' ')}
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <span className="font-mono text-[13px] text-neutral-500 px-2 min-w-[50px] text-center">
            {ZOOM_LEVELS[zoomIndex]}%
          </span>

          <button
            onClick={zoomIn}
            disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
            className={[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
              zoomIndex >= ZOOM_LEVELS.length - 1
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-neutral-600 hover:bg-neutral-200 cursor-pointer',
            ].join(' ')}
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-px h-6 bg-neutral-200 mx-1" />

          <button
            onClick={handleDownload}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
            aria-label="Download document"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto bg-neutral-100 relative">
        <div
          className="flex flex-col items-center py-6 gap-6 transition-transform duration-200 ease-out origin-top"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {pages.map((page) => (
            <div
              key={page.pageNumber}
              id={`pdf-page-${page.pageNumber}`}
              className={[
                'bg-white rounded-sm relative transition-opacity duration-300',
                page.pageNumber === currentPage ? 'opacity-100' : 'opacity-40',
              ].join(' ')}
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
              onClick={() => setCurrentPage(page.pageNumber)}
            >
              {/* Page number footer */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="font-mono text-[11px] text-neutral-400">
                  — {page.pageNumber} —
                </span>
              </div>

              {/* Page content */}
              <div className="pb-8">{page.content}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile bottom toolbar */}
      <div className="lg:hidden h-12 bg-white border-t border-neutral-200 flex items-center justify-between px-4 flex-shrink-0">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className={[
            'flex items-center gap-1 text-sm font-medium',
            currentPage <= 1 ? 'text-neutral-300' : 'text-neutral-600',
          ].join(' ')}
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <span className="font-mono text-[13px] text-neutral-500">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className={[
            'flex items-center gap-1 text-sm font-medium',
            currentPage >= totalPages ? 'text-neutral-300' : 'text-neutral-600',
          ].join(' ')}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
