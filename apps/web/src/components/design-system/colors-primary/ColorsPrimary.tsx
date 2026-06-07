import '../../../../design-system/preview/_base.css'
import './ColorsPrimary.css'

export default function ColorsPrimary() {
  return (
    <div className="card">
      <div className="cp-label-row">
        <div className="cp-lr-title"><span className="cp-lr-dot"></span>Primary — Emerald</div>
        <div className="cp-lr-meta">#10B981 · brand.primary.500</div>
      </div>
      <div className="cp-swatches">
        <div className="cp-sw lite" style={{ background: '#ECFDF5' }}>50<br />ECFDF5</div>
        <div className="cp-sw lite" style={{ background: '#D1FAE5' }}>100<br />D1FAE5</div>
        <div className="cp-sw lite" style={{ background: '#A7F3D0' }}>200<br />A7F3D0</div>
        <div className="cp-sw lite" style={{ background: '#6EE7B7' }}>300<br />6EE7B7</div>
        <div className="cp-sw" style={{ background: '#34D399' }}>400<br />34D399</div>
        <div className="cp-sw" style={{ background: '#10B981', outline: '2px solid #0F172A', outlineOffset: '-2px' }}>500<br />10B981</div>
        <div className="cp-sw" style={{ background: '#059669' }}>600<br />059669</div>
        <div className="cp-sw" style={{ background: '#047857' }}>700<br />047857</div>
        <div className="cp-sw" style={{ background: '#065F46' }}>800<br />065F46</div>
        <div className="cp-sw" style={{ background: '#064E3B' }}>900<br />064E3B</div>
      </div>
    </div>
  )
}
