"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export default function HomescreenPrompt() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;

    // Clean up any stale legacy blocking keys from previous tests
    try {
      localStorage.removeItem("rolefuse_homescreen_prompt_seen");
    } catch {}

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

    // Trigger prompt when a user session is active
    const triggerPromptForUser = (userId: string) => {
      if (!userId) return;
      setActiveUserId(userId);

      // If user already installed as home screen app, do not show
      const isInstalled = localStorage.getItem("rolefuse_homescreen_installed") === "true";
      if (isInstalled) {
        return;
      }

      // If user clicked "Not now" during this login session, do not show again
      const isDismissedInSession =
        sessionStorage.getItem("rolefuse_homescreen_dismissed_session") === "true" ||
        sessionStorage.getItem(`rolefuse_homescreen_dismissed_${userId}`) === "true";

      if (isDismissedInSession) {
        return;
      }

      // Ensure it displays only 1 time during the current session
      if (hasTriggeredRef.current) {
        return;
      }

      hasTriggeredRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Smooth gentle fade-in 1 second after user logs in
      timerRef.current = setTimeout(() => {
        setVisible(true);
      }, 1000);
    };

    // 1. Check existing active session immediately on mount
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

    // 2. Real-time auth listener for login events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        const sessionUserId = session?.user?.id;
        if (sessionUserId) {
          if (event === "SIGNED_IN") {
            // Fresh login detected: clear session dismissal so the prompt asks
            try {
              sessionStorage.removeItem("rolefuse_homescreen_dismissed_session");
              sessionStorage.removeItem(`rolefuse_homescreen_dismissed_${sessionUserId}`);
              localStorage.removeItem("rolefuse_homescreen_dismissed");
              localStorage.removeItem(`rolefuse_homescreen_dismissed_${sessionUserId}`);
            } catch {}
            hasTriggeredRef.current = false;
          }
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

  // When user clicks "Not now", dismiss for this session so it does not show again
  const handleDismiss = () => {
    try {
      sessionStorage.setItem("rolefuse_homescreen_dismissed_session", "true");
      localStorage.setItem("rolefuse_homescreen_dismissed", "true");
      if (activeUserId) {
        sessionStorage.setItem(`rolefuse_homescreen_dismissed_${activeUserId}`, "true");
        localStorage.setItem(`rolefuse_homescreen_dismissed_${activeUserId}`, "true");
      }
    } catch {}
    setVisible(false);
  };

  const handleAddToHomeScreen = async () => {
    const installPrompt =
      deferredPrompt ||
      (typeof window !== "undefined" && (window as any).__rolefuse_deferred_prompt);

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          try {
            localStorage.setItem("rolefuse_homescreen_installed", "true");
          } catch {}
          handleDismiss();
          return;
        }
      } catch {
        // Fall back to instructions
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
      className="fixed bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-lg transition-all duration-500 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="bg-white border border-slate-200/90 rounded-sm p-6 sm:p-7 shadow-2xl shadow-slate-900/15 space-y-4.5 select-none relative">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#087F6E] block">
            Quick Access
          </span>
          <h3 className="font-heading font-black text-[#111827] text-lg leading-snug">
            Add RoleFuse to Home Screen
          </h3>
          <p className="text-xs text-[#526176] font-normal leading-relaxed">
            Open your resumes, job tracking, and ATS score optimizations directly from your device home screen with one tap.
          </p>
        </div>

        {noticeMessage ? (
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5 text-xs font-semibold text-slate-800 text-center">
            {noticeMessage}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1.5">
            <button
              type="button"
              onClick={handleAddToHomeScreen}
              className="flex-1 h-11 px-5 border-2 border-[#087F6E] bg-transparent hover:bg-[#087F6E] text-[#087F6E] hover:text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-center"
            >
              Add to Home Screen
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-11 px-6 border-2 border-slate-300 bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-center"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
