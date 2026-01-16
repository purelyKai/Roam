/**
 * Auto Reconnect Hook - Monitors session expiry and re-authenticates if needed
 */

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  sessionExpired,
  updateSessionToken,
} from "@/src/store/slices/connectionSlice";
import {
  validateSession,
  authenticateWithCaptivePortal,
  createSession,
} from "@/src/utils";

const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const WARNING_THRESHOLD_MS = 60000; // Warn 1 minute before expiry

/**
 * Hook that monitors active sessions and handles expiry/re-authentication.
 *
 * Features:
 * - Periodically validates session with backend
 * - Warns user before session expires
 * - Automatically re-authenticates with captive portal if needed
 * - Dispatches sessionExpired when session ends
 */
function useAutoReconnect() {
  const dispatch = useAppDispatch();
  const {
    isActive,
    sessionToken,
    expiryTime,
    connectedHotspot,
    durationMinutes,
  } = useAppSelector((state) => state.connection);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !sessionToken || !expiryTime) {
      // Clear interval if not connected
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      warnedRef.current = false;
      return;
    }

    const checkSession = async () => {
      const now = Date.now();
      const timeRemaining = expiryTime - now;

      // Session expired
      if (timeRemaining <= 0) {
        console.log("Session expired - disconnecting");
        dispatch(sessionExpired());
        return;
      }

      // Warn before expiry
      if (timeRemaining <= WARNING_THRESHOLD_MS && !warnedRef.current) {
        warnedRef.current = true;
        const minutesLeft = Math.ceil(timeRemaining / 60000);
        console.log(`Session expiring in ${minutesLeft} minute(s)`);
        // Could trigger a notification here
      }

      // Validate with backend periodically
      try {
        const isValid = await validateSession(sessionToken);
        if (!isValid) {
          console.log(
            "Session invalid according to backend - attempting re-auth"
          );

          // Try to re-authenticate with the edge device
          if (connectedHotspot) {
            const authResult = await authenticateWithCaptivePortal(
              sessionToken
            );
            if (!authResult.success) {
              console.log("Re-auth failed - session may be revoked");
              dispatch(sessionExpired());
            }
          }
        }
      } catch (error) {
        console.error("Session validation error:", error);
        // Don't disconnect on network errors - might be temporary
      }
    };

    // Run check immediately
    checkSession();

    // Set up interval
    intervalRef.current = setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, sessionToken, expiryTime, connectedHotspot, dispatch]);

  /**
   * Manually extend the session.
   * This would typically be called after purchasing additional time.
   */
  const extendSessionManually = async (additionalMinutes: number) => {
    if (!connectedHotspot || !sessionToken) return false;

    try {
      const session = await createSession(
        connectedHotspot.id,
        durationMinutes + additionalMinutes
      );

      dispatch(
        updateSessionToken({
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt,
        })
      );

      // Re-authenticate with new token
      await authenticateWithCaptivePortal(session.sessionToken);

      warnedRef.current = false;
      return true;
    } catch (error) {
      console.error("Failed to extend session:", error);
      return false;
    }
  };

  return { extendSessionManually };
}

export default useAutoReconnect;
