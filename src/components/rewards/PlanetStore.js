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
  const pendingRef = useRef(false);
  const worldRef = useRef(null);
  const detailRef = useRef(null);
  const [feedback, setFeedback] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const selected = getPlanetItem(selectedId);
  const isOwned = selected && owned.includes(selected.id);
  const isActive = selected && active.includes(selected.id);
  const isPreview = fullPreview || (selected && !isActive);
  const visibleItems = fullPreview ? PLANET_ITEMS.map((item) => item.id)
    : [...new Set([...active, ...(selected ? [selected.id] : [])])];
  const items = PLANET_ITEMS.filter((item) => (category === 'all' || item.category === category) && (!collectionOnly || owned.includes(item.id)));

  const showWorldOnMobile = () => {
    if (window.innerWidth <= 850) worldRef.current?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  };
  const select = (id) => { setSelectedId(id); setResetKey((n) => n + 1); setFeedback(null); showWorldOnMobile(); };
  const restoreWorld = () => { setFullPreview(false); setSelectedId(null); setResetKey((n) => n + 1); };
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
      // Clear a hidden item's temporary preview after the save completes.
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
        <div><span className="planet-eyebrow">A LITTLE PRACTICE. A WORLD OF POSSIBILITIES.</span><h3>Small steps. <em>Little planet.</em></h3><p>Your own corner of the universe. Make it yours, one reward at a time.</p></div>
        <div className="planet-wallet" aria-label={`${coins} coins available`}><Coins size={21} /><strong>{coins}</strong><span>coins to spend</span></div>
      </div>

      <div className="planet-layout">
        <section ref={worldRef} className="planet-world" aria-label="Your little planet">
          <div className="planet-world-top"><span><Globe2 size={17} /> {fullPreview ? 'THE DREAM PLANET' : 'YOUR LITTLE PLANET'}</span><span>{owned.length} / {PLANET_ITEMS.length} collected</span></div>
          <PlanetViewer visibleItems={visibleItems} focusItemId={selectedId} resetKey={resetKey} />
          <div className="planet-world-caption"><span className="planet-eyebrow">{isPreview ? 'JUST EXPLORING · NOTHING SPENT' : 'EVERY GREAT WORLD STARTS SMALL'}</span><h4>{fullPreview ? 'Imagine the possibilities.' : selected ? selected.name : owned.length ? 'A world you’re making your own.' : 'Your adventure starts here.'}</h4><p>{fullPreview ? 'Discover everything your planet can become.' : selected ? 'A little closer look at your next small wonder.' : 'Land, sea, clouds, and a cozy campsite. Yours for free.'}</p></div>
          <div className="planet-world-bottom"><span>Drag to orbit · Scroll or pinch to zoom</span>{isPreview || selected ? <button type="button" onClick={restoreWorld} disabled={busy}><X size={14} /> Back to my planet</button> : <span className="planet-starter"><Check size={14} /> Starter world included</span>}{selected && <button type="button" className="planet-mobile-details" onClick={() => detailRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' })}>View item details <ChevronRight size={14} /></button>}</div>
        </section>

        <aside className="planet-shop" aria-label="Planet scenery shop">
          <div className="planet-shop-heading"><div><span className="planet-eyebrow">GROW SOMETHING WONDERFUL</span><h4>{collectionOnly ? 'Your collection' : 'A world of little wonders'}</h4></div><button className="planet-collection-toggle" type="button" aria-pressed={collectionOnly} onClick={() => setCollectionOnly(!collectionOnly)}>{collectionOnly ? 'Shop all' : 'My collection'}</button></div>
          <div className="planet-categories" aria-label="Scenery categories">{PLANET_CATEGORIES.map((c) => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</button>)}</div>
          <div className="planet-items">
            {items.map((item) => {
              const Icon = categoryIcons[item.category];
              const collected = owned.includes(item.id);
              return <button type="button" key={item.id} className={`planet-item ${selectedId === item.id ? 'is-selected' : ''}`} aria-pressed={selectedId === item.id} aria-label={`Preview ${item.name}${collected ? ', owned' : `, ${item.price} coins`}`} onClick={() => select(item.id)} disabled={busy}>
                <span className="planet-item-icon" style={{ color: item.color }}><Icon size={25} strokeWidth={1.4} /></span>
                <span className="planet-item-info"><strong>{item.name}</strong><span>{collected ? <><Check size={12} /> {active.includes(item.id) ? 'On your planet' : 'In your collection'}</> : <><Coins size={12} /> {item.price} coins</>}</span></span>
                {selectedId === item.id ? <Eye size={16} className="planet-item-eye" /> : <ChevronRight size={15} className="planet-item-arrow" />}
              </button>;
            })}
            {!items.length && <div className="planet-empty"><Leaf size={29} /><strong>Your collection is ready to grow.</strong><p>Practice math to earn coins, then choose a little wonder from the shop.</p><button type="button" onClick={() => { setCollectionOnly(false); setCategory('all'); }}>Explore the shop</button></div>}
          </div>

          {selected ? <div ref={detailRef} className="planet-detail"><div className="planet-detail-title"><strong>{selected.name}</strong><span>{isOwned ? 'YOURS TO KEEP' : 'ONE-TIME PURCHASE'}</span></div><p>{selected.description}</p><button className="planet-buy" type="button" onClick={save} disabled={busy || (!isOwned && coins < selected.price)}>{busy ? 'Saving your planet…' : isOwned ? <><Check size={16} /> {isActive ? 'Tuck away' : 'Add to my planet'}</> : coins < selected.price ? <><LockKeyhole size={15} /> {selected.price - coins} more coins to go</> : <><Coins size={17} /> Add to my planet · {selected.price}</>}</button>{!isOwned && coins < selected.price && <span className="planet-earn-hint">Earn more coins by practicing math.</span>}</div> : <div className="planet-shop-hint"><Eye size={18} /><p>Pick a little wonder to see it on your planet before you buy.</p></div>}
        </aside>
      </div>

      {feedback && <div className={`planet-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}
      <div className="planet-journey"><div><Sparkles size={21} /><div><strong>{owned.length === PLANET_ITEMS.length ? 'A whole world of your own.' : 'Big dreams start with small steps.'}</strong><p>{owned.length === PLANET_ITEMS.length ? 'You collected every little wonder. Keep exploring and make it yours.' : 'Practice math. Earn coins. Bring your little planet to life.'}</p></div></div><button type="button" aria-pressed={fullPreview} onClick={() => { setFullPreview(!fullPreview); setSelectedId(null); setResetKey((n) => n + 1); showWorldOnMobile(); }} disabled={busy}><Globe2 size={17} /> {fullPreview ? 'Return to my planet' : 'Preview the complete world'} <ChevronRight size={15} /></button></div>
    </div>
  );
}
