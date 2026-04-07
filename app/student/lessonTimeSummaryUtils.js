"use client";

import { useEffect, useState } from "react";
import {
  reservationEndTimestamp,
  isReservationCountingAsReserved,
  sumReservedMinutesFromReservations,
} from "../../lib/student/reservationMinutesShared.js";

export { reservationEndTimestamp, isReservationCountingAsReserved, sumReservedMinutesFromReservations };

export function useStudentReservedMinutes() {
  const [minutes, setMinutes] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/student/reservations?pageSize=500");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          setMinutes(0);
          return;
        }
        setMinutes(sumReservedMinutesFromReservations(data.reservations || []));
      } catch {
        if (!cancelled) setMinutes(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return minutes;
}
