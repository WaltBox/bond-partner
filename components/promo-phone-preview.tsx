import React from "react";

export interface PromoPhonePreviewProps {
  headline:    string;
  description: string;
  rewardLabel: string;
  terms?:      string;
  photoUrl?:   string | null;
  partnerName: string;
  category?:   string;
  city?:       string;
  logoUrl?:    string | null;
}

const INK    = "#1a1a1a";
const YELLOW = "#FFE44D";
const MUTED  = "#6B7280";
const DARK   = "#374151";

const SAT   = `'Satoshi-Black','Satoshi',system-ui,sans-serif`;
const SAT_B = `'Satoshi-Bold','Satoshi',system-ui,sans-serif`;
const SAT_M = `'Satoshi-Medium','Satoshi',system-ui,sans-serif`;

function ActionBtn({ label, icon, active }: { label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 999,
        background: active ? INK : "#F0F0F0",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 17, filter: active ? "invert(1)" : "none" }}>{icon}</span>
      </div>
      <span style={{ fontFamily: active ? SAT_B : SAT_M, fontSize: 10.5, color: INK, letterSpacing: 0.1 }}>{label}</span>
    </div>
  );
}

export function PromoPhonePreview({
  headline, description, rewardLabel, terms,
  photoUrl, partnerName, category, city, logoUrl,
}: PromoPhonePreviewProps) {
  const name    = (partnerName || "Your Venue").trim();
  const initial = name.charAt(0).toUpperCase();
  const meta    = [city, category].filter(Boolean).join(" • ");

  return (
    <div style={{
      width: 300,
      borderRadius: 50,
      background: "#1C1C1E",
      padding: "12px 10px 10px",
      boxShadow: "0 0 0 1px #3A3A3C, 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
      flexShrink: 0,
      position: "relative",
    }}>

      {/* Screen */}
      <div style={{
        borderRadius: 40,
        overflow: "hidden",
        background: "#fff",
        position: "relative",
      }}>
        {/* Status bar */}
        <div style={{
          height: 44, background: "#fff",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          padding: "0 20px 6px",
          position: "relative", zIndex: 10,
        }}>
          {/* Notch */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 110, height: 30, background: "#1C1C1E",
            borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
          }} />
          <span style={{ fontFamily: SAT_B, fontSize: 13, color: INK, letterSpacing: -0.3 }}>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="6" width="3" height="6" rx="1" fill={INK} />
              <rect x="4.5" y="4" width="3" height="8" rx="1" fill={INK} />
              <rect x="9" y="2" width="3" height="10" rx="1" fill={INK} />
              <rect x="13.5" y="0" width="3" height="12" rx="1" fill={INK} />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 2.5C5.5 2.5 3.3 3.6 1.8 5.4L0 3.6C2 1.4 4.8 0 8 0s6 1.4 8 3.6L14.2 5.4C12.7 3.6 10.5 2.5 8 2.5z" fill={INK} />
              <path d="M8 6C6.4 6 5 6.7 4 7.8L2.2 6C3.7 4.3 5.7 3.3 8 3.3s4.3 1 5.8 2.7L12 7.8C11 6.7 9.6 6 8 6z" fill={INK} />
              <circle cx="8" cy="11" r="1.5" fill={INK} />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={INK} strokeOpacity="0.35" />
              <rect x="2" y="2" width="17" height="8" rx="2" fill={INK} />
              <path d="M23 4v4a2 2 0 0 0 0-4z" fill={INK} fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Scrollable content */}
        <style>{`.bond-preview-scroll::-webkit-scrollbar{display:none}`}</style>
        <div className="bond-preview-scroll" style={{ maxHeight: 480, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
          {/* Hero */}
          <div style={{ position: "relative", width: "100%", height: 210, background: "#E8E0D5", flexShrink: 0 }}>
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8, color: "#B0A898",
              }}>
                <span style={{ fontSize: 40 }}>🖼️</span>
                <span style={{ fontFamily: SAT_M, fontSize: 12 }}>Your photo here</span>
              </div>
            )}
            {/* Scrim for buttons */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%)" }} />
            {/* Back */}
            <div style={{
              position: "absolute", top: 12, left: 12, width: 34, height: 34, borderRadius: 999,
              background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7l6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Share */}
            <div style={{
              position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 999,
              background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8 1l5 5-5 5M13 6H5a4 4 0 0 0-4 4v1" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Logo card */}
            <div style={{
              position: "absolute", bottom: -30, left: 14,
              width: 68, height: 68, borderRadius: 16,
              background: "#fff", border: `2px solid ${INK}`,
              boxShadow: `3px 3px 0 ${INK}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              {logoUrl
                ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontFamily: SAT, fontSize: 28, color: INK, lineHeight: 1 }}>{initial}</span>
              }
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "0 16px", background: "#fff" }}>
            {/* Vendor + headline */}
            <div style={{ paddingTop: 40 }}>
              <div style={{ fontFamily: SAT_B, fontSize: 10.5, letterSpacing: 1.4, color: MUTED, textTransform: "uppercase" }}>
                {name}
              </div>
              <div style={{ fontFamily: SAT, fontSize: 24, lineHeight: 1.15, color: INK, marginTop: 5, fontWeight: 900 }}>
                {headline || "Your promo headline"}
              </div>
              {meta && (
                <div style={{ fontFamily: SAT_M, fontSize: 13, color: MUTED, marginTop: 5 }}>{meta}</div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", padding: "18px 0 4px", gap: 4 }}>
              <ActionBtn label="Call"       icon="📞" />
              <ActionBtn label="Directions" icon="➤"  active />
              <ActionBtn label="Menu"       icon="🍽️" />
              <ActionBtn label="Save"       icon="🔖" />
            </div>

            {/* THE PERK */}
            <div style={{
              margin: "10px 0 0",
              padding: "7px 10px",
              background: YELLOW,
              border: `1.5px solid ${INK}`,
              borderRadius: 10,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: SAT_B, fontSize: 8, letterSpacing: 1.2, color: "#92400E", textTransform: "uppercase" }}>The Perk</div>
                <div style={{ fontFamily: SAT_B, fontSize: 13, lineHeight: 1.2, color: INK, marginTop: 1 }}>
                  {rewardLabel || <span style={{ opacity: 0.35 }}>Short reward label</span>}
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ marginTop: 22 }}>
              <div style={{ fontFamily: SAT, fontSize: 17, fontWeight: 900, color: INK }}>Location</div>
              <div style={{
                marginTop: 10, height: 90, borderRadius: 14,
                background: "linear-gradient(135deg,#dde8d0,#c4dbb8)",
                border: `1.5px solid #A8CADA`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#3D6B2C", fontFamily: SAT_B, fontSize: 12, gap: 4,
              }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <span>{city || "Map"}</span>
              </div>
            </div>

            <div style={{ height: 16 }} />
          </div>
        </div>

        {/* CTA bar */}
        <div style={{
          padding: "10px 14px 14px",
          background: "#fff",
          borderTop: "1px solid #F0F0F0",
          display: "flex", gap: 10,
        }}>
          <div style={{
            flex: 1, height: 48, background: INK, borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: SAT_B, fontSize: 14, color: "#fff", letterSpacing: -0.2 }}>Invite to Crib</span>
          </div>
          <div style={{
            flex: 1, height: 48, border: `2px solid ${INK}`, borderRadius: 999,
            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: SAT_B, fontSize: 14, color: INK, letterSpacing: -0.2 }}>Squad Up ⚡</span>
          </div>
        </div>

        {/* Home indicator */}
        <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 8px", background: "#fff" }}>
          <div style={{ width: 120, height: 5, borderRadius: 999, background: INK, opacity: 0.15 }} />
        </div>
      </div>
    </div>
  );
}
