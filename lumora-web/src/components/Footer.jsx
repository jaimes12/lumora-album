import styles from './Footer.module.css'
import logoFull from '../assets/logo_elixe.jpeg'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <img src={logoFull} alt="Elixe" className={styles.logoImg} />
          </div>
          <p className={styles.tagline}>La plataforma para organizadores de eventos.</p>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/elixe_mx/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              @elixe_mx
            </a>
            <a href="https://www.facebook.com/profile.php?id=61590859832846" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              Elixe
            </a>
          </div>
        </div>
        <div className={styles.links}>
          <div className={styles.col}>
            <span className={styles.colTitle}>Producto</span>
            <a href="#">Características</a>
            <a href="#">Precios</a>
            <a href="#">Actualizaciones</a>
          </div>
          <div className={styles.col}>
            <span className={styles.colTitle}>Empresa</span>
            <a href="#">Nosotros</a>
            <a href="#">Blog</a>
            <a href="#">Contacto</a>
          </div>
          <div className={styles.col}>
            <span className={styles.colTitle}>Legal</span>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© 2026 Elixe. Hecho en México 🇲🇽</p>
      </div>
    </footer>
  )
}
