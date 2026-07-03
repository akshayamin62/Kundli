"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MatchResponse, MatchKoot, MatchPersonRequest, MatchRequest, ChartResponse } from "@/types/chart";
import ChartWheel from "@/components/ChartWheel";
import { type Lang, SIGN_NAMES, NAKSHATRA_NAMES, PLANET_NAMES, SIGN_LORDS } from "@/lib/translations";
import { downloadMatchReport } from "@/lib/reportGenerator";
import FormModal from "@/components/FormModal";
import MatchForm from "@/components/MatchForm";
import { saveMatchRequest, matchRequestFromResult, loadStoredMatchRequest } from "@/lib/editPrefill";
import { vargaRequestForPerson } from "@/lib/matchVargaRequest";
import { resolveMatchHistoryId, setMatchHistoryId, getMatchHistoryId } from "@/lib/historySession";
import { fetchHistoryItem, calculateVarga } from "@/services/api";
import AppLogo from "@/components/AppLogo";
import { getMoonJanmaFromChart, toMoonChart } from "@/lib/chartTransforms";
import { formatNakshatraWithCharan } from "@/lib/nakshatra";
import {
  ASHTAKOOT_LABELS,
  translateVarna,
  translateVasya,
  translateYoni,
  translateGana,
  translateNadi,
} from "@/lib/ashtakootAttributes";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const M: Record<Lang, Record<string, string>> = {
  en: {
    title: "Kundli Milan", sub: "Ashtakoot Guna Matching",
    back: "New Match", nak: "Nakshatra", nakLord: "Nak. Lord", moonSign: "Moon Sign",
    koot: "Koot", score: "Score", total: "Total",
    mangalTitle: "Mangal Dosha (Kuja Dosha)",
    mangalYes: "Mangal Dosha present", mangalNo: "No Mangal Dosha",
    mangalOff: "Dosha cancelled \u2014 both partners have Mangal Dosha.",
    charts: "Birth Charts",
    chartBirth: "Birth Chart",
    chartMoon: "Moon Chart",
    chartD9: "D9 Chart",
    footer: "Swiss Ephemeris \u00B7 Lahiri Ayanamsa \u00B7 Ashtakoot Parashari System",
    detail: "Detail",
    dob: "Date of Birth", tob: "Time of Birth", place: "Place",
    rasi: "Janma Rasi", rasiLord: "Rasi Lord", janmaNak: "Janma Nakshatra",
    dosha: "Mangal Dosha",
    sadsatkutTitle: "Sadsatkut Kostkaani",
    sadsatkutSub: "Six-fold sign compatibility groups (based on zodiac house distance)",
    distanceLabel: "Rashi distance",
    priti: "Priti Shadashtak", mrityu: "Mrityu Shadashtak",
    shubhDva: "Shubh Dvadashatak", ashubhDva: "Ashubh Dvadashatak",
    shubhNav: "Shubh Navpancham", nashtanNav: "Nashtan Navpancham",
    pritiDesc: "mutual love & attraction",
    mrityuDesc: "tension & obstacles",
    shubhDvaDesc: "prosperity & support",
    ashubhDvaDesc: "financial stress",
    shubhNavDesc: "fortune & children",
    nashtanNavDesc: "misfortune",
    present: "Present", absent: "Absent",
  },
  hi: {
    title: "\u0915\u0941\u0902\u0921\u0932\u0940 \u092E\u093F\u0932\u093E\u0928",
    sub: "\u0905\u0937\u094D\u0920\u0915\u0942\u0920 \u0917\u0941\u0923 \u092E\u093F\u0932\u093E\u0928",
    back: "\u0928\u092F\u093E \u092E\u093F\u0932\u093E\u0928",
    nak: "\u0928\u0915\u094D\u0937\u0924\u094D\u0930", nakLord: "\u0928\u0915\u094D\u0937\u0924\u094D\u0930\u092A\u0924\u093F",
    moonSign: "\u091A\u0902\u0926\u094D\u0930 \u0930\u093E\u0936\u093F",
    koot: "\u0915\u0942\u0920", score: "\u0905\u0902\u0915", total: "\u0915\u0941\u0932",
    mangalTitle: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937 (\u0915\u0941\u091C \u0926\u094B\u0937)",
    mangalYes: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937 \u0939\u0948",
    mangalNo: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937 \u0928\u0939\u0940\u0902",
    mangalOff: "\u0926\u094B\u0928\u094B\u0902 \u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u2014 \u0926\u094B\u0937 \u0928\u093F\u0930\u0938\u094D\u0924\u0964",
    charts: "\u091C\u0928\u094D\u092E \u0915\u0941\u0902\u0921\u0932\u0940",
    chartBirth: "\u091C\u0928\u094D\u092E \u0915\u0941\u0902\u0921\u0932\u0940",
    chartMoon: "\u091A\u0902\u0926\u094D\u0930 \u0915\u0941\u0902\u0921\u0932\u0940",
    chartD9: "D9 \u0915\u0941\u0902\u0921\u0932\u0940",
    footer: "\u0938\u094D\u0935\u093F\u0938 \u090F\u092B\u0947\u092E\u0947\u0930\u093F\u0938 \u00B7 \u0932\u093E\u0939\u093F\u0930\u0940 \u0905\u092F\u0928\u093E\u0902\u0936 \u00B7 \u0905\u0937\u094D\u0920\u0915\u0942\u0920 \u092A\u093E\u0930\u093E\u0936\u0930\u0940 \u092A\u0926\u094D\u0927\u0924\u093F",
    detail: "\u0935\u093F\u0935\u0930\u0923",
    dob: "\u091C\u0928\u094D\u092E \u0924\u093F\u0925\u093F", tob: "\u091C\u0928\u094D\u092E \u0938\u092E\u092F", place: "\u0938\u094D\u0925\u093E\u0928",
    rasi: "\u091C\u0928\u094D\u092E \u0930\u093E\u0936\u093F", rasiLord: "\u0930\u093E\u0936\u093F \u0938\u094D\u0935\u093E\u092E\u0940", janmaNak: "\u091C\u0928\u094D\u092E \u0928\u0915\u094D\u0937\u0924\u094D\u0930",
    dosha: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937",
    sadsatkutTitle: "\u0938\u0926\u0938\u0924\u094D\u0915\u0942\u091F\u0915\u094B\u0937\u094D\u0920\u0915\u093E\u0928\u093F",
    sadsatkutSub: "\u0937\u091F\u094D \u0930\u093E\u0936\u093F \u092F\u0941\u0917\u0932 \u0935\u0930\u094D\u0917 (\u0930\u093E\u0936\u093F \u0918\u0930 \u0905\u0902\u0924\u0930 \u0906\u0927\u093E\u0930\u093F\u0924)",
    distanceLabel: "\u0930\u093E\u0936\u093F \u0905\u0902\u0924\u0930",
    priti: "\u092A\u094D\u0930\u0940\u0924\u093F \u0937\u0921\u0937\u094D\u091F\u0915", mrityu: "\u092E\u0943\u0924\u094D\u092F\u0941 \u0937\u0921\u0937\u094D\u091F\u0915",
    shubhDva: "\u0936\u0941\u092D \u0926\u094D\u0935\u093E\u0926\u0936\u0915", ashubhDva: "\u0905\u0936\u0941\u092D \u0926\u094D\u0935\u093E\u0926\u0936\u0915",
    shubhNav: "\u0936\u0941\u092D \u0928\u0935\u092A\u0902\u091A\u092E", nashtanNav: "\u0928\u0937\u094D\u091F \u0928\u0935\u092A\u0902\u091A\u092E",
    pritiDesc: "\u092A\u094D\u0930\u0947\u092E \u0935 \u0906\u0915\u0930\u094D\u0937\u0923",
    mrityuDesc: "\u0924\u0928\u093E\u0935 \u0935 \u0905\u0935\u0930\u094B\u0927",
    shubhDvaDesc: "\u0938\u092E\u0943\u0926\u094D\u0927\u093F",
    ashubhDvaDesc: "\u0906\u0930\u094D\u0925\u093F\u0915 \u0924\u0928\u093E\u0935",
    shubhNavDesc: "\u092D\u093E\u0917\u094D\u092F \u0935 \u0938\u0902\u0924\u093E\u0928",
    nashtanNavDesc: "\u0926\u0941\u0930\u094D\u092D\u093E\u0917\u094D\u092F",
    present: "\u0909\u092A\u0938\u094D\u0925\u093F\u0924", absent: "\u0905\u0928\u0941\u092A\u0938\u094D\u0925\u093F\u0924",
  },
  gu: {
    title: "\u0A95\u0AC1\u0A82\u0AA1\u0AB3\u0AC0 \u0AAE\u0ABF\u0AB3\u0ABE\u0AA8",
    sub: "\u0A85\u0AB7\u0ACD\u0A9F\u0A95\u0AC2\u0A9F \u0A97\u0AC1\u0AA3 \u0AAE\u0ABF\u0AB3\u0ABE\u0AA8",
    back: "\u0AA8\u0AB5\u0ACB \u0AAE\u0ABF\u0AB3\u0ABE\u0AA8",
    nak: "\u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0", nakLord: "\u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0AAA\u0AA4\u0ABF",
    moonSign: "\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AB0\u0ABE\u0AB6\u0ABF",
    koot: "\u0A95\u0AC2\u0A9F", score: "\u0A97\u0AC1\u0AA3", total: "\u0A95\u0AC1\u0AB2",
    mangalTitle: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7 (\u0A95\u0AC1\u0A9C \u0AA6\u0ACB\u0AB7)",
    mangalYes: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7 \u0A9B\u0AC7",
    mangalNo: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7 \u0AA8\u0AA5\u0AC0",
    mangalOff: "\u0AAC\u0A82\u0AA8\u0AC7 \u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u2014 \u0AA6\u0ACB\u0AB7 \u0AB0\u0AA6.",
    charts: "\u0A9C\u0AA8\u0ACD\u0AAE \u0A95\u0AC1\u0A82\u0AA1\u0AB3\u0AC0",
    chartBirth: "\u0A9C\u0AA8\u0ACD\u0AAE \u0A95\u0AC1\u0A82\u0AA1\u0AB3\u0AC0",
    chartMoon: "\u0A9A\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0 \u0A95\u0AC1\u0A82\u0AA1\u0AB3\u0AC0",
    chartD9: "D9 \u0A95\u0AC1\u0A82\u0AA1\u0AB3\u0AC0",
    footer: "\u0AB8\u0ACD\u0AB5\u0ABF\u0AB8 \u0A87\u0AAB\u0AC7\u0AAE\u0AC7\u0AB0\u0ABF\u0AB8 \u00B7 \u0AB2\u0ABE\u0AB9\u0ABF\u0AB0\u0AC0 \u0A85\u0AAF\u0AA8\u0ABE\u0A82\u0AB6 \u00B7 \u0A85\u0AB7\u0ACD\u0A9F\u0A95\u0AC2\u0A9F \u0AAA\u0ABE\u0AB0\u0ABE\u0AB6\u0AB0\u0AC0 \u0AAA\u0AA6\u0ACD\u0AA7\u0AA4\u0ABF",
    detail: "\u0AB5\u0ABF\u0A97\u0AA4",
    dob: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AA4\u0ABE\u0AB0\u0ABF\u0A96", tob: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AB8\u0AAE\u0AAF", place: "\u0AB8\u0ACD\u0AA5\u0AB3",
    rasi: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AB0\u0ABE\u0AB6\u0ABF", rasiLord: "\u0AB0\u0ABE\u0AB6\u0ABF \u0AB8\u0ACD\u0AB5\u0ABE\u0AAE\u0AC0", janmaNak: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0",
    dosha: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7",
    sadsatkutTitle: "\u0AB8\u0AA6\u0AB8\u0AA4\u0ACD\u0A95\u0AC2\u0A9F\u0A95\u0ACB\u0AB7\u0ACD\u0AA0\u0A95\u0ABE\u0AA8\u0ABF",
    sadsatkutSub: "\u0AB7\u0A9F\u0ACD \u0AB0\u0ABE\u0AB6\u0ABF \u0AAF\u0AC1\u0A97\u0AB3 \u0AB5\u0AB0\u0ACD\u0A97 (\u0AB0\u0ABE\u0AB6\u0ABF \u0A98\u0AB0 \u0A85\u0A82\u0AA4\u0AB0 \u0A86\u0AA7\u0ABE\u0AB0\u0ABF\u0AA4)",
    distanceLabel: "\u0AB0\u0ABE\u0AB6\u0ABF \u0A85\u0A82\u0AA4\u0AB0",
    priti: "\u0AAA\u0ACD\u0AB0\u0AC0\u0AA4\u0ABF \u0AB7\u0AA1\u0AB7\u0ACD\u0A9F\u0A95", mrityu: "\u0AAE\u0AC3\u0AA4\u0ACD\u0AAF\u0AC1 \u0AB7\u0AA1\u0AB7\u0ACD\u0A9F\u0A95",
    shubhDva: "\u0AB6\u0AC1\u0AAD \u0AA6\u0ACD\u0AB5\u0ABE\u0AA6\u0AB6\u0A95", ashubhDva: "\u0A85\u0AB6\u0AC1\u0AAD \u0AA6\u0ACD\u0AB5\u0ABE\u0AA6\u0AB6\u0A95",
    shubhNav: "\u0AB6\u0AC1\u0AAD \u0AA8\u0AB5\u0AAA\u0A82\u0A9A\u0AAE", nashtanNav: "\u0AA8\u0AB7\u0ACD\u0A9F \u0AA8\u0AB5\u0AAA\u0A82\u0A9A\u0AAE",
    pritiDesc: "\u0AAA\u0ACD\u0AB0\u0AC7\u0AAE \u0A85\u0AA8\u0AC7 \u0A86\u0A95\u0AB0\u0ACD\u0AB7\u0AA3",
    mrityuDesc: "\u0AA4\u0AA3\u0ABE\u0AB5 \u0A85\u0AA8\u0AC7 \u0A85\u0AB5\u0AB0\u0ACB\u0AA7",
    shubhDvaDesc: "\u0AB8\u0AAE\u0AC3\u0AA6\u0ACD\u0AA7\u0ABF \u0A85\u0AA8\u0AC7 \u0AB8\u0AB9\u0ABE\u0AB0\u0ACB",
    ashubhDvaDesc: "\u0A86\u0AB0\u0ACD\u0AA5\u0ABF\u0A95 \u0AA4\u0AA3\u0ABE\u0AB5",
    shubhNavDesc: "\u0AAD\u0ABE\u0A97\u0ACD\u0AAF \u0A85\u0AA8\u0AC7 \u0AB8\u0A82\u0AA4\u0ABE\u0AA8",
    nashtanNavDesc: "\u0AA6\u0AC1\u0AB0\u0ACD\u0AAD\u0ABE\u0A97\u0ACD\u0AAF",
    present: "\u0AB9\u0ABE\u0A9C\u0AB0", absent: "\u0A97\u0AC7\u0AB0\u0AB9\u0ABE\u0A9C\u0AB0",
  },
};

const KOOT_NAMES: Record<Lang, Record<string, string>> = {
  en:  { Varna:"Varna", Vasya:"Vasya", Tara:"Tara", Yoni:"Yoni", "Graha Maitri":"Graha Maitri", Gana:"Gana", Bhakut:"Bhakut", Nadi:"Nadi" },
  hi:  { Varna:"\u0935\u0930\u094D\u0923", Vasya:"\u0935\u0936\u094D\u092F", Tara:"\u0924\u093E\u0930\u093E", Yoni:"\u092F\u094B\u0928\u093F", "Graha Maitri":"\u0917\u094D\u0930\u0939 \u092E\u0948\u0924\u094D\u0930\u0940", Gana:"\u0917\u0923", Bhakut:"\u092D\u0915\u0942\u0920", Nadi:"\u0928\u093E\u0921\u093C\u0940" },
  gu:  { Varna:"\u0AB5\u0AB0\u0ACD\u0AA3", Vasya:"\u0AB5\u0AB6\u0ACD\u0AAF", Tara:"\u0AA4\u0ABE\u0AB0\u0ABE", Yoni:"\u0AAF\u0ACB\u0AA8\u0AC0", "Graha Maitri":"\u0A97\u0ACD\u0AB0\u0AB9 \u0AAE\u0AC8\u0AA4\u0ACD\u0AB0\u0AC0", Gana:"\u0A97\u0AA3", Bhakut:"\u0AAD\u0A95\u0AC2\u0A9F", Nadi:"\u0AA8\u0ABE\u0AA1\u0AC0" },
};

const KOOT_DESC: Record<Lang, Record<string, string>> = {
  en:  { Varna:"Spiritual dev.", Vasya:"Mutual attraction", Tara:"Birth star / destiny", Yoni:"Biological compat.", "Graha Maitri":"Moon lord friendship", Gana:"Temperament", Bhakut:"Moon sign pair", Nadi:"Physical constitution" },
  hi:  { Varna:"\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0935\u093F\u0915\u093E\u0938", Vasya:"\u0906\u0915\u0930\u094D\u0937\u0923", Tara:"\u091C\u0928\u094D\u092E \u0928\u0915\u094D\u0937\u0924\u094D\u0930", Yoni:"\u091C\u0948\u0935\u093F\u0915 \u0905\u0928\u0941\u0915\u0942\u0932\u0924\u093E", "Graha Maitri":"\u091A\u0902\u0926\u094D\u0930 \u0930\u093E\u0936\u093F\u092A\u0924\u093F", Gana:"\u0938\u094D\u0935\u092D\u093E\u0935", Bhakut:"\u091A\u0902\u0926\u094D\u0930 \u0930\u093E\u0936\u093F \u092F\u0941\u0917\u0932", Nadi:"\u0936\u093E\u0930\u0940\u0930\u093F\u0915 \u0938\u0902\u0930\u091A\u0928\u093E" },
  gu:  { Varna:"\u0A86\u0AA7\u0ACD\u0AAF\u0ABE\u0AA4\u0ACD\u0AAE\u0ABF\u0A95 \u0AB5\u0ABF\u0A95\u0ABE\u0AB8", Vasya:"\u0A86\u0A95\u0AB0\u0ACD\u0AB7\u0AA3", Tara:"\u0A9C\u0AA8\u0ACD\u0AAE \u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0", Yoni:"\u0A9C\u0AC8\u0AB5\u0ABF\u0A95 \u0A85\u0AA8\u0AC1\u0A95\u0AC2\u0AB3\u0AA4\u0ABE", "Graha Maitri":"\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AB0\u0ABE\u0AB6\u0ABF \u0AB8\u0ACD\u0AB5\u0ABE\u0AAE\u0AC0", Gana:"\u0AB8\u0ACD\u0AB5\u0AAD\u0ABE\u0AB5", Bhakut:"\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AB0\u0ABE\u0AB6\u0ABF \u0AAF\u0AC1\u0A97", Nadi:"\u0AB6\u0ABE\u0AB0\u0AC0\u0AB0\u0ABF\u0A95 \u0AAC\u0A82\u0AA7\u0ABE\u0AB0\u0AA3" },
};

// ─── Date / time formatters ───────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatDate(d: string) {
  if (!d) return "\u2014";
  const parts = d.split("-");
  if (parts.length < 3) return d;
  const [y, m, dd] = parts;
  return `${y} ${MONTHS[parseInt(m) - 1] ?? m} ${dd}`;
}
function formatTime(t: string) {
  if (!t) return "\u2014";
  const [hStr, mStr = "00"] = t.split(":");
  const h = parseInt(hStr);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
}

// ─── Translation helpers ───────────────────────────────────────────────────────
function tSign(n: string, l: Lang) { const i = SIGN_NAMES.en.indexOf(n); return i >= 0 ? SIGN_NAMES[l][i] : n; }
function tNak(n: string, l: Lang)  { const i = NAKSHATRA_NAMES.en.indexOf(n); return i >= 0 ? NAKSHATRA_NAMES[l][i] : n; }
function tPlanet(n: string, l: Lang) { return PLANET_NAMES[l][n] ?? n; }
function tValue(val: string, l: Lang) {
  if (!val) return val;
  const s = tSign(val, l);   if (s !== val) return s;
  const n = tNak(val, l);    if (n !== val) return n;
  const p = tPlanet(val, l); if (p !== val) return p;
  const GANA: Record<Lang, Record<string,string>> = {
    en: {Deva:"Deva",Manav:"Manav",Rakshasa:"Rakshasa"},
    hi: {Deva:"\u0926\u0947\u0935",Manav:"\u092E\u093E\u0928\u0935",Rakshasa:"\u0930\u093E\u0915\u094D\u0937\u0938"},
    gu: {Deva:"\u0AA6\u0AC7\u0AB5",Manav:"\u0AAE\u0ABE\u0AA8\u0AB5",Rakshasa:"\u0AB0\u0ABE\u0A95\u0ACD\u0AB7\u0AB8"},
  };
  const NADI: Record<Lang, Record<string,string>> = {
    en: {Adi:"Adi",Madhya:"Madhya",Antya:"Antya"},
    hi: {Adi:"\u0906\u0926\u093F",Madhya:"\u092E\u0927\u094D\u092F",Antya:"\u0905\u0902\u0924\u094D\u092F"},
    gu: {Adi:"\u0A86\u0AA6\u0ABF",Madhya:"\u0AAE\u0AA7\u0ACD\u0AAF",Antya:"\u0A85\u0A82\u0AA4\u0ACD\u0AAF"},
  };
  const VASYA: Record<Lang, Record<string,string>> = {
    en: {Chatushpada:"Chatushpada",Manava:"Manava",Jalchar:"Jalchar",Keeta:"Keeta",Vanachara:"Vanachara"},
    hi: {Chatushpada:"\u091A\u0924\u0941\u0937\u094D\u092A\u093E\u0926",Manava:"\u092E\u093E\u0928\u0935",Jalchar:"\u091C\u0932\u091A\u0930",Keeta:"\u0915\u0940\u091F",Vanachara:"\u0935\u0928\u091A\u0930"},
    gu: {Chatushpada:"\u0A9A\u0AA4\u0AC1\u0AB7\u0ACD\u0AAA\u0ABE\u0AA6",Manava:"\u0AAE\u0ABE\u0AA8\u0AB5",Jalchar:"\u0A9C\u0AB3\u0A9A\u0AB0",Keeta:"\u0A95\u0AC0\u0A9F",Vanachara:"\u0AB5\u0AA8\u0A9A\u0AB0"},
  };
  const VARNA: Record<Lang, Record<string,string>> = {
    en: {Brahmin:"Brahmin",Kshatriya:"Kshatriya",Vaishya:"Vaishya",Shudra:"Shudra"},
    hi: {Brahmin:"\u092C\u094D\u0930\u093E\u0939\u094D\u092E\u0923",Kshatriya:"\u0915\u094D\u0937\u0924\u094D\u0930\u093F\u092F",Vaishya:"\u0935\u0948\u0936\u094D\u092F",Shudra:"\u0936\u0942\u0926\u094D\u0930"},
    gu: {Brahmin:"\u0AAC\u0ACD\u0AB0\u0ABE\u0AB9\u0ACD\u0AAE\u0AA3",Kshatriya:"\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF",Vaishya:"\u0AB5\u0AC8\u0AB6\u0ACD\u0AAF",Shudra:"\u0AB6\u0AC2\u0AA6\u0ACD\u0AB0"},
  };
  const YONI: Record<Lang, Record<string,string>> = {
    en: {Horse:"Horse",Elephant:"Elephant",Goat:"Goat",Serpent:"Serpent",Dog:"Dog",Cat:"Cat",Rat:"Rat",Cow:"Cow",Buffalo:"Buffalo",Tiger:"Tiger",Hare:"Hare",Monkey:"Monkey",Mongoose:"Mongoose",Lion:"Lion"},
    hi: {Horse:"\u0905\u0936\u094D\u0935",Elephant:"\u0917\u091C",Goat:"\u092E\u0947\u0937",Serpent:"\u0938\u0930\u094D\u092A",Dog:"\u0936\u094D\u0935\u093E\u0928",Cat:"\u092E\u093E\u0930\u094D\u091C\u093E\u0930",Rat:"\u092E\u0942\u0937\u0915",Cow:"\u0917\u094C",Buffalo:"\u092E\u0939\u093F\u0937",Tiger:"\u0935\u094D\u092F\u093E\u0918\u094D\u0930",Hare:"\u092E\u0943\u0917",Monkey:"\u0935\u093E\u0928\u0930",Mongoose:"\u0928\u0915\u0941\u0932",Lion:"\u0938\u093F\u0902\u0939"},
    gu: {Horse:"\u0A05\u0AB6\u0ACD\u0AB5",Elephant:"\u0A17\u0A9C",Goat:"\u0AAE\u0AC7\u0AB7",Serpent:"\u0AB8\u0AB0\u0ACD\u0AAA",Dog:"\u0AB6\u0ACD\u0AB5\u0ABE\u0AA8",Cat:"\u0AAE\u0ABE\u0AB0\u0ACD\u0A9C\u0ABE\u0AB0",Rat:"\u0AAE\u0AC2\u0AB7\u0A95",Cow:"\u0A17\u0ACB",Buffalo:"\u0AAE\u0AB9\u0ABF\u0AB7",Tiger:"\u0AB5\u0ACD\u0AAF\u0ABE\u0A98\u0ACD\u0AB0",Hare:"\u0AAE\u0AC3\u0A97",Monkey:"\u0AB5\u0ABE\u0AA8\u0AB0",Mongoose:"\u0AA8\u0A95\u0AC1\u0AB2",Lion:"\u0AB8\u0ABF\u0A82\u0AB9"},
  };
  return GANA[l][val] ?? NADI[l][val] ?? VASYA[l][val] ?? VARNA[l][val] ?? YONI[l][val] ?? val;
}

// ─── Grade helpers ─────────────────────────────────────────────────────────────
function gradeTxt(g: string) {
  const m: Record<string,string> = {
    Excellent:"text-emerald-600","Very Good":"text-green-600",
    Good:"text-lime-600",Average:"text-amber-600","Below Average":"text-orange-600"
  };
  return m[g] ?? "text-red-600";
}
function gradePill(g: string) {
  const m: Record<string,string> = {
    Excellent:"bg-emerald-50 border-emerald-200 text-emerald-700",
    "Very Good":"bg-green-50 border-green-200 text-green-700",
    Good:"bg-lime-50 border-lime-200 text-lime-700",
    Average:"bg-amber-50 border-amber-200 text-amber-700",
    "Below Average":"bg-orange-50 border-orange-200 text-orange-700"
  };
  return m[g] ?? "bg-red-50 border-red-200 text-red-700";
}
function gradeBarColor(pct: number) {
  if (pct >= 83) return "#10b981";
  if (pct >= 67) return "#22c55e";
  if (pct >= 58) return "#84cc16";
  if (pct >= 50) return "#f59e0b";
  if (pct >= 33) return "#f97316";
  return "#ef4444";
}

// ─── Score Circle (SVG gauge) — light theme ───────────────────────────────────
function ScoreCircle({ score, max, pct }: { score: number; max: number; pct: number }) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / max);
  const color = gradeBarColor(pct);
  const stars = Math.round((score / max) * 5);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="148" height="148" viewBox="0 0 148 148">
          <circle cx="74" cy="74" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle
            cx="74" cy="74" r={r} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 74 74)"
            style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
          />
          <text x="74" y="68" textAnchor="middle" fill="#0f172a" fontSize="34" fontWeight="900" fontFamily="system-ui">{score}</text>
          <text x="74" y="87" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="system-ui">/ {max}</text>
        </svg>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= stars ? "#f59e0b" : "#e2e8f0"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    </div>
  );
}

// ─── Legend Button ────────────────────────────────────────────────────────────
function LegendButton() {
  return (
    <div className="relative group shrink-0">
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-700 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Legend
      </button>
      <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 p-4 w-72 hidden group-hover:block pointer-events-none">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Chart Legend</p>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Graha Dignity</p>
        <div className="space-y-2 mb-4">
          {[
            { sym: "++", cls: "text-emerald-600", label: "Swakshetra – own sign" },
            { sym: "+", cls: "text-blue-600", label: "Uchcha – exalted" },
            { sym: "↓", cls: "text-red-500", label: "Neecha – debilitated" },
          ].map(({ sym, cls, label }) => (
            <div key={sym} className="flex items-center gap-2.5">
              <span className={`text-sm font-bold w-5 ${cls}`}>{sym}</span>
              <span className="text-sm text-slate-600">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2.5">
          <svg width="28" height="10" viewBox="0 0 28 10">
                <line x1="3" y1="5" x2="11" y2="5" stroke={"red"} strokeWidth="1" strokeDasharray="2 0"/>
              </svg>
            <span className="text-sm text-slate-600">Retrograde motion</span>
          </div>
        </div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Vedic Drishti (hover planet)</p>
        <div className="space-y-2">
          {[
            { color: "#111827", label: "Ek Paad" },
            { color: "#2563eb", label: "Dwi Paad" },
            { color: "#16a34a", label: "Tri Paad" },
            { color: "#dc2626", label: "Sampurna" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <svg width="28" height="10" viewBox="0 0 28 10">
                <line x1="0" y1="5" x2="28" y2="5" stroke={color} strokeWidth="2" strokeDasharray="5 3"/>
              </svg>
              <span className="text-sm text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Koot card ────────────────────────────────────────────────────────────────
function KootCard({ k, lang }: { k: MatchKoot; lang: Lang }) {
  const pct = k.score / k.max_score;
  const barColor = pct >= 1 ? "#10b981" : pct >= 0.5 ? "#f59e0b" : "#ef4444";
  const scoreCls = pct >= 1
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : pct >= 0.5
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-slate-200 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-slate-800 text-sm font-bold leading-tight">{KOOT_NAMES[lang][k.name] ?? k.name}</p>
          <p className="text-slate-400 text-xs mt-0.5 leading-tight">{KOOT_DESC[lang][k.name] ?? ""}</p>
        </div>
        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg border flex-shrink-0 ${scoreCls}`}>
          {k.score}/{k.max_score}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-lg border border-indigo-100 font-semibold">
          {tValue(k.boy_value, lang)}
        </span>
        <span className="text-slate-300 text-xs font-medium">vs</span>
        <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-lg border border-rose-100 font-semibold">
          {tValue(k.girl_value, lang)}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MatchResultPage() {
  const router = useRouter();
  const [data, setData] = useState<MatchResponse | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [editOpen, setEditOpen] = useState(false);
  const [editHistoryId, setEditHistoryId] = useState<string | null>(null);
  const [editBoy, setEditBoy] = useState<MatchPersonRequest | null>(null);
  const [editGirl, setEditGirl] = useState<MatchPersonRequest | null>(null);
  const [resolvingEdit, setResolvingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  type MatchChartView = "birth" | "moon" | "d9";
  const [chartView, setChartView] = useState<MatchChartView>("birth");
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [boyD9, setBoyD9] = useState<ChartResponse | null>(null);
  const [girlD9, setGirlD9] = useState<ChartResponse | null>(null);
  const [d9Loading, setD9Loading] = useState(false);
  const [d9Error, setD9Error] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const sl = localStorage.getItem("jk_lang") as Lang | null;
    if (sl) setLang(sl);
    const raw = sessionStorage.getItem("matchResult");
    if (!raw) { router.replace("/match"); return; }
    try { setData(JSON.parse(raw)); } catch { router.replace("/match"); }
  }, [router]);

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("jk_lang", l); } catch { /* ignore */ }
  };

  const boyMoonChart = useMemo(
    () => (data ? toMoonChart(data.boy_chart) : null),
    [data],
  );
  const girlMoonChart = useMemo(
    () => (data ? toMoonChart(data.girl_chart) : null),
    [data],
  );
  const boyJanma = useMemo(
    () => (data ? getMoonJanmaFromChart(data.boy_chart) : null),
    [data],
  );
  const girlJanma = useMemo(
    () => (data ? getMoonJanmaFromChart(data.girl_chart) : null),
    [data],
  );

  const loadD9Charts = useCallback(async () => {
    if (!data) return;
    if (boyD9 && girlD9) return;
    setD9Loading(true);
    setD9Error(null);
    try {
      const stored = loadStoredMatchRequest();
      const req = stored ?? matchRequestFromResult(data);
      const [b, g] = await Promise.all([
        calculateVarga(vargaRequestForPerson(data.boy_chart, req.boy, 9)),
        calculateVarga(vargaRequestForPerson(data.girl_chart, req.girl, 9)),
      ]);
      setBoyD9(b);
      setGirlD9(g);
    } catch (err) {
      setD9Error(err instanceof Error ? err.message : "Failed to load D9 charts");
      setBoyD9(null);
      setGirlD9(null);
    } finally {
      setD9Loading(false);
    }
  }, [data, boyD9, girlD9]);

  useEffect(() => {
    if (chartView === "d9") void loadD9Charts();
  }, [chartView, loadD9Charts]);

  const chartViewLabel = (view: MatchChartView) => {
    const labels = M[lang];
    if (view === "birth") return labels.chartBirth;
    if (view === "moon") return labels.chartMoon;
    return labels.chartD9;
  };

  const displayCharts = useMemo(() => {
    if (!data) return null;
    if (chartView === "birth") {
      return { boy: data.boy_chart, girl: data.girl_chart };
    }
    if (chartView === "moon" && boyMoonChart && girlMoonChart) {
      return { boy: boyMoonChart, girl: girlMoonChart };
    }
    if (chartView === "d9" && boyD9 && girlD9) {
      return { boy: boyD9, girl: girlD9 };
    }
    return null;
  }, [data, chartView, boyMoonChart, girlMoonChart, boyD9, girlD9]);

  const openEditModal = async () => {
    if (!data) return;
    setEditError(null);
    setResolvingEdit(true);
    try {
      const req = matchRequestFromResult(data);
      const id = getMatchHistoryId() ?? (await resolveMatchHistoryId(req));
      if (!id) {
        setEditError("No saved history record found for this match.");
        return;
      }
      const full = await fetchHistoryItem(id);
      const storedInput = full.input as MatchRequest | undefined;
      const baseReq = storedInput ?? req;
      setEditHistoryId(id);
      setEditBoy(baseReq.boy);
      setEditGirl(baseReq.girl);
      setEditOpen(true);
    } catch {
      setEditError("Unable to open edit form for this match.");
    } finally {
      setResolvingEdit(false);
    }
  };

  const handleEditSaved = (result: MatchResponse) => {
    if (result.history_id) setMatchHistoryId(result.history_id);
    else if (editHistoryId) setMatchHistoryId(editHistoryId);
    setData(result);
    setBoyD9(null);
    setGirlD9(null);
    setD9Error(null);
    sessionStorage.setItem("matchResult", JSON.stringify(result));
    saveMatchRequest(matchRequestFromResult(result));
    setEditOpen(false);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading\u2026</p>
        </div>
      </div>
    );
  }

  const t = M[lang];
  const pct = data.percentage;
  const boyInit = (data.boy_name || "B")[0].toUpperCase();
  const girlInit = (data.girl_name || "G")[0].toUpperCase();
  const barColor = gradeBarColor(pct);

  return (
    <div className="bg-white min-h-screen lg:h-screen lg:flex lg:flex-col lg:overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="w-full px-5 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AppLogo href="/" height={44} />
            <span className="text-slate-200 text-xl">|</span>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-base transition-colors font-semibold"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t.back}
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <LegendButton />
            <button
              onClick={() => openEditModal()}
              disabled={resolvingEdit}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
            <button
              onClick={async () => {
                if (!data) return;
                setReportLoading(true);
                try {
                  const stored = loadStoredMatchRequest();
                  await downloadMatchReport(data, stored ?? matchRequestFromResult(data));
                } finally {
                  setReportLoading(false);
                }
              }}
              disabled={reportLoading}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-indigo-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/>
              </svg>
              {reportLoading ? "Preparing…" : "Download"}
            </button>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              {(["en","hi","gu"] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === l ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हि" : "ગુ"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      

      {/* ── Main content ── */}
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:h-full">

          {/* ════ LEFT COLUMN ════ */}
          <div className="px-5 sm:px-7 py-6 lg:overflow-y-auto lg:h-full space-y-5">

            {/* ── Birth Details ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <h2 className="text-slate-800 font-bold text-base">Birth Details</h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-indigo-600 font-semibold">{data.boy_name || "Groom"}</span>
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-rose-600 font-semibold">{data.girl_name || "Bride"}</span>
                  </span>
                </div>
              </div>
              <table className="w-full">
                <tbody>
                  {[
                    { label: t.dob,      bv: formatDate(data.boy_chart.meta.birth_date),  gv: formatDate(data.girl_chart.meta.birth_date) },
                    { label: t.tob,      bv: formatTime(data.boy_chart.meta.birth_time),  gv: formatTime(data.girl_chart.meta.birth_time) },
                    { label: t.place,    bv: data.boy_chart.meta.birth_place,              gv: data.girl_chart.meta.birth_place },
                    { label: t.rasi,     bv: tSign(data.boy_moon_sign, lang),              gv: tSign(data.girl_moon_sign, lang) },
                    { label: t.rasiLord, bv: SIGN_LORDS[lang][data.boy_moon_sign] ?? "—", gv: SIGN_LORDS[lang][data.girl_moon_sign] ?? "—" },
                    { label: t.janmaNak, bv: boyJanma ? formatNakshatraWithCharan(boyJanma.nakshatra, boyJanma.nakshatra_charan, lang) : "—", gv: girlJanma ? formatNakshatraWithCharan(girlJanma.nakshatra, girlJanma.nakshatra_charan, lang) : "—" },
                    { label: t.nakLord,  bv: boyJanma ? tPlanet(boyJanma.nakshatra_lord, lang) : "—",       gv: girlJanma ? tPlanet(girlJanma.nakshatra_lord, lang) : "—" },
                    { label: ASHTAKOOT_LABELS[lang].varna, bv: boyJanma ? translateVarna(boyJanma.varna, lang) : "—", gv: girlJanma ? translateVarna(girlJanma.varna, lang) : "—" },
                    { label: ASHTAKOOT_LABELS[lang].vasya, bv: boyJanma ? translateVasya(boyJanma.vasya, lang) : "—", gv: girlJanma ? translateVasya(girlJanma.vasya, lang) : "—" },
                    { label: ASHTAKOOT_LABELS[lang].yoni,  bv: boyJanma ? translateYoni(boyJanma.yoni, lang) : "—",   gv: girlJanma ? translateYoni(girlJanma.yoni, lang) : "—" },
                    { label: ASHTAKOOT_LABELS[lang].gana,  bv: boyJanma ? translateGana(boyJanma.gana, lang) : "—",   gv: girlJanma ? translateGana(girlJanma.gana, lang) : "—" },
                    { label: ASHTAKOOT_LABELS[lang].nadi,  bv: boyJanma ? translateNadi(boyJanma.nadi, lang) : "—",   gv: girlJanma ? translateNadi(girlJanma.nadi, lang) : "—" },
                    { label: t.dosha,
                      bv: data.boy_mangal_dosha  ? <span className="text-red-600 font-semibold text-xs">⚠ {t.mangalYes}</span>  : <span className="text-emerald-600 font-semibold text-xs">✓ {t.mangalNo}</span>,
                      gv: data.girl_mangal_dosha ? <span className="text-red-600 font-semibold text-xs">⚠ {t.mangalYes}</span> : <span className="text-emerald-600 font-semibold text-xs">✓ {t.mangalNo}</span>,
                    },
                  ].map(({ label, bv, gv }, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/30 transition-colors`}>
                      <td className="py-2.5 px-5 text-slate-500 text-sm w-[35%] font-medium">{label}</td>
                      <td className="py-2.5 px-4 text-indigo-700 text-sm font-semibold w-[32.5%]">{bv || "—"}</td>
                      <td className="py-2.5 px-4 text-rose-600 text-sm font-semibold w-[32.5%]">{gv || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Ashtakoot Koots ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h2 className="text-slate-800 font-bold text-base">{t.sub}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">8 Ashtakoot compatibility factors</p>
                </div>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${gradePill(data.grade)}`}>
                  {data.total_score}/36 · {pct}%
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {data.koots.map(k => <KootCard key={k.name} k={k} lang={lang} />)}
              </div>
              {/* Total summary */}
              <div className="mx-4 mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{t.total} Score</p>
                  <p className={`text-4xl font-black leading-none ${gradeTxt(data.grade)}`}>
                    {data.total_score}
                    <span className="text-slate-300 text-lg font-normal ml-1">/36</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold border rounded-xl px-3 py-1.5 ${gradePill(data.grade)}`}>{data.grade}</span>
                  <p className="text-slate-400 text-xs mt-1.5 italic max-w-[140px] text-right leading-snug">{data.recommendation}</p>
                </div>
              </div>
            </div>

            {/* ── Mangal Dosha ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
              <h2 className="text-slate-800 font-bold text-base mb-4">{t.mangalTitle}</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: data.boy_name || "Groom", has: data.boy_mangal_dosha },
                  { name: data.girl_name || "Bride", has: data.girl_mangal_dosha },
                ].map(({ name, has }) => (
                  <div key={name} className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border ${has ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${has ? "bg-red-100" : "bg-emerald-100"}`}>
                      <span className={`text-lg ${has ? "text-red-500" : "text-emerald-500"}`}>{has ? "⚠" : "✓"}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{name}</p>
                      <p className={`text-xs leading-tight mt-0.5 font-medium ${has ? "text-red-600" : "text-emerald-600"}`}>
                        {has ? t.mangalYes : t.mangalNo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {data.mangal_dosha_cancelled && (
                <div className="mt-3 flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-emerald-700 font-semibold text-sm">{t.mangalOff}</p>
                </div>
              )}
              {data.mangal_dosha_note && (
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{data.mangal_dosha_note}</p>
              )}
            </div>

            {/* ── Sadsatkut ── */}
            {(() => {
              const sk = data.sadsatkut;
              type SkKey = "priti_shadashtak"|"mrityu_shadashtak"|"shubh_dvadashatak"|"ashubh_dvadashatak"|"shubh_navpancham"|"nashtan_navpancham";
              type TKey = keyof typeof t;
              const pairGroups: { label: string; sub: string; items: { key: SkKey; titleKey: TKey; descKey: TKey; auspicious: boolean }[] }[] = [
                {
                  label: "Shadashtak",
                  sub: "",
                  items: [
                    { key: "priti_shadashtak",  titleKey: "priti",  descKey: "pritiDesc",  auspicious: true  },
                    { key: "mrityu_shadashtak", titleKey: "mrityu", descKey: "mrityuDesc", auspicious: false },
                  ],
                },
                {
                  label: "Dvadashatak",
                  sub: "",
                  items: [
                    { key: "shubh_dvadashatak",  titleKey: "shubhDva",  descKey: "shubhDvaDesc",  auspicious: true  },
                    { key: "ashubh_dvadashatak", titleKey: "ashubhDva", descKey: "ashubhDvaDesc", auspicious: false },
                  ],
                },
                {
                  label: "Navpancham",
                  sub: "",
                  items: [
                    { key: "shubh_navpancham",   titleKey: "shubhNav",   descKey: "shubhNavDesc",   auspicious: true  },
                    { key: "nashtan_navpancham", titleKey: "nashtanNav", descKey: "nashtanNavDesc", auspicious: false },
                  ],
                },
              ];
              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 mb-2">
                  <h2 className="text-slate-800 font-bold text-base mb-0.5">{t.sadsatkutTitle}</h2>
                  <p className="text-slate-400 text-xs mb-5">{t.sadsatkutSub}</p>
                  <div className="space-y-5">
                    {pairGroups.map(({ label, sub, items }) => (
                      <div key={label}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</p>
                          <span className="text-slate-200">·</span>
                          <p className="text-xs text-slate-400">{sub}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {items.map(({ key, titleKey, descKey, auspicious }) => {
                            const present = sk ? (sk[key] as boolean) : false;
                            const isActive = present && auspicious;
                            const isWarning = present && !auspicious;
                            return (
                              <div
                                key={key}
                                className={`rounded-xl px-3.5 py-3 border transition-all ${
                                  isActive ? "bg-emerald-50 border-emerald-200" :
                                  isWarning ? "bg-red-50 border-red-200" :
                                  "bg-slate-50 border-slate-100"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isActive ? "bg-emerald-200" : isWarning ? "bg-red-200" : "bg-slate-200"
                                  }`}>
                                    <span className={`text-[9px] font-black ${
                                      isActive ? "text-emerald-700" : isWarning ? "text-red-600" : "text-slate-400"
                                    }`}>{present ? "✓" : "–"}</span>
                                  </div>
                                  <p className={`font-bold text-xs leading-tight ${
                                    isActive ? "text-emerald-800" : isWarning ? "text-red-700" : "text-slate-400"
                                  }`}>{t[titleKey] as string}</p>
                                </div>
                                <p className={`text-[11px] leading-snug ml-6 ${
                                  isActive ? "text-emerald-600" : isWarning ? "text-red-500" : "text-slate-400"
                                }`}>{t[descKey] as string}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>{/* end LEFT COLUMN */}

          {/* ════ RIGHT COLUMN ════ */}
          <div className="px-5 sm:px-7 py-6 lg:overflow-y-auto lg:h-full lg:border-l border-slate-100 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-slate-800 font-bold text-base flex items-center gap-2">
                  <span className="text-lg">🪐</span>
                  {chartViewLabel(chartView)}
                </h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setChartDropdownOpen((o) => !o)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-700 transition-colors"
                  >
                    {chartViewLabel(chartView)}
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {chartDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        aria-hidden
                        onClick={() => setChartDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-40 min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden">
                        {(["birth", "moon", "d9"] as MatchChartView[]).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setChartView(v);
                              setChartDropdownOpen(false);
                              if (v === "d9") {
                                setD9Error(null);
                              }
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                              chartView === v ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {chartViewLabel(v)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-5">
                {d9Loading && chartView === "d9" && !displayCharts ? (
                  <div className="flex items-center justify-center py-16 text-slate-500 text-sm font-medium">
                    <svg className="animate-spin h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Loading D9 charts…
                  </div>
                ) : chartView === "d9" && d9Error ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-red-600 text-sm mb-3">{d9Error}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setBoyD9(null);
                        setGirlD9(null);
                        setD9Error(null);
                        void loadD9Charts();
                      }}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : displayCharts ? (
                  [
                    { name: data.boy_name  || "Groom", chart: displayCharts.boy,  accent: "indigo" as const },
                    { name: data.girl_name || "Bride", chart: displayCharts.girl, accent: "rose" as const },
                  ].map(({ name, chart, accent }) => (
                    <div key={name}>
                      <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl ${accent === "indigo" ? "bg-indigo-50" : "bg-rose-50"}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent === "indigo" ? "bg-indigo-500" : "bg-rose-400"}`} />
                        <p className={`text-sm font-bold ${accent === "indigo" ? "text-indigo-700" : "text-rose-600"}`}>{name}</p>
                      </div>
                      <div
                        className={`border-2 rounded-2xl overflow-hidden shadow-sm ${accent === "indigo" ? "border-indigo-100" : "border-rose-100"}`}
                        style={{ aspectRatio: "900/640" }}
                      >
                        <ChartWheel chart={chart} lang={lang} />
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pb-2">
              <p className="text-slate-300 text-xs">{t.footer}</p>
            </div>
          </div>

        </div>
      </div>

      {editError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {editError}
          <button className="ml-3 underline" onClick={() => setEditError(null)}>Dismiss</button>
        </div>
      )}

      {editOpen && editHistoryId && editBoy && editGirl && (
        <FormModal title="Edit match details" onClose={() => setEditOpen(false)} wide>
          <MatchForm
            key={editHistoryId}
            initialBoy={editBoy}
            initialGirl={editGirl}
            persistStorage={false}
            submitLabel="Save changes"
            historyId={editHistoryId}
            onResult={(result) => handleEditSaved(result)}
          />
        </FormModal>
      )}
    </div>
  );
}
