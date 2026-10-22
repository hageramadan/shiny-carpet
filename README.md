# Shiny Carpet — Shiny Carpet

مشروع مستقل لتصميم موقع غسيل السجاد والبطاطين، عربي RTL باستخدام Next.js App Router وTypeScript وTailwind CSS وreact-icons وخط Cairo محلي.

## التشغيل

```sh
npm install
npm run dev
```

المعاينة: http://localhost:3001. على Windows يمكن تشغيل start-dev.cmd مباشرة بعد تثبيت المكتبات. لو أمر npm غير متاح استخدم: node node_modules/next/dist/bin/next dev --port 3001

```sh
npm run typecheck
npm run build
npm start
```

## تقسيم الملفات

- app/: الصفحات وبيانات SEO وملف CSS الرئيسي.
- components/: shell للهيدر والفوتر، store للبيانات الة، shop للخدمات والسلة، account للحساب والعناوين، orders لإتمام الطلب والتتبع، ui لعناصر مشتركة بسيطة.
- lib/data.ts: الخدمات والأسعار والأنواع المشتركة.
- public/: الصور وملفات خط Cairo.

## الصفحات

/ · /login · /register · /profile · /addresses · /products · /products/carpet · /products/blanket · /cart · /checkout · /order-confirmation · /tracking · /orders

## البيانات الة

السلة والعناوين والملف الشخصي والطلبات محفوظة في localStorage على نفس المتصفح. الدخول شكلي فقط، لا توجد مصادقة أو دفع أو إشعارات فعلية. التحقق بالهاتف معاينة فقط ولا تُرسل رسائل SMS. خدمة البحث عن الأماكن هي الاتصال الخارجي الخاص بالعناوين. استخدم بيانات وهمية أثناء المعاينة. كل الأسعار والطلبات ة، والتتبع يعرض المرحلة الأولى فقط لحين الربط. لا توجد تقييمات أو أرقام عملاء وهمية.

## SEO قبل النشر

عناوين وأوصاف صفحات الخدمة مع canonical وOpen Graph وTwitter، HTML عربي على الخادم وsitemap.xml وrobots.txt. صفحات الحساب والشراء والتتبع مستبعدة من الفهرسة. انسخ .env.example إلى .env.local وغيّر NEXT_PUBLIC_SITE_URL للدومين الحقيقي قبل البناء والنشر. ترتيب البحث يعتمد على المحتوى الحقيقي والدومين والأداء والربط؛ لا توجد ضمانات ترتيب.

## الربط لاحقًا

استبدل localStorage في components/store.tsx بمصدر بيانات حقيقي، وأضف المصادقة والتحقق من الأسعار والمقاسات ومواعيد الخدمة على الخادم. ملف data.ts يحتوي أسعارًا ة بالجنيه المصري؛ يمكن تغيير العملة والخدمات هناك.

## الأصول

الصور من Unsplash: https://images.unsplash.com/photo-1600210492486-724fe5c67fb0، وصورة التفاصيل https://images.unsplash.com/photo-1600369672770-985fd30004eb. الخط Cairo من Google Fonts تحت SIL Open Font License. صورة الشعار المستخدمة موجودة في public/images/logo1.png.

## مكوّنات الصفحة الرئيسية

كل قسم موجود في ملف مستقل داخل components/home/: Hero، Services، Steps، WhyUs، DownloadApp، ChooseYourService، FAQ، OrderCTA. مكوّن PhoneMockup مشترك لمعاينات التطبيق التوضيحية.

الفوتر موجود في components/layout/Footer.tsx، وصورة الشعار المشتركة في components/layout/Logo.tsx. الصفحة app/page.tsx تجمع الأقسام بالترتيب فقط، بجانب بيانات SEO.

بيانات التواصل وروابط السوشيال يمكن ضبطها من متغيرات .env.example وإعادة البناء. عند غيابها يظهر تنويه قريبًا بدون روابط وهمية. أزرار متاجر التطبيق للعرض فقط لحين توفير روابط التحميل الحقيقية.


## العناوين والخريطة

العناوين في `/addresses`، والإضافة في `/addresses/new`، والتعديل في `/addresses/[id]/edit`. يتم حفظ الإحداثيات وتفاصيل المبنى والدور والشقة محليًا، مع دعم السجلات القديمة. العنوان الافتراضي يُستخدم في الملف الشخصي وإتمام الطلب، وحذفه يعيّن أول عنوان متبقٍ افتراضيًا؛ لا تتغير عناوين الطلبات السابقة.

الخريطة تستخدم Leaflet وبيانات OpenStreetMap، والبحث عبر Photon من مسار `/api/locations`. البحث يحدث عند الضغط على زر البحث، وتُخزّن نتائجه مؤقتًا مع تقليل معدل الطلبات. يمكن تغيير خادم Photon عبر `GEOCODING_BASE_URL`. الخادم العام مناسب للمعاينة محدودة الاستخدام ولا يضمن التوافر: https://github.com/komoot/photon#demo-server. استخدام خرائط OpenStreetMap يخضع لسياسة البلاطات: https://operations.osmfoundation.org/policies/tiles/.

الموقع الحالي يحتاج إذن المتصفح، ويعمل عبر HTTPS أو localhost. لا يُطلب الموقع تلقائيًا؛ يمكن البحث عن أي مكان أو اختيار نقطة وسحب العلامة. راجع تفاصيل العنوان المقترحة قبل الحفظ، خصوصًا رقم المبنى والدور والشقة. هذه واجهة ة؛ لا تُنشئ طلب توصيل حقيقيًا.
"# shiny-carpet" 
