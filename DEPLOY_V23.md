# SavdoAI v23.0 — Railway deploy

## Muhim

GitHub repodagi kod **eski**. v23.0 kodi **savdoai_v23.zip** ichida. ZIP ni repo root ga qo'ying, keyin quyidagilarni bajaring.

---

## Qadam 1: ZIP dan kodni repo ga yozish (Windows PowerShell)

ZIP faylni avval **savdoai** papkasiga nusxalang (masalan: `savdoai_v23.zip`).

```powershell
cd "C:\Users\Mashrab Hacker\OneDrive\Desktop\savdoai"

# 1) Eski fayllarni o'chirish (.git qolsin)
Get-ChildItem -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force

# 2) ZIP ni ochish (savdoai_v23.zip nomini o'z ZIP ingizga qarab o'zgartiring)
Expand-Archive -Path .\savdoai_v23.zip -DestinationPath . -Force

# 3) merged/ ichidagini root ga ko'chirish
Copy-Item -Path .\merged\* -Destination . -Recurse -Force
Copy-Item -Path .\merged\.python-version -Destination . -Force -ErrorAction SilentlyContinue
Remove-Item -Path .\merged -Recurse -Force -ErrorAction SilentlyContinue

# 4) Tekshiruv (Git Bash kerak: bash verify_deploy.sh)
bash verify_deploy.sh

# 5) Barcha ✅ bo'lsa — push
git add -A
git commit -m "SavdoAI v23.0"
git push origin main --force
```

Agar **bash** bo'lmasa — 4-qadamni o'tkazing; 5-qadamda `git add -A`, commit, push qiling.

---

## Qadam 2: Railway sozlash

- Railway.com → **savdoai-production**
- Eski servislar crash bo'lsa: o'chiring (Postgres + Redis qolsin), New → GitHub Repo
- **savdoai-api** va **savdoai-bot** uchun Variables: DATABASE_URL, REDIS_URL, JWT_SECRET / BOT_TOKEN, **PYTHONPATH=/app**, DB_MIN=2, DB_MAX=10

---

## Qadam 3: Tekshirish

- https://savdoai-production.up.railway.app/health → `"version":"23.0"`
- @savdoai_mashrab_bot → /start
