import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [shakeEmail, setShakeEmail] = useState(false)
  const [shakePassword, setShakePassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from ?? '/dashboard'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  // Entrance animations
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      let hasError = false
      if (!email.trim()) {
        setShakeEmail(true)
        setTimeout(() => setShakeEmail(false), 400)
        hasError = true
      }
      if (!password.trim()) {
        setShakePassword(true)
        setTimeout(() => setShakePassword(false), 400)
        hasError = true
      }
      if (hasError) return

      setIsLoading(true)
      const { error: signInError } = await signIn(email, password)
      setIsLoading(false)

      if (signInError) {
        setError('Invalid email or password. Please try again.')
        setShakeEmail(true)
        setShakePassword(true)
        setTimeout(() => {
          setShakeEmail(false)
          setShakePassword(false)
        }, 400)
      }
    },
    [email, password, signIn]
  )

  const shakeClass = (active: boolean) =>
    active ? 'animate-[shake_400ms_ease-in-out]' : ''

  // Stagger animation helpers
  const fadeIn = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(10px)',
    transition: `opacity 400ms ease ${delay}ms, transform 400ms ease ${delay}ms`,
  })

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-[45%] bg-accent-900 relative flex-col items-center justify-center px-12">
        <div className="max-w-[320px] w-full">
          {/* Foxglove icon */}
          <img
            src="/foxglove-icon.svg"
            alt="Foxglove"
            className="w-16 h-16 mb-8 brightness-0 invert opacity-90"
            style={{
              opacity: visible ? 0.9 : 0,
              transition: 'opacity 400ms ease 0ms',
            }}
          />

          {/* Title */}
          <div
            className="mb-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 400ms ease 100ms, transform 400ms ease 100ms',
            }}
          >
            <h1 className="font-display text-[32px] font-bold text-white leading-tight">
              Foxglove
            </h1>
            <h2 className="font-display text-[32px] font-light text-accent-200 leading-tight">
              Policy Hub
            </h2>
          </div>

          {/* Tagline */}
          <p
            className="font-body text-base font-normal text-accent-200 leading-relaxed mb-12 max-w-[320px]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 400ms ease 200ms, transform 400ms ease 200ms',
            }}
          >
            Ensuring every policy is read, understood, and signed.
          </p>

          {/* Illustration */}
          <div
            className="flex justify-center mb-12"
            style={{
              opacity: visible ? 0.7 : 0,
              transition: 'opacity 600ms ease 300ms',
            }}
          >
            <img
              src="/login-illustration.svg"
              alt=""
              className="max-w-[280px] w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-10 left-0 right-0 px-12">
          <p className="text-xs font-body text-accent-300 text-center">
            &copy; 2025 Foxglove Management Ltd
          </p>
          <p className="text-[11px] font-body text-accent-400 text-center mt-1">
            Ofsted Registered Children&apos;s Home
          </p>
        </div>
      </div>

      {/* Mobile brand banner */}
      <div className="lg:hidden bg-accent-50 px-6 py-8 flex flex-col items-center text-center">
        <img src="/foxglove-icon.svg" alt="Foxglove" className="w-12 h-12 mb-4" />
        <div className="font-display text-2xl font-bold text-accent-600">
          Foxglove<span className="text-accent-400">.</span>
        </div>
        <div className="text-xs font-body text-neutral-400">Policy Hub</div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12 lg:py-0 lg:px-16">
        <div className="w-full max-w-[420px]">
          {/* Welcome text */}
          <div style={fadeIn(100)}>
            <p className="text-sm font-body font-normal text-neutral-400 mb-1">
              Welcome to
            </p>
            <h2 className="font-display text-[28px] font-bold text-neutral-800 mb-2 leading-tight">
              Foxglove Policy Hub
            </h2>
            <p className="text-sm font-body font-normal text-neutral-400 mb-8">
              Sign in with your staff account to access policies and compliance tools.
            </p>
          </div>

          {/* Error toast */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg bg-error-50 border border-error-500/20 text-sm font-body text-error-600"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(15px)',
                transition: 'opacity 300ms ease 200ms, transform 300ms ease 200ms',
              }}
            >
              <label className="block text-sm font-medium font-body text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className={[
                    'absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none',
                    shakeEmail && 'animate-[shake_400ms_ease-in-out]',
                  ].join(' ')}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@foxglove.org"
                  className={[
                    'w-full h-12 pl-11 pr-4 bg-neutral-50 border border-neutral-200 rounded-[10px]',
                    'font-body text-base text-neutral-700 placeholder:text-neutral-400',
                    'focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100',
                    'transition-all duration-150',
                    error ? 'border-error-500 focus:border-error-500 focus:ring-error-50' : '',
                    shakeClass(shakeEmail),
                  ].join(' ')}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(15px)',
                transition: 'opacity 300ms ease 260ms, transform 300ms ease 260ms',
              }}
            >
              <label className="block text-sm font-medium font-body text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={[
                    'w-full h-12 pl-11 pr-11 bg-neutral-50 border border-neutral-200 rounded-[10px]',
                    'font-body text-base text-neutral-700 placeholder:text-neutral-400',
                    'focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100',
                    'transition-all duration-150',
                    error ? 'border-error-500 focus:border-error-500 focus:ring-error-50' : '',
                    shakeClass(shakePassword),
                  ].join(' ')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div
              className="flex items-center gap-2.5"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(15px)',
                transition: 'opacity 300ms ease 320ms, transform 300ms ease 320ms',
              }}
            >
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-neutral-300 text-accent-500 focus:ring-accent-500 focus:ring-offset-0 accent-accent-600 cursor-pointer"
              />
              <label htmlFor="remember" className="text-[13px] font-body text-neutral-600 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={isLoading}
              className={[
                'w-full h-12 rounded-[10px] font-body text-[15px] font-semibold text-white',
                'bg-accent-600 hover:bg-accent-700 active:bg-accent-800',
                'hover:scale-[0.99] active:scale-[0.98]',
                'transition-all duration-150 cursor-pointer',
                'disabled:opacity-70 disabled:cursor-not-allowed',
              ].join(' ')}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 300ms ease 500ms, transform 300ms ease 500ms, background 150ms, scale 100ms',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot password */}
            <div className="text-center">
              <a
                href="#"
                className="text-[13px] font-medium font-body text-accent-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  alert('Please contact your administrator to reset your password.')
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs font-body text-neutral-400">or</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* Microsoft SSO (placeholder) */}
            <button
              type="button"
              disabled
              className="w-full h-12 rounded-[10px] font-body text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-colors duration-150 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Sign in with Microsoft
            </button>

            {/* Help link */}
            <p className="text-center text-xs font-body text-neutral-400 mt-6">
              Need help?{' '}
              <a
                href="#"
                className="text-accent-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  alert('Please contact your system administrator for assistance.')
                }}
              >
                Contact your administrator
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Add shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50% { transform: translateX(-5px); }
          20%, 40% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
