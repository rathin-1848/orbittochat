# 🚀 Cloudflare Pages & GitHub Deployment Guide
# ক্লাউডফ্লেয়ার পেজেস ও গিটহাবে ডিপ্লয় করার সহজ নির্দেশিকা

এই প্রজেক্টটি **Cloudflare Pages** এবং **GitHub**-এ ১০০% পারফেক্টভাবে চলার জন্য সম্পূর্ণ প্রস্তুত করা হয়েছে। নিচে ধাপে ধাপে নির্দেশনা দেওয়া হলো:

---

## 🇧🇩 বাংলায় সহজ গাইড (Bengali Guide)

### ১. কী কী প্রস্তুত করা হয়েছে?
1. **Cloudflare SPA Routing (`public/_redirects`)**: পেজ রিফ্রেশ করলেও কোনো `404 Not Found` এরর আসবে না।
2. **মোবাইল অপ্টিমাইজেশন (Mobile-Friendly)**:
   - মোবাইল স্ক্রিনে স্বয়ংক্রিয়ভাবে ফুলস্ক্রিন ভিউ।
   - বটমে দ্রুত চ্যাট শুরু করার WhatsApp স্টাইল বাটন।
   - মেসেজ পাঠানোর পর মোবাইলের কীবোর্ড ও ভিউপোর্ট ব্যালেন্স (`100dvh` ও `safe-area-bottom` সাপোর্ট)।
   - ১-ট্যাপে ইনস্ট্যান্ট লগইন (Alice, Bob, Charlie) ও ইমেইল সাইন-ইন।
3. **PWA সাপোর্ট (`manifest.webmanifest` & `favicon.svg`)**: মোবাইলে "Add to Home Screen" করে অ্যাপের মতো চালানো যাবে।
4. **বিল্ট-ইন ফায়ারবেস কনফিগ**: ক্লাউডফ্লেয়ারে কোনো অতিরিক্ত ভ্যারিয়েবল সেট না করলেও স্বয়ংক্রিয়ভাবে লাইভ চ্যাট চলবে।

---

### ২. ধাপ ১: গিটহাবে (GitHub) কোড আপলোড করা

আপনার কম্পিউটারের টার্মিনালে নিচের কমান্ডগুলো চালান:

```bash
# ১. গিট ইনিট ও রিমোট যোগ করুন (যদি আগে না করা থাকে)
git init
git remote add origin https://github.com/আপনার_ইউজারনেম/আপনার_রিপো_নাম.git

# ২. সব ফাইল যোগ করুন
git add .

# ৩. কমিট করুন
git commit -m "Deploy Orbitto Messenger to Cloudflare Pages"

# ৪. মেইন ব্রাঞ্চে পুশ করুন
git branch -M main
git push -u origin main
```

---

### ৩. ধাপ ২: Cloudflare Pages-এ ফ্রিতে রান করা (১০০% ফ্রি)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) এ লগইন করুন (ফ্রি একাউন্ট)।
2. বাম পাশের মেনু থেকে **Workers & Pages** এ যান।
3. **Create application** বাটনে ক্লিক করুন এবং **Pages** ট্যাবটি সিলেক্ট করুন।
4. **Connect to Git** এ ক্লিক করে আপনার GitHub একাউন্ট যুক্ত করুন।
5. আপনার গিটহাব রিপোজিটরিটি সিলেক্ট করুন।
6. **Set up builds and deployments** পেইজে নিচের সেটিংস দিন:
   - **Framework preset**: `Vite` (অথবা `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (ফাঁকা রাখুন)
7. **Save and Deploy** বাটনে ক্লিক করুন!

👉 মাত্র ৩০ থেকে ৬০ সেকেন্ডের মধ্যে আপনার ওয়েবসাইট লাইভ হয়ে যাবে এবং একটি ফ্রি লিংক পাবেন (যেমন: `https://your-app.pages.dev`)।

---

## 🇬🇧 English Deployment Steps

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Configure mobile responsive & Cloudflare Pages"
git branch -M main
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Choose your repository.
4. Set Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

Done! Your app will be live globally on Cloudflare's high-speed CDN with free SSL.
