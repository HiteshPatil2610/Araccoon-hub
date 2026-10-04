import React from 'react';
import { Button } from '../core/Button.jsx';
import { Icon } from '../core/Icon.jsx';
const tile = { background: 'var(--cd-ink-800)', borderRadius: 'var(--radius-m)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, color: '#fff' };
const cap = { fontFamily: 'var(--font-sans)', fontSize: 8, letterSpacing: '.32em', textTransform: 'uppercase', opacity: .8 };
const val = { fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1, textAlign: 'center' };
export function BookingCard({ kicker = 'Film', title = 'Film Title', cinema = 'El Capitan Theatre', date = 'May 29', time = '9:30 PM', mapSrc, onBook, onMap, style }) {
  return <div style={{ width: 240, background: 'var(--surface-card-dark)', borderRadius: 'var(--radius-l)', padding: '28px 14px 14px', position: 'relative', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
    <span style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', border: '3px solid var(--surface-card-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="ticket" size={15} /></span>
    <div style={{ textAlign: 'center', color: '#fff', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
      <span style={{ ...cap, fontSize: 9 }}>{kicker}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: .9 }}>{title}</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div onClick={onMap} style={{ ...tile, aspectRatio: '1', background: mapSrc ? `center/cover url(${mapSrc})` : 'repeating-linear-gradient(35deg,#1c1c1c 0 7px,#262626 7px 9px)', cursor: onMap ? 'pointer' : 'default', justifyContent: 'flex-end' }}><Icon name="map-pin" size={18} style={{ marginBottom: 'auto', marginTop: 18 }} /><span style={cap}>Map</span></div>
      <div style={{ ...tile, aspectRatio: '1' }}><span style={{ color: 'var(--accent)', fontSize: 8 }}>▼</span><span style={cap}>Cinema</span><span style={val}>{cinema}</span></div>
      <div style={tile}><span style={cap}>Date</span><span style={val}>{date}</span></div>
      <div style={tile}><span style={cap}>Time</span><span style={val}>{time}</span></div>
    </div>
    <Button variant="bar" icon="arrow-right" onClick={onBook} style={{ marginTop: 4 }}>Book Now</Button>
  </div>;
}
