"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Plus, ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { bondFetch, partnerPath, getActivePartnerId } from "@/lib/api/client";

const BRAND = "#7B8FE8";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// ─── Types ───────────────────────────────────────────────────────────────────

type ApiMessage = {
  id: string;
  sender_type: "partner" | "admin";
  sender_id: string;
  body: string;
  created_at: string;
};

type ApiThread = {
  id: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  partner_support_messages?: ApiMessage[];
};

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiListThreads(): Promise<ApiThread[]> {
  const res = await bondFetch<{ threads: ApiThread[] }>(partnerPath("/support/threads"));
  return res.threads ?? [];
}

async function apiCreateThread(subject: string, body: string): Promise<ApiThread> {
  const res = await bondFetch<{ thread: ApiThread }>(partnerPath("/support/threads"), {
    method: "POST",
    body: JSON.stringify({ subject, body }),
  });
  return res.thread;
}

async function apiGetMessages(threadId: string): Promise<{ thread: ApiThread; messages: ApiMessage[] }> {
  return bondFetch(partnerPath(`/support/threads/${threadId}/messages`));
}

async function apiSendMessage(threadId: string, body: string): Promise<ApiMessage> {
  const res = await bondFetch<{ message: ApiMessage }>(
    partnerPath(`/support/threads/${threadId}/messages`),
    { method: "POST", body: JSON.stringify({ body }) }
  );
  return res.message;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dayLabel(s: string) {
  const d = new Date(s);
  const today = new Date();
  const yest  = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString())  return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDay(msgs: ApiMessage[]) {
  const out: { label: string; msgs: ApiMessage[] }[] = [];
  for (const m of msgs) {
    const label = dayLabel(m.created_at);
    const last  = out[out.length - 1];
    if (last?.label === label) last.msgs.push(m);
    else out.push({ label, msgs: [m] });
  }
  return out;
}

function previewText(t: ApiThread) {
  const msgs = t.partner_support_messages;
  if (!msgs?.length) return "";
  return msgs[msgs.length - 1].body;
}

function agoLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Now";
  if (mins < 60)  return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7)   return new Date(iso).toLocaleDateString([], { weekday: "short" });
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function bubbleRadius(isMe: boolean, first: boolean, last: boolean) {
  const r = 18, s = 4;
  if (isMe) return `${r}px ${first ? r : s}px ${last ? r : s}px ${r}px`;
  return `${first ? r : s}px ${r}px ${r}px ${last ? r : s}px`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size, color = BRAND }: { name: string; size: number; color?: string }) {
  const ini = name.split(/\s+/).filter(w => /[a-z]/i.test(w[0])).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {ini}
    </div>
  );
}

function HoverBtn({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "none", background: h ? "#f1f5f9" : "transparent", color: "#64748b", cursor: "pointer", flexShrink: 0, transition: "background 0.1s" }}>
      {children}
    </button>
  );
}

function ThreadRow({ t, divider, onClick }: { t: ApiThread; divider: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  const preview = previewText(t);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", border: "none", borderTop: divider ? "1px solid #f1f5f9" : "none", background: h ? "#f8fafc" : "#fff", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.1s" }}>
      <Avatar name={t.subject} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {t.subject}
          </span>
          <span style={{ fontSize: 11.5, color: "#94a3b8", flexShrink: 0 }}>{agoLabel(t.updated_at)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {preview || <em style={{ opacity: 0.6 }}>No messages yet</em>}
          </span>
          {t.status === "closed" && (
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8", background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", flexShrink: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Closed
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── New thread form ──────────────────────────────────────────────────────────

function NewThreadForm({ onCreated, onBack }: { onCreated: (t: ApiThread, firstMsg: ApiMessage) => void; onBack: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setBusy(true); setErr(null);
    try {
      const thread = await apiCreateThread(subject.trim(), body.trim());
      // Construct the first message from what we sent so the thread view populates immediately
      const firstMsg: ApiMessage = { id: "optimistic", sender_type: "partner", sender_id: "", body: body.trim(), created_at: thread.created_at };
      onCreated(thread, firstMsg);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, outline: "none", fontFamily: "inherit", color: "#1e293b", background: "#fff", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <HoverBtn onClick={onBack} title="Back"><ArrowLeft size={15} /></HoverBtn>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", flex: 1 }}>New conversation</p>
      </div>

      <form onSubmit={submit} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, padding: "20px 18px", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase" }}>Subject</label>
          <input
            value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Invoice question"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = BRAND}
            onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            required autoFocus
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase" }}>Message</label>
          <textarea
            value={body} onChange={e => setBody(e.target.value)}
            placeholder="What do you need help with?"
            style={{ ...inputStyle, resize: "none", flex: 1, minHeight: 120, lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = BRAND}
            onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            required
          />
        </div>
        {err && <p style={{ margin: 0, fontSize: 12.5, color: "#ef4444" }}>{err}</p>}
        <button type="submit" disabled={busy || !subject.trim() || !body.trim()}
          style={{ padding: "10px", borderRadius: 10, border: "none", background: subject.trim() && body.trim() ? BRAND : "#e2e8f0", color: subject.trim() && body.trim() ? "#fff" : "#94a3b8", fontSize: 14, fontWeight: 600, cursor: subject.trim() && body.trim() ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.15s" }}>
          {busy ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : "Send message"}
        </button>
      </form>
      <div style={{ padding: "10px 18px 14px", borderTop: "1px solid #f1f5f9" }}>
        <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8", textAlign: "center" }}>Messages instantly notify your account manager</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PartnerChat() {
  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState<"inbox" | "thread" | "new">("inbox");
  const [threads, setThreads]     = useState<ApiThread[]>([]);
  const [activeThread, setActive] = useState<ApiThread | null>(null);
  const [messages, setMessages]   = useState<ApiMessage[]>([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [inboxErr, setInboxErr]   = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalUnread = 0; // server doesn't return unread counts; omit for now

  // Load inbox
  const loadInbox = useCallback(async () => {
    if (!getActivePartnerId()) return;
    setLoadingInbox(true); setInboxErr(null);
    try {
      const ts = await apiListThreads();
      setThreads(ts);
    } catch (e: unknown) {
      setInboxErr(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    if (open && view === "inbox") loadInbox();
  }, [open, view, loadInbox]);

  // Load thread + poll
  const loadThread = useCallback(async (threadId: string) => {
    try {
      const { thread, messages } = await apiGetMessages(threadId);
      setActive(thread);
      setMessages(messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    } catch { /* ignore poll errors */ }
  }, []);

  useEffect(() => {
    if (view !== "thread" || !activeThread) return;
    loadThread(activeThread.id);
    pollRef.current = setInterval(() => loadThread(activeThread.id), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [view, activeThread?.id, loadThread]);

  useEffect(() => {
    if (view === "thread") setTimeout(() => inputRef.current?.focus(), 80);
  }, [view]);

  function openThread(t: ApiThread) {
    setActive(t);
    setMessages(t.partner_support_messages ?? []);
    setView("thread");
  }

  async function send() {
    const text = input.trim();
    if (!text || !activeThread || activeThread.status === "closed") return;
    setInput(""); setSending(true);
    try {
      const msg = await apiSendMessage(activeThread.id, text);
      setMessages(ms => [...ms, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    } catch { setInput(text); }
    finally { setSending(false); }
  }

  function handleCreated(thread: ApiThread, firstMsg: ApiMessage) {
    setActive(thread);
    setMessages([firstMsg]);
    setThreads(ts => [thread, ...ts]);
    setView("thread");
  }

  const isClosed = activeThread?.status === "closed";

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 50 }}>
      {open && (
        <div style={{
          position: "absolute", bottom: 64, right: 0,
          width: 360, height: 520, borderRadius: 16, background: "#fff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}>

          {/* ── Inbox ── */}
          {view === "inbox" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ background: BRAND, padding: "22px 20px 18px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Bond Partner Support</p>
                    <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>Messages</h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => setView("new")}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em" }}>
                      <Plus size={12} strokeWidth={2.5} /> New
                    </button>
                    <button onClick={() => setOpen(false)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
                      <X size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {loadingInbox && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                    <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
                {inboxErr && (
                  <div style={{ padding: "24px 20px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#ef4444" }}>{inboxErr}</p>
                  </div>
                )}
                {!loadingInbox && !inboxErr && threads.length === 0 && (
                  <div style={{ padding: "40px 24px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>No conversations yet.</p>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#cbd5e1" }}>Start one and your account manager will respond shortly.</p>
                  </div>
                )}
                {threads.map((t, i) => (
                  <ThreadRow key={t.id} t={t} divider={i > 0} onClick={() => openThread(t)} />
                ))}
              </div>

              <div style={{ padding: "10px 20px 14px", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8", textAlign: "center" }}>Messages instantly notify your account manager</p>
              </div>
            </div>
          )}

          {/* ── New thread form ── */}
          {view === "new" && (
            <NewThreadForm onCreated={handleCreated} onBack={() => setView("inbox")} />
          )}

          {/* ── Thread view ── */}
          {view === "thread" && activeThread && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
                <HoverBtn onClick={() => { setView("inbox"); loadInbox(); }} title="Back"><ArrowLeft size={15} /></HoverBtn>
                <Avatar name={activeThread.subject} size={36} />
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeThread.subject}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: isClosed ? "#94a3b8" : "#22c55e", fontWeight: 500 }}>
                    {isClosed ? "Closed" : "Open · replies notify your account manager"}
                  </p>
                </div>
                <HoverBtn onClick={() => setOpen(false)} title="Close"><X size={15} /></HoverBtn>
              </div>

              {/* Closed banner */}
              {isClosed && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                  <LockKeyhole size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>This conversation is closed. Start a new one if you need help.</p>
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px", background: "#f8f9fb" }}>
                {loadingThread && messages.length === 0 && (
                  <div style={{ display: "flex", justifyContent: "center", paddingTop: 40, color: "#94a3b8" }}>
                    <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
                {groupByDay(messages).map(g => (
                  <div key={g.label}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
                      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", letterSpacing: "0.02em" }}>{g.label}</span>
                      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 16 }}>
                      {g.msgs.map((msg, i) => {
                        const isMe  = msg.sender_type === "partner";
                        const first = i === 0 || g.msgs[i - 1].sender_type !== msg.sender_type;
                        const last  = i === g.msgs.length - 1 || g.msgs[i + 1].sender_type !== msg.sender_type;
                        return (
                          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginTop: first && i > 0 ? 10 : 0 }}>
                            <div style={{
                              maxWidth: "75%", padding: "9px 13px", fontSize: 13.5, lineHeight: 1.5,
                              borderRadius: bubbleRadius(isMe, first, last),
                              background: isMe ? BRAND : "#fff",
                              color: isMe ? "#fff" : "#1e293b",
                              border: isMe ? "none" : "1px solid #e8eaed",
                              wordBreak: "break-word",
                            }}>
                              {msg.body}
                            </div>
                            {last && (
                              <span style={{ fontSize: 11, color: "#94a3b8", margin: "4px 2px 0" }}>{fmtTime(msg.created_at)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div style={{ padding: "10px 12px 10px", borderTop: "1px solid #f0f0f0", background: "#fff", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: isClosed ? "#f8fafc" : "#f1f5f9", borderRadius: 24, padding: "0 4px 0 14px" }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder={isClosed ? "This conversation is closed" : "Message…"}
                    disabled={isClosed || sending}
                    style={{ flex: 1, border: "none", background: "transparent", fontSize: 13.5, outline: "none", color: isClosed ? "#94a3b8" : "#1e293b", padding: "10px 0", fontFamily: "inherit", cursor: isClosed ? "not-allowed" : "text" }}
                  />
                  <button onClick={send} disabled={!input.trim() || isClosed || sending}
                    style={{ width: 32, height: 32, borderRadius: "50%", border: "none", flexShrink: 0, background: input.trim() && !isClosed ? BRAND : "#cbd5e1", color: "#fff", cursor: input.trim() && !isClosed ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                    {sending ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={13} />}
                  </button>
                </div>
                <p style={{ margin: "7px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                  Messages instantly notify your account manager
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) { setView("inbox"); } }}
        aria-label="Open messages"
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        style={{ width: 52, height: 52, borderRadius: "50%", border: "none", background: BRAND, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(123,143,232,0.35), 0 8px 24px rgba(123,143,232,0.25)", position: "relative", transition: "transform 0.15s" }}>
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && totalUnread > 0 && (
          <span style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", padding: "0 3px" }}>
            {totalUnread}
          </span>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
