'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { AlertCircle, XCircle } from 'lucide-react'

interface DiscountFormProps {
  discount: string
  onBack?: () => void
  compact?: boolean
}

export default function DiscountForm({ discount, onBack, compact = false }: DiscountFormProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    fullName?: string
    mobile?: string
  }>({})
  const [apiErrorMeta, setApiErrorMeta] = useState<any>(null)

  // API Configuration
  const API_CONFIG = {
    endpoint: 'https://services.leadconnectorhq.com/contacts/',
    authToken: process.env.NEXT_PUBLIC_GH_AUTH_TOKEN || '',
    locationId: process.env.NEXT_PUBLIC_GH_LOCATION_ID || ''
  }

  const generateCouponCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${discount}${randomNum}${randomChars}`
  }

  const validateMobile = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-+()]/g, '')
    return cleaned.length >= 10 && /^\d+$/.test(cleaned)
  }

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {}
    let isValid = true

    if (!email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(email)) {
      errors.email = 'Invalid email format'
      isValid = false
    }

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required'
      isValid = false
    } else if (fullName.trim().split(' ').length < 2) {
      errors.fullName = 'Please enter first and last name'
      isValid = false
    }

    if (!mobile.trim()) {
      errors.mobile = 'Mobile number is required'
      isValid = false
    } else if (!validateMobile(mobile)) {
      errors.mobile = 'Invalid mobile number (min 10 digits)'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3)}`
    if (cleaned.length <= 10) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6,10)}`
  }

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '')
    setMobile(formatPhoneNumber(input))
    if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: undefined }))
  }

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: keyof typeof fieldErrors
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setApiErrorMeta(null)
    setFieldErrors({})

    if (!validateForm()) return

    if (!API_CONFIG.authToken || !API_CONFIG.locationId) {
      setGeneralError('Configuration error. Please contact support.')
      return
    }

    setIsSubmitting(true)

    try {
      const newCouponCode = generateCouponCode()
      const phoneForApi = mobile.replace(/\D/g, '')
      const firstName = fullName.trim().split(' ')[0] || fullName

      const requestBody = {
        locationId: API_CONFIG.locationId,
        firstName,
        email: email.trim(),
        phone: phoneForApi,
        customFields: [
          { id: "spintowin_coupon", value: newCouponCode },
          { id: "spintowincoupon_discount", value: `${discount}%` }
        ]
      }

      const response = await fetch(API_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.authToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle duplicate contact error
        if (response.status === 400 && errorData.message?.includes("duplicated contacts")) {
          setApiErrorMeta(errorData.meta || {})

          const matchingField = errorData.meta?.matchingField
          const fieldErrorMessage = `This ${matchingField === 'phone' ? 'mobile number' : 'email'} is already registered.`

          if (matchingField === 'email') {
            setFieldErrors(prev => ({ ...prev, email: fieldErrorMessage }))
          } else if (matchingField === 'phone') {
            setFieldErrors(prev => ({ ...prev, mobile: fieldErrorMessage }))
          } else {
            setGeneralError(fieldErrorMessage)
          }
        } else {
          setGeneralError(errorData.message || `Error ${response.status}: Failed to submit`)
        }
        throw new Error('API error')
      }

      // Success
      setCouponCode(newCouponCode)
      setIsSubmitted(true)
      
    } catch (err) {
      console.error('Form submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode)
    alert('Coupon code copied!')
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex flex-col items-center justify-center p-6"
      >
        <div className="max-w-md w-full text-center space-y-8">
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700">
            Your {discount}% Discount Code!
          </h1>

          <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-emerald-200">
            <p className="text-gray-600 mb-4">Your Exclusive Code</p>
            <div className="text-4xl font-black text-emerald-600 tracking-wide mb-4 break-all">
              {couponCode}
            </div>
            <p className="text-lg text-gray-700 mb-6">
              Use this code at checkout to save <strong>{discount}%</strong>
            </p>

            <Button
              onClick={handleCopyCode}
              size="lg"
              className="w-full py-7 text-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800"
            >
              📋 Copy Code
            </Button>

            <p className="text-sm text-gray-500 mt-6">
              Code expires in 15 minutes • Saved to your profile
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <main className={`
      ${compact ? 'p-6' : 'min-h-screen p-6 md:p-12'}
      bg-gradient-to-br from-emerald-50 via-white to-green-50
      flex flex-col items-center justify-center
    `}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="text-6xl">🎁</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Get Your {discount}% Discount Code
          </h1>
          <p className="text-gray-600">
            Enter your details to receive your exclusive discount code instantly.
          </p>
        </div>

        {/* General error (for non-field-specific issues) */}
        {generalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border bg-red-50 border-red-300 text-red-900 flex items-start gap-3"
          >
            <XCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{generalError}</p>
              {apiErrorMeta?.contactId && (
                <p className="text-sm mt-2 opacity-90">
                  Contact already exists (ID: {apiErrorMeta.contactId.slice(0,8)}...)
                </p>
              )}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={handleInputChange(setEmail, 'email')}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:border-red-500 ring-red-200' 
                    : 'border-gray-300 focus:border-emerald-500 ring-emerald-200'
                } focus:ring-2 outline-none disabled:opacity-60`}
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={handleInputChange(setFullName, 'fullName')}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  fieldErrors.fullName 
                    ? 'border-red-500 focus:border-red-500 ring-red-200' 
                    : 'border-gray-300 focus:border-emerald-500 ring-emerald-200'
                } focus:ring-2 outline-none disabled:opacity-60`}
                placeholder="John Smith"
                disabled={isSubmitting}
              />
              {fieldErrors.fullName && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  fieldErrors.mobile 
                    ? 'border-red-500 focus:border-red-500 ring-red-200' 
                    : 'border-gray-300 focus:border-emerald-500 ring-emerald-200'
                } focus:ring-2 outline-none disabled:opacity-60`}
                placeholder="(123) 456-7890"
                disabled={isSubmitting}
              />
              {fieldErrors.mobile && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.mobile}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Processing...
              </span>
            ) : (
              `Get My ${discount}% Discount Code`
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          By submitting, you agree to receive your discount code via email and SMS.
        </p>
      </motion.div>
    </main>
  )
}