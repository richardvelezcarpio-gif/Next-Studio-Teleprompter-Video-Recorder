import { useState } from 'react'

type Language = 'en' | 'es'

type WhatsAppWidgetProps = {
  language: Language
  photoSrc: string
}

const WHATSAPP_NUMBER = '12393337935'

const content = {
  en: {
    floating: 'Chat with us',
    heading: 'Want your own business platform?',
    message: 'We can build a custom digital solution for your business.',
    action: 'Chat on WhatsApp',
    prefilledMessage: 'Hello Richard, I saw the Next Studio Teleprompter Video Recorder and I’m interested in creating a custom business platform.',
  },
  es: {
    floating: 'Chatea con nosotros',
    heading: '¿Quieres tu propia plataforma para tu negocio?',
    message: 'Podemos crear una solución digital personalizada para ti.',
    action: 'Hablar por WhatsApp',
    prefilledMessage: 'Hola Richard, vi la plataforma Next Studio Teleprompter Video Recorder y estoy interesado en crear una plataforma personalizada para mi negocio.',
  },
}

export function WhatsAppWidget({ language, photoSrc }: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = content[language]
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.prefilledMessage)}`

  return (
    <div className="whatsapp-widget">
      {isOpen && (
        <section className="whatsapp-card" aria-label="WhatsApp contact">
          <button className="whatsapp-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close WhatsApp contact card">
            ×
          </button>
          <div className="whatsapp-person">
            <img src={photoSrc} alt="Richard Velez" />
            <strong>Richard Velez</strong>
          </div>
          <h2>{t.heading}</h2>
          <p>{t.message}</p>
          <a className="whatsapp-action" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">◔</span> {t.action}
          </a>
        </section>
      )}
      <button className="whatsapp-fab" type="button" onClick={() => setIsOpen((open) => !open)} aria-label={t.floating} aria-expanded={isOpen}>
        <span className="whatsapp-icon" aria-hidden="true">◔</span>
        <span>{t.floating}</span>
      </button>
    </div>
  )
}
