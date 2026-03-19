// ─── SavdoAI Bilingual Translation System ────────────────────────────────────
// Default: Uzbek (Latin) | Secondary: Russian
// Designed for easy FastAPI integration later.

export type Locale = "uz" | "ru"

export const translations = {
  // ── App ──────────────────────────────────────────────────────────────────────
  appName: { uz: "SavdoAI", ru: "SavdoAI" },
  tagline: {
    uz: "O'zbek biznesiga mo'ljallangan aqlli boshqaruv tizimi",
    ru: "Умная система управления для бизнеса Узбекистана",
  },

  // ── Navigation ───────────────────────────────────────────────────────────────
  nav: {
    dashboard:   { uz: "Boshqaruv paneli",           ru: "Панель управления" },
    clients:     { uz: "Mijozlar",                   ru: "Клиенты" },
    products:    { uz: "Mahsulotlar / Ombor",        ru: "Товары / Склад" },
    debts:       { uz: "Qarzdorliklar",              ru: "Долги" },
    invoices:    { uz: "Savdolar / Hisob-fakturalar", ru: "Продажи / Счета" },
    reports:     { uz: "Hisobotlar",                 ru: "Отчеты" },
    apprentices: { uz: "Shogirdlar",                 ru: "Сотрудники" },
    expenses:    { uz: "Xarajatlar",                 ru: "Расходы" },
    prices:      { uz: "Narxlar",                    ru: "Цены" },
    cash:        { uz: "Kassa",                      ru: "Касса" },
    settings:    { uz: "Sozlamalar",                 ru: "Настройки" },
    collapse:    { uz: "Yig'ish",                    ru: "Свернуть" },
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    search:        { uz: "Qidirish...",           ru: "Поиск..." },
    notifications: { uz: "Bildirishnomalar",      ru: "Уведомления" },
    profile:       { uz: "Profil",                ru: "Профиль" },
    payment:       { uz: "To'lov",                ru: "Оплата" },
    team:          { uz: "Jamoa",                 ru: "Команда" },
    signout:       { uz: "Chiqish",               ru: "Выйти" },
  },

  // ── Login ────────────────────────────────────────────────────────────────────
  login: {
    title:          { uz: "Xush kelibsiz",                               ru: "Добро пожаловать" },
    subtitle:       { uz: "Davom etish uchun hisobingizga kiring",        ru: "Войдите в свой аккаунт для продолжения" },
    telegramBtn:    { uz: "Telegram orqali kirish",                       ru: "Войти через Telegram" },
    telegramNote:   { uz: "Xavfsiz va tez — telefon raqami talab qilinmaydi", ru: "Безопасно и быстро — номер телефона не требуется" },
    adminDivider:   { uz: "yoki admin hisobi bilan",                      ru: "или войти как администратор" },
    email:          { uz: "Email",                                        ru: "Email" },
    password:       { uz: "Parol",                                        ru: "Пароль" },
    forgotPassword: { uz: "Parolni unutdingizmi?",                        ru: "Забыли пароль?" },
    remember:       { uz: "Meni eslab qolish",                            ru: "Запомнить меня" },
    signinBtn:      { uz: "Kirish",                                       ru: "Войти" },
    signingIn:      { uz: "Kirilmoqda...",                                ru: "Вход..." },
    demoNote:       { uz: "Demo: istalgan email va parol (6+ belgi)",     ru: "Демо: любой email и пароль (6+ символов)" },
    emailRequired:  { uz: "Email kiritish shart",                         ru: "Введите email" },
    emailInvalid:   { uz: "To'g'ri email kiriting",                       ru: "Введите корректный email" },
    passwordRequired: { uz: "Parol kiritish shart",                       ru: "Введите пароль" },
    passwordShort:  { uz: "Parol kamida 6 ta belgidan iborat bo'lishi kerak", ru: "Пароль должен содержать не менее 6 символов" },
    stat1Label:     { uz: "Faol mijozlar",                                ru: "Активные клиенты" },
    stat2Label:     { uz: "Savdo hajmi",                                  ru: "Объём продаж" },
    stat3Label:     { uz: "Mahsulotlar",                                  ru: "Товаров" },
    stat4Label:     { uz: "Hisobotlar",                                   ru: "Отчётов" },
    copyright:      { uz: "© 2025 SavdoAI. Barcha huquqlar himoyalangan.", ru: "© 2025 SavdoAI. Все права защищены." },
  },

  // ── Common actions ───────────────────────────────────────────────────────────
  actions: {
    add:         { uz: "Qo'shish",              ru: "Добавить" },
    edit:        { uz: "Tahrirlash",            ru: "Изменить" },
    delete:      { uz: "O'chirish",             ru: "Удалить" },
    save:        { uz: "Saqlash",               ru: "Сохранить" },
    cancel:      { uz: "Bekor qilish",          ru: "Отмена" },
    confirm:     { uz: "Tasdiqlash",            ru: "Подтвердить" },
    reject:      { uz: "Rad etish",             ru: "Отклонить" },
    export:      { uz: "Eksport",               ru: "Экспорт" },
    filter:      { uz: "Filtr",                 ru: "Фильтр" },
    search:      { uz: "Qidirish",              ru: "Поиск" },
    viewAll:     { uz: "Barchasini ko'rish",    ru: "Посмотреть все" },
    create:      { uz: "Yaratish",              ru: "Создать" },
    close:       { uz: "Yopish",               ru: "Закрыть" },
    markPaid:    { uz: "To'langan deb belgilash", ru: "Отметить как оплаченный" },
    approve:     { uz: "Tasdiqlash",            ru: "Одобрить" },
    back:        { uz: "Orqaga",               ru: "Назад" },
  },

  // ── Common fields ────────────────────────────────────────────────────────────
  fields: {
    name:        { uz: "Ism",                  ru: "Имя" },
    fullName:    { uz: "To'liq ism",           ru: "Полное имя" },
    email:       { uz: "Email",                ru: "Email" },
    phone:       { uz: "Telefon",              ru: "Телефон" },
    company:     { uz: "Kompaniya",            ru: "Компания" },
    status:      { uz: "Holat",                ru: "Статус" },
    date:        { uz: "Sana",                 ru: "Дата" },
    dueDate:     { uz: "Muddat",               ru: "Срок" },
    amount:      { uz: "Summa",                ru: "Сумма" },
    paid:        { uz: "To'langan",            ru: "Оплачено" },
    balance:     { uz: "Qoldiq",              ru: "Остаток" },
    notes:       { uz: "Izoh",                 ru: "Примечание" },
    category:    { uz: "Kategoriya",           ru: "Категория" },
    price:       { uz: "Narx",                 ru: "Цена" },
    stock:       { uz: "Ombor",               ru: "Склад" },
    description: { uz: "Tavsif",              ru: "Описание" },
    total:       { uz: "Jami",                ru: "Итого" },
    subtotal:    { uz: "Jami (soliqsiz)",      ru: "Итого (без налога)" },
    tax:         { uz: "Soliq",               ru: "Налог" },
    actions:     { uz: "Amallar",             ru: "Действия" },
  },

  // ── Status labels ────────────────────────────────────────────────────────────
  status: {
    active:       { uz: "Faol",                ru: "Активный" },
    inactive:     { uz: "Nofaol",              ru: "Неактивный" },
    prospect:     { uz: "Potentsial",          ru: "Потенциальный" },
    inStock:      { uz: "Mavjud",              ru: "В наличии" },
    lowStock:     { uz: "Kam qoldi",           ru: "Заканчивается" },
    outOfStock:   { uz: "Tugagan",             ru: "Нет в наличии" },
    pending:      { uz: "Kutilmoqda",          ru: "Ожидает" },
    overdue:      { uz: "Muddati o'tgan",      ru: "Просрочено" },
    paid:         { uz: "To'langan",           ru: "Оплачено" },
    partial:      { uz: "Qisman",              ru: "Частично" },
    draft:        { uz: "Qoralama",            ru: "Черновик" },
    sent:         { uz: "Yuborilgan",          ru: "Отправлен" },
    approved:     { uz: "Tasdiqlangan",        ru: "Одобрено" },
    rejected:     { uz: "Rad etilgan",         ru: "Отклонено" },
  },

  // ── Dashboard ────────────────────────────────────────────────────────────────
  dashboard: {
    title:           { uz: "Boshqaruv paneli",        ru: "Панель управления" },
    totalRevenue:    { uz: "Jami daromad",            ru: "Общий доход" },
    activeClients:   { uz: "Faol mijozlar",           ru: "Активные клиенты" },
    totalDebt:       { uz: "To'lanmagan qarz",        ru: "Непогашенный долг" },
    overdueCount:    { uz: "Muddati o'tgan",          ru: "Просроченных" },
    vsLastMonth:     { uz: "o'tgan oyga nisbatan",    ru: "по сравнению с прошлым месяцем" },
    revenueChart:    { uz: "Daromad va xarajatlar",   ru: "Доходы и расходы" },
    last8Months:     { uz: "So'nggi 8 oy",            ru: "Последние 8 месяцев" },
    byCategory:      { uz: "Kategoriya bo'yicha daromad", ru: "Доход по категориям" },
    categoryBreak:   { uz: "Mahsulot turi bo'yicha taqsimot", ru: "Распределение по типам продуктов" },
    recentActivity:  { uz: "So'nggi faoliyat",        ru: "Последние действия" },
    quickActions:    { uz: "Tezkor amallar",           ru: "Быстрые действия" },
    createInvoice:   { uz: "Hisob-faktura yaratish",  ru: "Создать счёт" },
    addClient:       { uz: "Mijoz qo'shish",          ru: "Добавить клиента" },
    addProduct:      { uz: "Mahsulot qo'shish",       ru: "Добавить товар" },
    viewReports:     { uz: "Hisobotlarni ko'rish",    ru: "Просмотреть отчёты" },
    recentInvoices:  { uz: "So'nggi hisob-fakturalar", ru: "Последние счета" },
    revenue:         { uz: "Daromad",                 ru: "Доход" },
    expenses:        { uz: "Xarajatlar",              ru: "Расходы" },
  },

  // ── Clients ──────────────────────────────────────────────────────────────────
  clients: {
    title:         { uz: "Mijozlar",                  ru: "Клиенты" },
    totalClients:  { uz: "Jami mijozlar",             ru: "Всего клиентов" },
    totalRevenue:  { uz: "Jami daromad",              ru: "Общий доход" },
    outstandingDebt: { uz: "To'lanmagan qarz",        ru: "Непогашенный долг" },
    searchPlaceholder: { uz: "Mijozlarni qidirish...", ru: "Поиск клиентов..." },
    addClient:     { uz: "Mijoz qo'shish",            ru: "Добавить клиента" },
    allStatus:     { uz: "Barcha holat",              ru: "Все статусы" },
    client:        { uz: "Mijoz",                     ru: "Клиент" },
    purchases:     { uz: "Xaridlar",                  ru: "Покупки" },
    debt:          { uz: "Qarz",                      ru: "Долг" },
    noClients:     { uz: "Mijoz topilmadi.",           ru: "Клиенты не найдены." },
    editClient:    { uz: "Mijozni tahrirlash",         ru: "Изменить клиента" },
    addNewClient:  { uz: "Yangi mijoz qo'shish",      ru: "Добавить нового клиента" },
    saveChanges:   { uz: "O'zgarishlarni saqlash",    ru: "Сохранить изменения" },
    namePlaceholder:    { uz: "Jasur Toshmatov",       ru: "Иван Иванов" },
    emailPlaceholder:   { uz: "jasur@kompaniya.uz",    ru: "ivan@kompaniya.ru" },
    phonePlaceholder:   { uz: "+998 90 123-4567",      ru: "+7 999 123-4567" },
    companyPlaceholder: { uz: "Akme MChJ",             ru: "ООО Акме" },
  },

  // ── Products ─────────────────────────────────────────────────────────────────
  products: {
    title:           { uz: "Mahsulotlar / Ombor",       ru: "Товары / Склад" },
    inStock:         { uz: "Mavjud",                    ru: "В наличии" },
    lowStock:        { uz: "Kam qoldi",                 ru: "Заканчивается" },
    outOfStock:      { uz: "Tugagan",                   ru: "Нет в наличии" },
    searchPlaceholder: { uz: "Nomi yoki SKU bo'yicha qidirish...", ru: "Поиск по названию или артикулу..." },
    addProduct:      { uz: "Mahsulot qo'shish",         ru: "Добавить товар" },
    all:             { uz: "Barchasi",                  ru: "Все" },
    product:         { uz: "Mahsulot",                  ru: "Товар" },
    noProducts:      { uz: "Mahsulot topilmadi.",       ru: "Товары не найдены." },
    editProduct:     { uz: "Mahsulotni tahrirlash",     ru: "Изменить товар" },
    addNewProduct:   { uz: "Yangi mahsulot qo'shish",   ru: "Добавить новый товар" },
    productName:     { uz: "Mahsulot nomi",             ru: "Название товара" },
    lowThreshold:    { uz: "Kam ombor chegarasi",       ru: "Порог низкого запаса" },
    saveChanges:     { uz: "O'zgarishlarni saqlash",    ru: "Сохранить изменения" },
  },

  // ── Debts ────────────────────────────────────────────────────────────────────
  debts: {
    title:           { uz: "Qarzdorliklar",             ru: "Долги" },
    totalOutstanding: { uz: "Jami qoldiq",             ru: "Общий остаток" },
    overdue:         { uz: "Muddati o'tgan",            ru: "Просрочено" },
    paidThisMonth:   { uz: "Bu oy to'langan",           ru: "Оплачено в этом месяце" },
    searchPlaceholder: { uz: "Mijoz yoki hisob-faktura bo'yicha qidirish...", ru: "Поиск по клиенту или счёту..." },
    allStatus:       { uz: "Barcha holat",              ru: "Все статусы" },
    invoiceRef:      { uz: "Hisob-faktura",             ru: "Счёт" },
    noDebts:         { uz: "Qarzdorlik yozuvlari topilmadi.", ru: "Записи о долгах не найдены." },
    debtDetails:     { uz: "Qarz tafsilotlari",         ru: "Детали долга" },
    paymentHistory:  { uz: "To'lov tarixi",             ru: "История оплат" },
    noPayments:      { uz: "Hozircha to'lovlar qayd etilmagan.", ru: "Платежи ещё не записаны." },
    noteLabel:       { uz: "Izoh",                      ru: "Примечание" },
  },

  // ── Invoices ─────────────────────────────────────────────────────────────────
  invoices: {
    title:           { uz: "Savdolar / Hisob-fakturalar", ru: "Продажи / Счета" },
    totalRevenue:    { uz: "Jami daromad",              ru: "Общий доход" },
    paid:            { uz: "To'langan",                 ru: "Оплачено" },
    pending:         { uz: "Kutilmoqda",                ru: "Ожидает" },
    overdue:         { uz: "Muddati o'tgan",            ru: "Просрочено" },
    searchPlaceholder: { uz: "Hisob-fakturalarni qidirish...", ru: "Поиск счетов..." },
    allStatus:       { uz: "Barcha holat",              ru: "Все статусы" },
    createInvoice:   { uz: "Hisob-faktura yaratish",    ru: "Создать счёт" },
    invoiceNo:       { uz: "Hisob-faktura #",           ru: "Счёт #" },
    issueDate:       { uz: "Sana",                      ru: "Дата выдачи" },
    noInvoices:      { uz: "Hisob-faktura topilmadi.",  ru: "Счета не найдены." },
    newInvoice:      { uz: "Yangi hisob-faktura yaratish", ru: "Создать новый счёт" },
    selectClient:    { uz: "Mijozni tanlang...",        ru: "Выберите клиента..." },
    lineItems:       { uz: "Mahsulot qatorlari",        ru: "Позиции" },
    addItem:         { uz: "Qator qo'shish",            ru: "Добавить позицию" },
    qty:             { uz: "Soni",                      ru: "Кол-во" },
    unitPrice:       { uz: "Birlik narx",               ru: "Цена за ед." },
    descPlaceholder: { uz: "Tavsif",                    ru: "Описание" },
    issueLabel:      { uz: "Sana",                      ru: "Дата" },
    dueLabel:        { uz: "Muddat",                    ru: "Срок" },
  },

  // ── Reports ──────────────────────────────────────────────────────────────────
  reports: {
    title:           { uz: "Hisobotlar",                ru: "Отчёты" },
    last8months:     { uz: "So'nggi 8 oy",              ru: "Последние 8 месяцев" },
    lastYear:        { uz: "O'tgan yil",                ru: "Прошлый год" },
    ytd:             { uz: "Yil boshidan",              ru: "С начала года" },
    exportReport:    { uz: "Hisobotni yuklab olish",    ru: "Скачать отчёт" },
    totalRevenue:    { uz: "Jami daromad",              ru: "Общий доход" },
    activeClients:   { uz: "Faol mijozlar",             ru: "Активные клиенты" },
    totalProducts:   { uz: "Jami mahsulotlar",          ru: "Всего товаров" },
    avgOrder:        { uz: "O'rtacha buyurtma",         ru: "Средний заказ" },
    monthlyRevenue:  { uz: "Oylik daromad",             ru: "Ежемесячный доход" },
    revenuePerMonth: { uz: "Oylik daromad (so'm)",      ru: "Ежемесячный доход (сум)" },
    revenueVsExp:    { uz: "Daromad va xarajatlar",     ru: "Доходы и расходы" },
    profitTrend:     { uz: "Foyda o'sish tendentsiyasi", ru: "Тенденция прибыли" },
    topClients:      { uz: "Eng yaxshi mijozlar",       ru: "Лучшие клиенты" },
    topClientsSub:   { uz: "Xarid qiymati bo'yicha",   ru: "По объёму покупок" },
    byCategory:      { uz: "Kategoriya bo'yicha daromad", ru: "Доход по категориям" },
    categoryDist:    { uz: "Mahsulot turi taqsimoti",   ru: "Распределение по категориям" },
    revenue:         { uz: "Daromad",                   ru: "Доход" },
    expenses:        { uz: "Xarajatlar",                ru: "Расходы" },
    sales:           { uz: "Sotuv",                     ru: "Продажи" },
  },

  // ── Apprentices ──────────────────────────────────────────────────────────────
  apprentices: {
    title:          { uz: "Shogirdlar",                ru: "Сотрудники" },
    totalStaff:     { uz: "Jami shogirdlar",           ru: "Всего сотрудников" },
    activeStaff:    { uz: "Faol shogirdlar",           ru: "Активных сотрудников" },
    monthlyBudget:  { uz: "Oylik limit",               ru: "Ежемесячный лимит" },
    todayExpenses:  { uz: "Bugungi xarajat",           ru: "Расход сегодня" },
    searchPlaceholder: { uz: "Shogird qidirish...",    ru: "Поиск сотрудника..." },
    addApprentice:  { uz: "Shogird qo'shish",          ru: "Добавить сотрудника" },
    allStatus:      { uz: "Barcha holat",              ru: "Все статусы" },
    staffMember:    { uz: "Xodim",                     ru: "Сотрудник" },
    dailyLimit:     { uz: "Kunlik limit",              ru: "Дневной лимит" },
    monthlyLimit:   { uz: "Oylik limit",               ru: "Месячный лимит" },
    spent:          { uz: "Sarflangan",                ru: "Потрачено" },
    noStaff:        { uz: "Shogird topilmadi.",        ru: "Сотрудники не найдены." },
    details:        { uz: "Shogird tafsilotlari",      ru: "Детали сотрудника" },
    recentExpenses: { uz: "So'nggi xarajatlar",        ru: "Последние расходы" },
  },

  // ── Expenses ─────────────────────────────────────────────────────────────────
  expenses: {
    title:           { uz: "Xarajatlar",               ru: "Расходы" },
    todayExpenses:   { uz: "Bugungi xarajatlar",       ru: "Расходы сегодня" },
    monthlyExpenses: { uz: "Oylik xarajatlar",         ru: "Расходы за месяц" },
    pendingApprovals: { uz: "Kutilayotgan tasdiqlar",  ru: "Ожидают подтверждения" },
    totalCategories: { uz: "Kategoriyalar",            ru: "Категории" },
    searchPlaceholder: { uz: "Xarajatlarni qidirish...", ru: "Поиск расходов..." },
    addExpense:      { uz: "Xarajat qo'shish",         ru: "Добавить расход" },
    allCategories:   { uz: "Barcha kategoriyalar",     ru: "Все категории" },
    allStatus:       { uz: "Barcha holat",             ru: "Все статусы" },
    expenseTitle:    { uz: "Xarajat",                  ru: "Расход" },
    requestedBy:     { uz: "So'ragan",                 ru: "Запросил" },
    approvedBy:      { uz: "Tasdiqlagan",              ru: "Подтвердил" },
    noExpenses:      { uz: "Xarajat topilmadi.",       ru: "Расходы не найдены." },
    approveAction:   { uz: "Tasdiqlash",               ru: "Одобрить" },
    rejectAction:    { uz: "Rad etish",                ru: "Отклонить" },
  },

  // ── Prices ───────────────────────────────────────────────────────────────────
  prices: {
    title:          { uz: "Narxlar",                   ru: "Цены" },
    priceGroups:    { uz: "Narx guruhlari",            ru: "Ценовые группы" },
    addGroup:       { uz: "Guruh qo'shish",            ru: "Добавить группу" },
    groupName:      { uz: "Guruh nomi",                ru: "Название группы" },
    discount:       { uz: "Chegirma",                  ru: "Скидка" },
    clientsCount:   { uz: "Mijozlar soni",             ru: "Кол-во клиентов" },
    assignClients:  { uz: "Mijozlarni biriktirish",    ru: "Назначить клиентов" },
    noGroups:       { uz: "Narx guruhi topilmadi.",    ru: "Ценовые группы не найдены." },
    searchPlaceholder: { uz: "Narx guruhini qidirish...", ru: "Поиск ценовой группы..." },
    addPriceGroup:  { uz: "Narx guruhi qo'shish",      ru: "Добавить ценовую группу" },
  },

  // ── Cash ─────────────────────────────────────────────────────────────────────
  cash: {
    title:          { uz: "Kassa",                     ru: "Касса" },
    balance:        { uz: "Kassa qoldig'i",            ru: "Остаток в кассе" },
    income:         { uz: "Bugungi kirim",             ru: "Приход сегодня" },
    outcome:        { uz: "Bugungi chiqim",            ru: "Расход сегодня" },
    transactions:   { uz: "Tranzaksiyalar",            ru: "Транзакции" },
    searchPlaceholder: { uz: "Tranzaksiyalarni qidirish...", ru: "Поиск транзакций..." },
    addOperation:   { uz: "Operatsiya qo'shish",       ru: "Добавить операцию" },
    allTypes:       { uz: "Barcha tur",                ru: "Все типы" },
    income_type:    { uz: "Kirim",                     ru: "Приход" },
    outcome_type:   { uz: "Chiqim",                    ru: "Расход" },
    type:           { uz: "Tur",                       ru: "Тип" },
    noTransactions: { uz: "Tranzaksiya topilmadi.",    ru: "Транзакции не найдены." },
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  settings: {
    title:          { uz: "Sozlamalar",                ru: "Настройки" },
    profile:        { uz: "Profil",                    ru: "Профиль" },
    company:        { uz: "Kompaniya",                 ru: "Компания" },
    notifications:  { uz: "Bildirishnomalar",          ru: "Уведомления" },
    security:       { uz: "Xavfsizlik",               ru: "Безопасность" },
    language:       { uz: "Til",                       ru: "Язык" },
    profileSettings: { uz: "Profil sozlamalari",       ru: "Настройки профиля" },
    profileSubtitle: { uz: "Shaxsiy ma'lumotlaringizni yangilang", ru: "Обновите личные данные" },
    saveProfile:    { uz: "Profilni saqlash",          ru: "Сохранить профиль" },
  },

  // ── Empty / Loading ──────────────────────────────────────────────────────────
  empty: {
    noData:         { uz: "Ma'lumot topilmadi",        ru: "Данные не найдены" },
    noDataSub:      { uz: "Hozircha ko'rsatiladigan ma'lumot yo'q", ru: "Пока нет данных для отображения" },
  },

  // ── Activity & Time ───────────────────────────────────────────────────────────
  time: {
    minsAgo:        { uz: "daqiqa oldin",              ru: "минут назад" },
    hoursAgo:       { uz: "soat oldin",                ru: "часов назад" },
    daysAgo:        { uz: "kun oldin",                 ru: "дней назад" },
    yesterday:      { uz: "Kecha",                     ru: "Вчера" },
    today:          { uz: "Bugun",                     ru: "Сегодня" },
  },

  activity: {
    paymentReceived: { uz: "to'lov qabul qilindi",            ru: "платеж получен" },
    partialPayment:  { uz: "qisman to'lov olindi",            ru: "частичный платеж получен" },
    invoiceCreated:  { uz: "yaratildi",                       ru: "создано" },
    invoiceSent:     { uz: "yuborildi",                       ru: "отправлено" },
    invoiceOverdue:  { uz: "muddati o'tdi",                   ru: "просрочено" },
    clientAdded:     { uz: "Yangi mijoz",                     ru: "Новый клиент" },
    registered:      { uz: "ro'yxatga olindi",                ru: "зарегистрирован" },
    lowStock:        { uz: "omborda kam qoldi",               ru: "низкий запас" },
    newFrom:         { uz: "dan to'lov qabul qilindi",        ru: "получен платеж от" },
    for:             { uz: "uchun",                           ru: "для" },
  },
} as const

export type TranslationKey = keyof typeof translations

// Helper to get a translated string
export function t(
  locale: Locale,
  section: keyof typeof translations,
  key: string
): string {
  const sec = translations[section] as Record<string, Record<Locale, string>>
  return sec?.[key]?.[locale] ?? key
}
