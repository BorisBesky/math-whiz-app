import React, { useRef, useState } from 'react';
import { Check, Coins, Eye, Globe2, Home, Leaf, Sparkles, X, LockKeyhole, ChevronRight } from 'lucide-react';
import PlanetViewer from './PlanetViewer';
import { PLANET_CATEGORIES, PLANET_ITEMS, getPlanetCollection, getPlanetItem } from './planetConfig';
import './PlanetStore.css';

const categoryIcons = { nature: Leaf, homes: Home, wonders: Sparkles };

export default function PlanetStore({ userData, handlePurchasePlanetItem, handleSetPlanetItemActive }) {
  const { owned, active } = getPlanetCollection(userData || {});
  const coins = Number.isFinite(userData?.coins) ? userData.coins : 0;
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [fullPreview, setFullPreview] = useState(false);
  const [collectionOnly, setCollectionOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thumbnails, setThumbnails] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const pendingRef = useRef(false);
  const worldRef = useRef(null);
  const selected = getPlanetItem(selectedId);
  const isOwned = selected && owned.includes(selected.id);
  const isActive = selected && active.includes(selected.id);
  const isPreview = fullPreview || (selected && !isActive);
  const visibleItems = fullPreview ? PLANET_ITEMS.map((item) => item.id)
    : [...new Set([...active, ...(selected ? [selected.id] : [])])];
  const items = PLANET_ITEMS.filter((item) => (category === 'all' || item.category === category) && (!collectionOnly || owned.includes(item.id)));

  const select = (id) => {
    setSelectedId(id);
    setResetKey((n) => n + 1);
    setFeedback(null);
    worldRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  };
  const restoreWorld = () => {
    setFullPreview(false);
    setSelectedId(null);
    setResetKey((n) => n + 1);
  };
  const save = async () => {
    if (!selected || pendingRef.current) return;
    const item = selected;
    const hiding = isOwned && isActive;
    pendingRef.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      if (isOwned) {
        await handleSetPlanetItemActive(item.id, !isActive);
        setFeedback({ type: 'success', message: hiding ? `${item.name} is tucked away. You can add it back anytime.` : `${item.name} is back on your planet!` });
      } else {
        const result = await handlePurchasePlanetItem(item.id);
        setFeedback({ type: 'success', message: result?.alreadyOwned ? `You already own ${item.name}.` : `${item.name} is yours! Your planet just grew.` });
      }
      setFullPreview(false);
      if (hiding) setSelectedId(null);
    } catch (error) {
      setFeedback({ type: 'error', message: error.code ? 'We couldn’t save that change. Check your connection and try again.' : error.message || 'We couldn’t save that change. Please try again.' });
    } finally {
      pendingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="planet-store">
      <div className="planet-intro">
        <div>
          <h3 className="font-display">Build your Little Planet</h3>
          <p>Practice math, earn coins, and fill your world with things you love.</p>
        </div>
        <div className="planet-wallet" aria-label={`${coins} coins available`}>
          <Coins size={24} /><strong>{coins}</strong><span>coins to spend</span>
        </div>
      </div>

      <div className="planet-layout">
        <section ref={worldRef} className="planet-world" aria-label="Your little planet">
          <div className="planet-world-top">
            <div className="planet-world-label">
              <Globe2 size={22} />
              <strong className="font-display">{fullPreview ? 'Complete world preview' : 'Your planet'}</strong>
              <span>{owned.length} / {PLANET_ITEMS.length} collected</span>
            </div>
            <button
              type="button"
              className="planet-complete-button"
              aria-pressed={fullPreview}
              onClick={() => { setFullPreview(!fullPreview); setSelectedId(null); setResetKey((n) => n + 1); }}
              disabled={busy}
            >
              {fullPreview ? <Globe2 size={18} /> : <Sparkles size={18} />}
              {fullPreview ? 'Return to my planet' : 'Preview the complete world'}
            </button>
          </div>
          <PlanetViewer visibleItems={visibleItems} focusItemId={selectedId} resetKey={resetKey} onThumbnailsReady={setThumbnails} />
          <div className="planet-world-footer">
            <div className="planet-world-caption">
              <span className={`planet-state ${isPreview ? 'is-preview' : ''}`}>
                {isPreview ? <Eye size={15} /> : <Check size={15} />}
                {isPreview ? 'Free preview' : 'Your world'}
              </span>
              <h4 className="font-display">
                {selected ? selected.name : fullPreview ? 'Look what you can build!' : owned.length ? 'Made by you. Ready to explore.' : 'Your adventure starts here.'}
              </h4>
              <p>{selected ? selected.description : fullPreview ? 'Explore all 18 rewards. Choose your favorites from the shop below.' : 'Land, sea, clouds, and a cozy campsite. Yours for free.'}</p>
            </div>
            {selected && (
              <div className="planet-detail">
                <span className="planet-detail-ownership">{isOwned ? 'Yours to keep' : 'Buy once, keep forever'}</span>
                <button className="planet-buy" type="button" onClick={save} disabled={busy || (!isOwned && coins < selected.price)}>
                  {busy ? 'Saving your planet…' : isOwned ? <><Check size={18} />{isActive ? 'Tuck away' : 'Add to my planet'}</> : coins < selected.price ? <><LockKeyhole size={17} />{selected.price - coins} more coins to go</> : <><Coins size={18} />Add to my planet · {selected.price}</>}
                </button>
                {!isOwned && coins < selected.price && <span className="planet-earn-hint">Earn more coins by practicing math.</span>}
              </div>
            )}
          </div>
          <div className="planet-world-bottom">
            <span>Drag to orbit · Scroll or pinch to zoom</span>
            {isPreview || selected ? <button type="button" onClick={restoreWorld} disabled={busy}><X size={16} />Back to my planet</button> : <span className="planet-starter"><Check size={16} />Starter world included</span>}
          </div>
          {feedback && <div className={`planet-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}
        </section>

        <section className="planet-shop" aria-label="Planet scenery shop">
          <div className="planet-shop-heading">
            <div>
              <h4 className="font-display">{collectionOnly ? 'Your collection' : 'Make room for something fun'}</h4>
              <p>Pick a reward to take a closer look on your planet.</p>
            </div>
            <button className="planet-collection-toggle" type="button" aria-pressed={collectionOnly} onClick={() => setCollectionOnly(!collectionOnly)}>{collectionOnly ? 'Shop all' : 'My collection'}</button>
          </div>
          <div className="planet-categories" aria-label="Scenery categories">
            {PLANET_CATEGORIES.map((c) => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</button>)}
          </div>
          <div className="planet-items">
            {items.map((item) => {
              const Icon = categoryIcons[item.category];
              const collected = owned.includes(item.id);
              return (
                <button type="button" key={item.id} className={`planet-item ${selectedId === item.id ? 'is-selected' : ''}`} aria-pressed={selectedId === item.id} aria-label={`Preview ${item.name}${collected ? ', owned' : `, ${item.price} coins`}`} onClick={() => select(item.id)} disabled={busy}>
                  <span className={`planet-item-picture category-${item.category}`}>
                    {thumbnails[item.id] ? <img src={thumbnails[item.id]} alt="" /> : <Icon size={36} strokeWidth={1.8} />}
                    {collected && <span className="planet-owned-badge"><Check size={13} />Owned</span>}
                  </span>
                  <span className="planet-item-info">
                    <strong>{item.name}</strong>
                    <span>{collected ? <><Check size={14} />{active.includes(item.id) ? 'On your planet' : 'In your collection'}</> : <><Coins size={15} />{item.price} coins</>}</span>
                  </span>
                  {selectedId === item.id ? <Eye size={17} className="planet-item-eye" /> : <ChevronRight size={16} className="planet-item-arrow" />}
                </button>
              );
            })}
            {!items.length && (
              <div className="planet-empty">
                <Leaf size={36} /><strong className="font-display">Your collection is ready to grow.</strong>
                <p>Practice math to earn coins, then choose a little wonder from the shop.</p>
                <button type="button" onClick={() => { setCollectionOnly(false); setCategory('all'); }}>Explore the shop</button>
              </div>
            )}
          </div>
        </section>
      </div>
      {owned.length === PLANET_ITEMS.length && <div className="planet-feedback success" role="status"><Sparkles size={20} />You collected every reward. This whole world is yours!</div>}
    </div>
  );
}
