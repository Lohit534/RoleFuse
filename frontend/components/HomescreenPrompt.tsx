"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function HomescreenPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  // Helper to extract logged-in user synchronously from localStorage
  const getSyncUserId = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.user?.id) return parsed.user.id;
          }
        }
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;

    // Check if app is already running as installed standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Capture browser install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__rolefuse_deferred_prompt = e;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if ((window as any).__rolefuse_deferred_prompt) {
      setDeferredPrompt((window as any).__rolefuse_deferred_prompt);
    }

    // Trigger prompt when a user is logged in
    const triggerPromptForUser = (userId: string) => {
      if (!userId) return;
      setActiveUserId(userId);

      // Dismissed in current browser session? If so, don't nag again this session
      const isSessionDismissed =
        sessionStorage.getItem("rolefuse_homescreen_dismissed") === "true";

      if (isSessionDismissed) {
        return;
      }

      // Ensure it displays only once per page cycle
      if (hasTriggeredRef.current) {
        return;
      }

      hasTriggeredRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Gentle fade-in 1.2s after user is confirmed logged in
      timerRef.current = setTimeout(() => {
        setVisible(true);
      }, 1200);
    };

    // 1. Immediate synchronous check from cached auth token
    const cachedUserId = getSyncUserId();
    if (cachedUserId) {
      triggerPromptForUser(cachedUserId);
    }

    // 2. Check active Supabase session
    const checkActiveSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData?.session?.user?.id;
        if (sessionUserId) {
          triggerPromptForUser(sessionUserId);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          triggerPromptForUser(userData.user.id);
        }
      } catch {
        // Silent fallback
      }
    };

    checkActiveSession();

    // 3. Real-time auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        const sessionUserId = session?.user?.id;
        if (sessionUserId) {
          triggerPromptForUser(sessionUserId);
        } else if (event === "SIGNED_OUT") {
          if (timerRef.current) clearTimeout(timerRef.current);
          setVisible(false);
          setActiveUserId(null);
          hasTriggeredRef.current = false;
        }
      }
    );

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // When pathname changes (e.g. user just navigated into /dashboard after logging in)
  useEffect(() => {
    if (visible || hasTriggeredRef.current) return;
    const isSessionDismissed =
      typeof window !== "undefined" &&
      sessionStorage.getItem("rolefuse_homescreen_dismissed") === "true";

    if (isSessionDismissed) return;

    const userId = getSyncUserId();
    if (userId) {
      setActiveUserId(userId);
      hasTriggeredRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(true);
      }, 1200);
    }
  }, [pathname, visible]);

  // When user clicks "Not now", dismiss for this browser session
  const handleDismiss = () => {
    try {
      sessionStorage.setItem("rolefuse_homescreen_dismissed", "true");
    } catch {}
    setVisible(false);
  };

  const handleAddToHomeScreen = async () => {
    try {
      sessionStorage.setItem("rolefuse_homescreen_dismissed", "true");
    } catch {}

    const installPrompt =
      deferredPrompt ||
      (typeof window !== "undefined" && (window as any).__rolefuse_deferred_prompt);

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          handleDismiss();
          return;
        }
      } catch {
        // Fall back to instructions below
      }
    }

    // Text guidance strictly without symbols
    const isIos =
      typeof window !== "undefined" &&
      /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    if (isIos) {
      setNoticeMessage("Open your browser share menu and choose Add to Home Screen");
      setTimeout(() => {
        handleDismiss();
      }, 5000);
      return;
    }

    setNoticeMessage(
      "Open your browser menu and select Install or Add to Home Screen"
    );
    setTimeout(() => {
      handleDismiss();
    }, 4500);
  };

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add RoleFuse to Home Screen"
      className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-1.5rem)] max-w-sm sm:max-w-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="bg-white border border-slate-200/90 rounded-sm p-3.5 sm:p-6 shadow-2xl shadow-slate-900/15 space-y-2.5 sm:space-y-4 select-none relative">
        <div className="space-y-0.5 sm:space-y-1">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#087F6E] block">
            Quick Access
          </span>
          <h3 className="font-heading font-black text-[#111827] text-sm sm:text-base leading-snug">
            Add RoleFuse to Home Screen
          </h3>
          <p className="text-[11px] sm:text-xs text-[#526176] font-normal leading-relaxed">
            Access your ATS resume optimizer directly from your home screen with one tap.
          </p>
        </div>

        {noticeMessage ? (
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-slate-800 text-center">
            {noticeMessage}
          </div>
        ) : (
          <div className="flex flex-row items-center gap-2 pt-0.5 sm:pt-1">
            <button
              type="button"
              onClick={handleAddToHomeScreen}
              className="flex-1 h-9 sm:h-10 px-3 sm:px-4 border-2 border-[#087F6E] bg-transparent hover:bg-[#087F6E] text-[#087F6E] hover:text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-center truncate"
            >
              Add to Home Screen
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-9 sm:h-10 px-3 sm:px-5 border-2 border-slate-300 bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-center shrink-0"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
