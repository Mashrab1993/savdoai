"""
Fuzzy Matcher - STT natijasidagi tovar va klient nomlarini
DB dagi haqiqiy nomlar bilan solishtiradi va tuzatadi.
"""
from __future__ import annotations

from typing import Optional
import logging

from thefuzz import fuzz, process

logger = logging.getLogger(__name__)


class FuzzyMatcher:
    def __init__(self) -> None:
        self.products: list[str] = []
        self.clients: list[str] = []
        self.product_aliases: dict[str, str] = {}
        self._loaded = False

    async def load_from_db(self, pool) -> None:
        """DB dan tovar va klient nomlarini yuklash."""
        try:
            async with pool.acquire() as conn:
                try:
                    rows = await conn.fetch(
                        "SELECT DISTINCT nomi FROM tovarlar WHERE active = true"
                    )
                except Exception:
                    rows = await conn.fetch("SELECT DISTINCT nomi FROM tovarlar")
                self.products = [r["nomi"] for r in rows if r.get("nomi")]

                try:
                    rows = await conn.fetch(
                        "SELECT DISTINCT ism FROM klientlar WHERE active = true"
                    )
                except Exception:
                    rows = await conn.fetch("SELECT DISTINCT ism FROM klientlar")
                self.clients = [r["ism"] for r in rows if r.get("ism")]

            self.product_aliases.clear()
            for p in self.products:
                p_lower = p.lower()
                self.product_aliases[p_lower] = p
                self.product_aliases[p_lower.replace("e", "a")] = p
                self.product_aliases[p_lower.replace("i", "e")] = p

            self._loaded = True
            logger.info(
                "FuzzyMatcher yuklandi: %d tovar, %d klient",
                len(self.products),
                len(self.clients),
            )
        except Exception as e:
            logger.error("FuzzyMatcher yuklash xatosi: %s", e)

    def match_product(self, raw_name: str, threshold: int = 65) -> Optional[str]:
        if not self.products:
            return None
        raw_lower = raw_name.lower().strip()
        if raw_lower in self.product_aliases:
            return self.product_aliases[raw_lower]

        product_lowers = [p.lower() for p in self.products]
        result = process.extractOne(raw_lower, product_lowers, scorer=fuzz.ratio)
        if result and result[1] >= threshold:
            idx = product_lowers.index(result[0])
            matched = self.products[idx]
            logger.info("Fuzzy product: '%s' -> '%s' (%s%%)", raw_name, matched, result[1])
            return matched
        return None

    def match_client(self, raw_name: str, threshold: int = 60) -> Optional[str]:
        if not self.clients:
            return None
        raw_lower = raw_name.lower().strip()
        client_lowers = [c.lower() for c in self.clients]
        result = process.extractOne(raw_lower, client_lowers, scorer=fuzz.token_sort_ratio)
        if result and result[1] >= threshold:
            idx = client_lowers.index(result[0])
            matched = self.clients[idx]
            logger.info("Fuzzy klient: '%s' -> '%s' (%s%%)", raw_name, matched, result[1])
            return matched
        return None

    def fix_text(self, stt_text: str) -> str:
        if not self._loaded:
            return stt_text
        words = stt_text.split()
        fixed_words: list[str] = []
        i = 0
        while i < len(words):
            word = words[i]
            if word.isdigit():
                fixed_words.append(word)
                i += 1
                continue

            if i + 1 < len(words) and words[i + 1].lower() in (
                "aka",
                "opa",
                "brat",
                "xola",
                "amaki",
            ):
                client_name = f"{word} {words[i + 1]}"
                matched = self.match_client(client_name)
                if matched:
                    fixed_words.append(matched)
                    i += 2
                    continue

            matched_product = self.match_product(word)
            if matched_product:
                fixed_words.append(matched_product)
                i += 1
                continue

            fixed_words.append(word)
            i += 1

        result = " ".join(fixed_words)
        if result != stt_text:
            logger.info("Fuzzy fix: '%s' -> '%s'", stt_text, result)
        return result


fuzzy_matcher = FuzzyMatcher()
