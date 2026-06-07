import '../../../../design-system/preview/_base.css'
import './BrandLogo.css'

export default function BrandLogo() {
  return (
    <div className="card bl-card-no-pad">
      <div className="bl-wm">
        <div className="bl-wm-mark">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <path d="M16 4 L19 13 L28 16 L19 19 L16 28 L13 19 L4 16 L13 13 Z" fill="#fff" />
            <circle cx="25" cy="7" r="1.6" fill="#fff" />
            <circle cx="7" cy="25" r="1.2" fill="#fff" opacity="0.85" />
          </svg>
        </div>
        <div>
          <div className="bl-wm-text">Deha</div>
          <div className="bl-wm-tag">Smartest CRM</div>
        </div>
      </div>
      <div className="bl-variants">
        <div className="bl-variant on-white">
          <div className="bl-v-mark emerald">
            <svg className="bl-star" viewBox="0 0 32 32"><path d="M16 4 L19 13 L28 16 L19 19 L16 28 L13 19 L4 16 L13 13 Z" fill="#fff" /></svg>
          </div>
          <div className="bl-v-text dark">Deha</div>
        </div>
        <div className="bl-variant on-emerald">
          <div className="bl-v-mark white">
            <svg className="bl-star" viewBox="0 0 32 32"><path d="M16 4 L19 13 L28 16 L19 19 L16 28 L13 19 L4 16 L13 13 Z" fill="#10B981" /></svg>
          </div>
          <div className="bl-v-text white">Deha</div>
        </div>
        <div className="bl-variant on-dark">
          <div className="bl-v-mark emerald">
            <svg className="bl-star" viewBox="0 0 32 32"><path d="M16 4 L19 13 L28 16 L19 19 L16 28 L13 19 L4 16 L13 13 Z" fill="#fff" /></svg>
          </div>
          <div className="bl-v-text white">Deha</div>
        </div>
      </div>
    </div>
  )
}
