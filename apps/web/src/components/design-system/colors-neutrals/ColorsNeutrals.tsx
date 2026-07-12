import '../../../../design-system/preview/_base.css'
import './ColorsNeutrals.css'

export default function ColorsNeutrals() {
  return (
    <div className="card">
      <div className="cn-label-row">
        <div className="cn-lr-title"><span className="cn-lr-dot"></span>Neutrals — Gray</div>
        <div className="cn-lr-meta">fg / bg / borders</div>
      </div>
      <div className="swatches">
        <div className="sw lite" style={{ background: '#FAFAFA', border: '1px solid #ECECEC' }}>50<br />FAFAFA</div>
        <div className="sw lite" style={{ background: '#F5F5F5' }}>100<br />F5F5F5</div>
        <div className="sw lite" style={{ background: '#ECECEC' }}>200<br />ECECEC</div>
        <div className="sw lite" style={{ background: '#D4D4D4' }}>300<br />D4D4D4</div>
        <div className="sw lite" style={{ background: '#A1A1A1' }}>400<br />A1A1A1</div>
        <div className="sw dark" style={{ background: '#6B6B6B' }}>500<br />6B6B6B</div>
        <div className="sw dark" style={{ background: '#4A4A4A' }}>600<br />4A4A4A</div>
        <div className="sw dark" style={{ background: '#232323' }}>700<br />232323</div>
        <div className="sw dark" style={{ background: '#1C1C1C' }}>800<br />1C1C1C</div>
        <div className="sw dark" style={{ background: '#111111' }}>900<br />111111</div>
      </div>
    </div>
  )
}
