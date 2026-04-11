package uz.savdoai.ui

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import kotlinx.coroutines.flow.collectAsState
import kotlinx.coroutines.launch
import uz.savdoai.data.*
import uz.savdoai.data.repository.SavdoAIRepository

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SAVDOAI v25.4.0 — JETPACK COMPOSE UI                           ║
 * ║                                                                  ║
 * ║  Material 3 Design — 5 ta asosiy ekran:                         ║
 * ║  1. Dashboard  — bugungi statistika + live feed                 ║
 * ║  2. Buyurtma   — tovar tanlash + savat + tasdiqlash             ║
 * ║  3. Klientlar  — ro'yxat + qidiruv + qarz                      ║
 * ║  4. Tovarlar   — grid ko'rinish + barcode + qoldiq              ║
 * ║  5. Profil     — gamification + sync + sozlamalar               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════
//  BRAND RANGLAR — Material 3 Expressive
// ═══════════════════════════════════════════════════════
val SavdoGreen      = Color(0xFF059669)
val SavdoGreenLight = Color(0xFF10B981)
val SavdoGreenDark  = Color(0xFF047857)
val SavdoBg         = Color(0xFFF8FAFC)
val SavdoCard       = Color.White
val SavdoRed        = Color(0xFFDC2626)
val SavdoAmber      = Color(0xFFD97706)
val SavdoBlue       = Color(0xFF3B82F6)
val SavdoViolet     = Color(0xFF7C3AED)
val SavdoBgDark     = Color(0xFF0B0F14)
val SavdoCardDark   = Color(0xFF121820)

private val LightColors = lightColorScheme(
    primary          = SavdoGreen,
    onPrimary        = Color.White,
    primaryContainer = Color(0xFFD1FAE5),
    onPrimaryContainer = SavdoGreenDark,
    secondary        = SavdoBlue,
    onSecondary      = Color.White,
    tertiary         = SavdoViolet,
    onTertiary       = Color.White,
    background       = SavdoBg,
    onBackground     = Color(0xFF0F172A),
    surface          = SavdoCard,
    onSurface        = Color(0xFF0F172A),
    surfaceVariant   = Color(0xFFEEF2F7),
    onSurfaceVariant = Color(0xFF475569),
    error            = SavdoRed,
    outline          = Color(0xFFE2E8F0),
    outlineVariant   = Color(0xFFF1F5F9),
)

private val DarkColors = darkColorScheme(
    primary          = SavdoGreenLight,
    onPrimary        = Color(0xFF052E1F),
    primaryContainer = SavdoGreenDark,
    onPrimaryContainer = Color(0xFFD1FAE5),
    secondary        = Color(0xFF60A5FA),
    onSecondary      = Color(0xFF0B1220),
    tertiary         = Color(0xFFA78BFA),
    onTertiary       = Color(0xFF1E1B4B),
    background       = SavdoBgDark,
    onBackground     = Color(0xFFE2E8F0),
    surface          = SavdoCardDark,
    onSurface        = Color(0xFFE2E8F0),
    surfaceVariant   = Color(0xFF1B2430),
    onSurfaceVariant = Color(0xFF94A3B8),
    error            = Color(0xFFF87171),
    outline          = Color(0xFF1E293B),
    outlineVariant   = Color(0xFF0F172A),
)

@Composable
private fun SavdoTheme(
    dynamicColor: Boolean = true,
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val colors = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (darkTheme) androidx.compose.material3.dynamicDarkColorScheme(context)
            else           androidx.compose.material3.dynamicLightColorScheme(context)
        darkTheme -> DarkColors
        else      -> LightColors
    }
    MaterialTheme(colorScheme = colors, content = content)
}

// ═══════════════════════════════════════════════════════
//  MAIN ACTIVITY (Compose entry point)
// ═══════════════════════════════════════════════════════
class SavdoMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Splash screen API 31+ (soft-fallback below via theme)
        installSplashScreen()
        // Edge-to-edge immersive (content behind status + nav bars)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(
                lightScrim = android.graphics.Color.TRANSPARENT,
                darkScrim  = android.graphics.Color.TRANSPARENT,
            ),
        )
        super.onCreate(savedInstanceState)
        val repo = SavdoAIRepository.getInstance(applicationContext)
        setContent {
            SavdoTheme {
                SavdoApp(repo)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
//  APP SCAFFOLD + BOTTOM NAV
// ═══════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SavdoApp(repo: SavdoAIRepository) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf(
        Triple("Bosh sahifa", Icons.Filled.Home, Icons.Outlined.Home),
        Triple("Buyurtma", Icons.Filled.ShoppingCart, Icons.Outlined.ShoppingCart),
        Triple("Klientlar", Icons.Filled.People, Icons.Outlined.People),
        Triple("Tovarlar", Icons.Filled.Inventory2, Icons.Outlined.Inventory2),
        Triple("Profil", Icons.Filled.Person, Icons.Outlined.Person),
    )

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = SavdoCard) {
                tabs.forEachIndexed { i, (label, filled, outlined) ->
                    NavigationBarItem(
                        selected = selectedTab == i,
                        onClick = { selectedTab = i },
                        icon = { Icon(if (selectedTab == i) filled else outlined, label) },
                        label = { Text(label, fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = SavdoGreen,
                            selectedTextColor = SavdoGreen,
                            indicatorColor = Color(0xFFD1FAE5),
                        )
                    )
                }
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when (selectedTab) {
                0 -> DashboardScreen(repo)
                1 -> OrderScreen(repo)
                2 -> ClientsScreen(repo)
                3 -> ProductsScreen(repo)
                4 -> ProfileScreen(repo)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
//  1. DASHBOARD SCREEN
// ═══════════════════════════════════════════════════════
@Composable
fun DashboardScreen(repo: SavdoAIRepository) {
    val scope = rememberCoroutineScope()
    var syncing by remember { mutableStateOf(false) }
    val pendingCount by repo.pendingCount().collectAsState(initial = 0)
    val kamQoldiq by repo.kamQoldiq().collectAsState(initial = emptyList())

    LazyColumn(
        Modifier.fillMaxSize().background(SavdoBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Header
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("SavdoAI", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = SavdoGreen)
                    Text("Bugungi holat", fontSize = 13.sp, color = Color.Gray)
                }
                // Sync button
                FilledTonalButton(
                    onClick = {
                        syncing = true
                        scope.launch {
                            repo.fullSync()
                            syncing = false
                        }
                    },
                    enabled = !syncing
                ) {
                    if (syncing) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Icon(Icons.Default.Sync, "Sync", Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(if (syncing) "..." else "Sync", fontSize = 12.sp)
                }
            }
        }

        // Pending sync badge
        if (pendingCount > 0) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)), shape = RoundedCornerShape(12.dp)) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudQueue, "", tint = SavdoAmber, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("$pendingCount ta buyurtma serverga yuborilmagan", fontSize = 13.sp, color = SavdoAmber)
                    }
                }
            }
        }

        // Stat cards row
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCard("💰", "Bugun", "0", SavdoGreen, Modifier.weight(1f))
                StatCard("📦", "Buyurtma", "0", SavdoBlue, Modifier.weight(1f))
                StatCard("👥", "Klient", "0", Color(0xFF8B5CF6), Modifier.weight(1f))
            }
        }

        // Kam qoldiq
        if (kamQoldiq.isNotEmpty()) {
            item {
                Text("⚠️ Kam qoldiqli tovarlar", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
            items(kamQoldiq.take(5)) { tovar ->
                Card(shape = RoundedCornerShape(10.dp), colors = CardDefaults.cardColors(containerColor = SavdoCard)) {
                    Row(Modifier.padding(12.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(tovar.nomi, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                        Text("${tovar.qoldiq.toInt()} qoldi",
                            fontSize = 12.sp, fontWeight = FontWeight.Bold,
                            color = if (tovar.qoldiq <= 2) SavdoRed else SavdoAmber)
                    }
                }
            }
        }
    }
}

@Composable
fun StatCard(emoji: String, label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(modifier, shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = SavdoCard)) {
        Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(emoji, fontSize = 22.sp)
            Spacer(Modifier.height(4.dp))
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = color)
            Text(label, fontSize = 11.sp, color = Color.Gray)
        }
    }
}

// ═══════════════════════════════════════════════════════
//  2. ORDER SCREEN (buyurtma yaratish)
// ═══════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderScreen(repo: SavdoAIRepository) {
    val tovarlar by repo.getTovarlar().collectAsState(initial = emptyList())
    val klientlar by repo.getKlientlar().collectAsState(initial = emptyList())
    var search by remember { mutableStateOf("") }
    var selectedKlient by remember { mutableStateOf<KlientEntity?>(null) }
    var cart by remember { mutableStateOf<List<CartItem>>(emptyList()) }
    var showKlientPicker by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    data class CartItem(val tovar: TovarEntity, var miqdor: Double = 1.0) {
        val summa get() = tovar.sotuv_narx * miqdor
    }

    val filtered = if (search.isBlank()) tovarlar else tovarlar.filter {
        it.nomi.contains(search, ignoreCase = true) || it.shtrix_kod?.contains(search) == true
    }

    Column(Modifier.fillMaxSize().background(SavdoBg)) {
        // Top bar
        Surface(color = SavdoCard, shadowElevation = 2.dp) {
            Column(Modifier.padding(16.dp)) {
                // Klient tanlash
                OutlinedCard(
                    onClick = { showKlientPicker = true },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Person, "", tint = SavdoGreen, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(selectedKlient?.nom ?: "Klient tanlang...", fontSize = 14.sp,
                            color = if (selectedKlient != null) Color.Black else Color.Gray)
                    }
                }

                Spacer(Modifier.height(8.dp))

                // Tovar qidirish
                OutlinedTextField(
                    value = search, onValueChange = { search = it },
                    placeholder = { Text("🔍 Tovar qidirish yoki barcode...", fontSize = 13.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SavdoGreen)
                )
            }
        }

        // Cart summary
        if (cart.isNotEmpty()) {
            Surface(color = Color(0xFFD1FAE5)) {
                Row(Modifier.padding(12.dp, 8.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("🛒 ${cart.size} tovar", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Text("${cart.sumOf { it.summa }.toLong().toString().reversed().chunked(3).joinToString(",").reversed()} so'm",
                        fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SavdoGreenDark)
                }
            }
        }

        // Product list
        LazyColumn(
            Modifier.weight(1f),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(filtered) { tovar ->
                val inCart = cart.any { it.tovar.id == tovar.id }
                Card(
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (inCart) Color(0xFFECFDF5) else SavdoCard
                    ),
                    onClick = {
                        cart = if (inCart) cart.filter { it.tovar.id != tovar.id }
                        else cart + CartItem(tovar)
                    }
                ) {
                    Row(Modifier.padding(12.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        // Product info
                        Column(Modifier.weight(1f)) {
                            Text(tovar.nomi, fontSize = 14.sp, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("${tovar.sotuv_narx.toLong()} so'm", fontSize = 12.sp, color = SavdoGreen, fontWeight = FontWeight.SemiBold)
                                Text("Qoldiq: ${tovar.qoldiq.toInt()}", fontSize = 11.sp,
                                    color = if (tovar.qoldiq <= 5) SavdoRed else Color.Gray)
                            }
                        }
                        // Cart indicator
                        if (inCart) {
                            Icon(Icons.Default.CheckCircle, "", tint = SavdoGreen, modifier = Modifier.size(24.dp))
                        }
                    }
                }
            }
        }

        // Confirm button
        if (cart.isNotEmpty() && selectedKlient != null) {
            Button(
                onClick = {
                    scope.launch {
                        val items = cart.map { c ->
                            BuyurtmaTovarEntity(
                                buyurtma_id = 0, tovar_id = c.tovar.id, tovar_nomi = c.tovar.nomi,
                                miqdor = c.miqdor, narx = c.tovar.sotuv_narx, summa = c.summa
                            )
                        }
                        repo.buyurtmaYaratish(selectedKlient!!.id, selectedKlient!!.nom, items)
                        cart = emptyList()
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(12.dp).height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SavdoGreen)
            ) {
                Text("✅ TASDIQLASH — ${cart.sumOf { it.summa }.toLong()} so'm", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
//  3. CLIENTS SCREEN
// ═══════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientsScreen(repo: SavdoAIRepository) {
    var search by remember { mutableStateOf("") }
    val klientlar by (if (search.isBlank()) repo.getKlientlar() else repo.searchKlientlar(search))
        .collectAsState(initial = emptyList())

    Column(Modifier.fillMaxSize().background(SavdoBg)) {
        Surface(color = SavdoCard, shadowElevation = 2.dp) {
            OutlinedTextField(
                value = search, onValueChange = { search = it },
                placeholder = { Text("🔍 Klient qidirish...", fontSize = 13.sp) },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                singleLine = true, shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SavdoGreen)
            )
        }

        LazyColumn(
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(klientlar) { k ->
                Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = SavdoCard)) {
                    Row(Modifier.padding(14.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        // Avatar
                        Box(
                            Modifier.size(42.dp).clip(CircleShape)
                                .background(Brush.linearGradient(listOf(SavdoGreenLight, SavdoGreen))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(k.nom.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(k.nom, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                            Text(k.telefon ?: k.manzil ?: "", fontSize = 12.sp, color = Color.Gray)
                        }
                        if (k.qarz > 0) {
                            Column(horizontalAlignment = Alignment.End) {
                                Text("${k.qarz.toLong()} so'm", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SavdoRed)
                                Text("qarz", fontSize = 10.sp, color = SavdoRed)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
//  4. PRODUCTS SCREEN (Grid + Stock)
// ═══════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsScreen(repo: SavdoAIRepository) {
    var search by remember { mutableStateOf("") }
    val tovarlar by (if (search.isBlank()) repo.getTovarlar() else repo.searchTovarlar(search))
        .collectAsState(initial = emptyList())

    Column(Modifier.fillMaxSize().background(SavdoBg)) {
        Surface(color = SavdoCard, shadowElevation = 2.dp) {
            OutlinedTextField(
                value = search, onValueChange = { search = it },
                placeholder = { Text("🔍 Tovar yoki barcode...", fontSize = 13.sp) },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                singleLine = true, shape = RoundedCornerShape(10.dp),
            )
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(tovarlar.size) { i ->
                val t = tovarlar[i]
                val stockColor = when {
                    t.qoldiq <= 0 -> SavdoRed
                    t.qoldiq <= 5 -> SavdoAmber
                    else -> SavdoGreen
                }
                Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = SavdoCard)) {
                    Column(Modifier.padding(12.dp)) {
                        // Stock badge
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = stockColor.copy(alpha = 0.1f)
                            ) {
                                Text("${t.qoldiq.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.Bold,
                                    color = stockColor, modifier = Modifier.padding(4.dp, 2.dp))
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(t.nomi, fontSize = 13.sp, fontWeight = FontWeight.Medium, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Spacer(Modifier.height(2.dp))
                        Text(t.kategoriya ?: "", fontSize = 10.sp, color = Color.Gray)
                        Spacer(Modifier.height(6.dp))
                        Text("${t.sotuv_narx.toLong()} so'm", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SavdoGreen)
                    }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
//  5. PROFILE SCREEN (Gamification + Sync)
// ═══════════════════════════════════════════════════════
@Composable
fun ProfileScreen(repo: SavdoAIRepository) {
    val scope = rememberCoroutineScope()
    val pendingCount by repo.pendingCount().collectAsState(initial = 0)

    LazyColumn(
        Modifier.fillMaxSize().background(SavdoBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Gamification card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SavdoGreen)
            ) {
                Column(Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🌟", fontSize = 28.sp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Yangi sotuvchi", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text("Daraja 1", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    LinearProgressIndicator(
                        progress = { 0.3f },
                        modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                        color = Color.White,
                        trackColor = Color.White.copy(alpha = 0.2f),
                    )
                    Spacer(Modifier.height(4.dp))
                    Text("70 XP kerak keyingi darajaga", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp)
                }
            }
        }

        // Sync status
        item {
            Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = SavdoCard)) {
                Column(Modifier.padding(16.dp)) {
                    Text("🔄 Sinxronizatsiya", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Kutilayotgan", fontSize = 13.sp, color = Color.Gray)
                        Text("$pendingCount ta", fontSize = 13.sp, fontWeight = FontWeight.Bold,
                            color = if (pendingCount > 0) SavdoAmber else SavdoGreen)
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = { scope.launch { repo.fullSync() } },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SavdoGreen)
                    ) { Text("Hozir sync qilish") }
                }
            }
        }

        // Menu items
        item { Text("Sozlamalar", fontWeight = FontWeight.SemiBold, fontSize = 15.sp) }
        val menuItems = listOf(
            Triple("🖨️", "Printer sozlash", "Bluetooth printer ulash"),
            Triple("📍", "GPS tracking", "Lokatsiya kuzatish"),
            Triple("⚙️", "Server sozlamalari", "Config boshqarish"),
            Triple("📊", "Sync loglar", "Sinxronizatsiya tarixi"),
            Triple("ℹ️", "Ilova haqida", "SavdoAI v2.0.0"),
        )
        items(menuItems.size) { i ->
            val (emoji, title, subtitle) = menuItems[i]
            Card(shape = RoundedCornerShape(10.dp), colors = CardDefaults.cardColors(containerColor = SavdoCard)) {
                Row(Modifier.padding(14.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(emoji, fontSize = 20.sp)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                        Text(subtitle, fontSize = 11.sp, color = Color.Gray)
                    }
                    Icon(Icons.Default.ChevronRight, "", tint = Color.Gray, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}
