import emailjs from '@emailjs/browser'

// Initialize EmailJS with Public Key from environment variables
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'

if (PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
  emailjs.init(PUBLIC_KEY)
}

export const emailService = {
  sendEmail: async (templateParams) => {
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_default'
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default'

    try {
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
      return { success: true, result }
    } catch (error) {
      console.error('EmailJS Send Error:', error)
      return { success: false, error }
    }
  }
}
