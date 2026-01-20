'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface DiscountFormProps {
  discount: string
  onBack?: () => void
}

export default function DiscountForm({ discount, onBack }: DiscountFormProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    fullName?: string
    mobile?: string
  }>({})

  // API Configuration using environment variables
  const API_CONFIG = {
    endpoint: 'https://services.leadconnectorhq.com/contacts/',
    authToken: process.env.NEXT_PUBLIC_GH_AUTH_TOKEN || '',
    locationId: process.env.NEXT_PUBLIC_GH_LOCATION_ID || ''
  }

  // Generate a coupon code
  const generateCouponCode = () => {
    const prefix = ''
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}${discount}${randomNum}${randomChars}`
  }

  // Validate mobile number
  const validateMobile = (phone: string): boolean => {
    // Basic mobile validation - at least 10 digits, can include +, spaces, dashes
    const cleaned = phone.replace(/[\s\-+()]/g, '')
    return cleaned.length >= 10 && /^\d+$/.test(cleaned)
  }

  // Validate email
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: { email?: string; fullName?: string; mobile?: string } = {}
    let isValid = true

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }

    // Full name validation
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required'
      isValid = false
    } else if (fullName.trim().split(' ').length < 2) {
      errors.fullName = 'Please enter your full name (first and last)'
      isValid = false
    }

    // Mobile validation
    if (!mobile.trim()) {
      errors.mobile = 'Mobile number is required'
      isValid = false
    } else if (!validateMobile(mobile)) {
      errors.mobile = 'Please enter a valid mobile number (at least 10 digits)'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')
    
    // Format based on length
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  // Handle mobile input change with formatting
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '') // Remove non-digits
    const formatted = formatPhoneNumber(input)
    setMobile(formatted)
    
    // Clear mobile error when user starts typing
    if (fieldErrors.mobile) {
      setFieldErrors(prev => ({ ...prev, mobile: undefined }))
    }
  }

  // Handle input change with error clearing
  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: keyof typeof fieldErrors
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate form
    if (!validateForm()) {
      return
    }

    // Check if environment variables are set
    if (!API_CONFIG.authToken || !API_CONFIG.locationId) {
      setError('Configuration error. Please contact support.')
      console.error('Missing environment variables')
      return
    }

    setIsSubmitting(true)

    try {
      // Generate coupon code
      const newCouponCode = generateCouponCode()
      
      // Prepare phone number for API (remove formatting)
      const phoneForApi = mobile.replace(/\D/g, '')
      
      // Extract first name from full name
      const firstName = fullName.trim().split(' ')[0] || fullName
      
      const requestBody = {
        locationId: API_CONFIG.locationId,
        firstName: firstName,
        email: email.trim(),
        phone: phoneForApi,
        customFields: [
          {
            id: "spintowin_coupon",
            value: newCouponCode
          },
          {
            id: "spintowincoupon_discount",
            value: `${discount}%`
          }
        ]
      }

      // Send data to GoHighLevel API
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
        let errorMessage = 'Failed to submit form'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }

      // API call successful - set coupon code and show success
      setCouponCode(newCouponCode)
      setIsSubmitted(true)
      
    } catch (err) {
      console.error('Error submitting form:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit form. Please try again.')
      // DO NOT show coupon code on API error
      setIsSubmitted(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode)
      .then(() => {
        alert('Coupon code copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
      })
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex flex-col items-center justify-center gap-6 p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center space-y-8 max-w-md w-full"
        >
          <div className="space-y-4">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Your {discount}% Discount Code!
            </h1>
            <p className="text-gray-600 text-lg">
              Use this code at checkout to save {discount}% on your purchase.
            </p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border-4 border-emerald-200 w-full"
          >
            <div className="text-center space-y-6">
              <div>
                <p className="text-gray-500 mb-2 text-sm md:text-base">Your Exclusive Coupon Code</p>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent break-all px-2">
                  {couponCode}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Discount: {discount}% off
                </p>
              </div>
              
              <Button
                onClick={handleCopyCode}
                size="lg"
                className="w-full py-4 md:py-6 text-base md:text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg"
              >
                📋 Copy Code
              </Button>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  ✅ Your details have been saved
                </p>
                <p className="text-xs text-gray-500">
                  Code expires in 15 minutes
                </p>
              </div>
            </div>
          </motion.div>
          
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 flex flex-col items-center justify-center gap-6 p-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-center space-y-6 md:space-y-8 max-w-md w-full"
      >
        <div className="space-y-4">
          <div className="text-4xl md:text-5xl mb-4">🎁</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Where should we send your {discount}% discount code?
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Enter your details below to receive your exclusive discount code.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
          >
            <p className="text-sm font-medium">{error}</p>
            <p className="text-xs mt-1">Please check your information and try again.</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Email Field */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={handleInputChange(setEmail, 'email')}
              className={`w-full px-4 py-3 text-base md:text-lg rounded-xl border-2 focus:ring-2 focus:ring-orange-200 outline-none transition-all ${
                fieldErrors.email 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:border-orange-500'
              }`}
              placeholder="you@example.com"
              disabled={isSubmitting}
              inputMode="email"
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </motion.div>

          {/* Full Name Field */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={handleInputChange(setFullName, 'fullName')}
              className={`w-full px-4 py-3 text-base md:text-lg rounded-xl border-2 focus:ring-2 focus:ring-orange-200 outline-none transition-all ${
                fieldErrors.fullName 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:border-orange-500'
              }`}
              placeholder="John Smith"
              disabled={isSubmitting}
              autoComplete="name"
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
            )}
          </motion.div>

          {/* Mobile Field */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={handleMobileChange}
              className={`w-full px-4 py-3 text-base md:text-lg rounded-xl border-2 focus:ring-2 focus:ring-orange-200 outline-none transition-all ${
                fieldErrors.mobile 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:border-orange-500'
              }`}
              placeholder="(123) 456-7890"
              disabled={isSubmitting}
              inputMode="tel"
              autoComplete="tel"
            />
            {fieldErrors.mobile ? (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.mobile}</p>
            ) : (
              <p className="text-gray-500 text-xs mt-1">
                Enter your 10-digit mobile number
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-4"
          >
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full py-4 md:py-6 text-base md:text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Get My ${discount}% Discount Code`
              )}
            </Button>
          </motion.div>
        </form>

        <div className="text-xs text-gray-500 text-center">
          <p>By submitting, you agree to receive the discount code via email and SMS</p>
        </div>
      </motion.div>
    </main>
  )
}