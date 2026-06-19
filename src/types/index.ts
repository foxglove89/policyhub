export interface Staff {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  department: string
  active: boolean
  joined_date: string
  created_at: string
}

export interface Policy {
  id: string
  title: string
  category: string
  version: string
  description: string
  pdf_url: string
  upload_date: string
  last_updated: string
  requires_acknowledgement: boolean
  active: boolean
  created_at: string
}

export interface Acknowledgement {
  id: string
  staff_id: string
  policy_id: string
  signed_date: string
  staff?: Staff
  policy?: Policy
}

export interface PolicyCategory {
  id: string
  name: string
}

export type StatusVariant = 'signed' | 'pending' | 'overdue' | 'inactive'

export const POLICY_CATEGORIES = [
  'COVID-19',
  'Care Planning',
  'Views, Wishes and Feelings',
  'Child Protection',
  'Health and Well-being',
  'Quality of Care',
  'Enjoyment and Achievement',
  'Positive Relationships',
  'Leadership and Management',
  'GDPR',
]

export const INITIAL_STAFF = [
  { name: 'Uzair Saeed', email: 'uzair.s@foxglove.care', role: 'admin' as const, department: 'GRC' },
  { name: 'Andy Brierley', email: 'andyrbrierley@gmail.com', role: 'admin' as const, department: 'Management' },
  { name: 'Jason Wilson', email: 'jasonwilsona@gmail.com', role: 'admin' as const, department: 'Management' },
  { name: 'Isabel McTaggart', email: 'isabelmct@hotmail.co.uk', role: 'admin' as const, department: 'Senior Care' },
  { name: 'Prince Nosa Osaru', email: 'nosapeter19@yahoo.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Nicholas Aladejana', email: 'Equitablenicholas@gmail.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Ranjeet Singh', email: 'ranjeetsinghrmp55@gmail.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Charlotte Wheaver', email: 'Charlottemichwheaver@gmail.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Rachael Scott', email: 'rachaelscott21@aol.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Tara Willis', email: 'tara.willis69@hotmail.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Yvonne Magura', email: 'yvonnemagura314@gmail.com', role: 'staff' as const, department: 'Care Team' },
  { name: "Dominic O'Pere", email: 'peredominic@gmail.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Benjamin Oghenegueke', email: 'benoghene911@gmail.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Christina Charalambous', email: 'christina.99@outlook.com', role: 'staff' as const, department: 'Care Team' },
  { name: 'Najjuma Katende', email: 'najjuma.k@foxglove.care', role: 'staff' as const, department: 'Care Team' },
  { name: 'Shauna Wintour', email: 'shauna.w@foxglove.care', role: 'staff' as const, department: 'Care Team' },
]
