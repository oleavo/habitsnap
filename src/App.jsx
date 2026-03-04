import { useState, useRef, useEffect, useCallback } from "react";

// ── Storage ───────────────────────────────────────────────────
async function dbGet(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
async function dbSet(key,val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ── Constants ─────────────────────────────────────────────────
const UNSPLASH = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80",
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
  "https://images.