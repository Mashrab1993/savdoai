package uz.savdoai.data

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow
import java.util.Date

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SAVDOAI — ROOM DATABASE (OFFLINE-FIRST)                        ║
 * ║                                                                  ║
 * ║  SD Agent RealmController (2,907 qator) analogi                 ║
 * ║  Smartup Room DB analogi                                         ║
 * ║                                                                  ║
 * ║  JADVALLAR:                                                      ║
 * ║  • tovarlar     — tovar katalogi                                ║
 * ║  • klientlar    — klient ma'lumotlari                           ║
 * ║  • buyurtmalar  — offline buyurtmalar                           ║
 * ║  • buyurtma_tovarlar — buyurtma tafsilotlari                    ║
 * ║  • sync_queue   — sinxronizatsiya navbati                       ║
 * ║  • checkin_out   — check-in/out qaydlari                       ║
 * ║  • gps_tracks   — GPS lokatsiya tarixi                          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════
//  TYPE CONVERTERS
// ═══════════════════════════════════════════════════════
class Converters {
    @TypeConverter fun fromTimestamp(value: Long?): Date? = value?.let { Date(it) }
    @TypeConverter fun dateToTimestamp(date: Date?): Long? = date?.time
}

// ═══════════════════════════════════════════════════════
//  ENTITIES
// ═══════════════════════════════════════════════════════

@Entity(tableName = "tovarlar")
data class TovarEntity(
    @PrimaryKey val id: Int,
    val nomi: String,
    val shtrix_kod: String? = null,
    val kategoriya: String? = null,
    val brand: String? = null,
    val birlik: String = "dona",
    val sotuv_narx: Double = 0.0,
    val tan_narx: Double = 0.0,
    val qoldiq: Double = 0.0,
    val foto_url: String? = null,
    val sort_index: Int = 0,
    val faol: Boolean = true,
    val oxirgi_sync: Long = System.currentTimeMillis()
)

@Entity(tableName = "klientlar")
data class KlientEntity(
    @PrimaryKey val id: Int,
    val nom: String,
    val telefon: String? = null,
    val manzil: String? = null,
    val kategoriya: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val qarz: Double = 0.0,
    val oxirgi_sotuv: Long? = null,
    val narx_guruh_id: Int? = null,
    val faol: Boolean = true,
    val oxirgi_sync: Long = System.currentTimeMillis()
)

@Entity(tableName = "buyurtmalar")
data class BuyurtmaEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val server_id: Int? = null,
    val klient_id: Int,
    val klient_nomi: String = "",
    val jami_summa: Double = 0.0,
    val tolangan: Double = 0.0,
    val qarz: Double = 0.0,
    val holat: String = "draft",  // draft, confirmed, posted, synced, bekor
    val nasiya: Boolean = false,
    val izoh: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val checkin_id: Int? = null,
    val yaratilgan: Long = System.currentTimeMillis(),
    val synced: Boolean = false
)

@Entity(
    tableName = "buyurtma_tovarlar",
    foreignKeys = [ForeignKey(
        entity = BuyurtmaEntity::class,
        parentColumns = ["id"],
        childColumns = ["buyurtma_id"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class BuyurtmaTovarEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(index = true) val buyurtma_id: Int,
    val tovar_id: Int,
    val tovar_nomi: String,
    val miqdor: Double,
    val narx: Double,
    val summa: Double,
    val chegirma: Double = 0.0
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val turi: String,  // buyurtma, klient, checkin, tolov
    val data_json: String,
    val urinish_soni: Int = 0,
    val max_urinish: Int = 5,
    val holat: String = "kutilmoqda",  // kutilmoqda, yuborilmoqda, yuborildi, xato
    val xato_xabar: String? = null,
    val yaratilgan: Long = System.currentTimeMillis(),
    val oxirgi_urinish: Long? = null
)

@Entity(tableName = "checkin_out")
data class CheckinEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val klient_id: Int,
    val turi: String,  // checkin / checkout
    val latitude: Double? = null,
    val longitude: Double? = null,
    val accuracy: Float? = null,
    val vaqt: Long = System.currentTimeMillis(),
    val izoh: String? = null,
    val synced: Boolean = false
)

@Entity(tableName = "gps_tracks")
data class GpsTrackEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val provider: String = "gps",
    val battery_level: Int = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val synced: Boolean = false
)

// ═══════════════════════════════════════════════════════
//  DAOs
// ═══════════════════════════════════════════════════════

@Dao
interface TovarDao {
    @Query("SELECT * FROM tovarlar WHERE faol = 1 ORDER BY sort_index, nomi")
    fun getAll(): Flow<List<TovarEntity>>

    @Query("SELECT * FROM tovarlar WHERE faol = 1 AND nomi LIKE '%' || :q || '%' ORDER BY nomi")
    fun search(q: String): Flow<List<TovarEntity>>

    @Query("SELECT * FROM tovarlar WHERE shtrix_kod = :barcode LIMIT 1")
    suspend fun findByBarcode(barcode: String): TovarEntity?

    @Query("SELECT * FROM tovarlar WHERE kategoriya = :kat AND faol = 1 ORDER BY nomi")
    fun byKategoriya(kat: String): Flow<List<TovarEntity>>

    @Query("SELECT * FROM tovarlar WHERE qoldiq > 0 AND qoldiq <= 5 AND faol = 1 ORDER BY qoldiq")
    fun kamQoldiq(): Flow<List<TovarEntity>>

    @Query("SELECT DISTINCT kategoriya FROM tovarlar WHERE faol = 1 AND kategoriya IS NOT NULL ORDER BY kategoriya")
    suspend fun kategoriyalar(): List<String>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<TovarEntity>)

    @Query("UPDATE tovarlar SET qoldiq = qoldiq - :miqdor WHERE id = :id")
    suspend fun qoldiqKamaytir(id: Int, miqdor: Double)

    @Query("UPDATE tovarlar SET qoldiq = qoldiq + :miqdor WHERE id = :id")
    suspend fun qoldiqQaytarish(id: Int, miqdor: Double)

    @Query("DELETE FROM tovarlar")
    suspend fun deleteAll()
}

@Dao
interface KlientDao {
    @Query("SELECT * FROM klientlar WHERE faol = 1 ORDER BY nom")
    fun getAll(): Flow<List<KlientEntity>>

    @Query("SELECT * FROM klientlar WHERE nom LIKE '%' || :q || '%' ORDER BY nom")
    fun search(q: String): Flow<List<KlientEntity>>

    @Query("SELECT * FROM klientlar WHERE id = :id LIMIT 1")
    suspend fun getById(id: Int): KlientEntity?

    @Query("SELECT * FROM klientlar WHERE qarz > 0 ORDER BY qarz DESC")
    fun qarzdorlar(): Flow<List<KlientEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<KlientEntity>)

    @Query("DELETE FROM klientlar")
    suspend fun deleteAll()
}

@Dao
interface BuyurtmaDao {
    @Query("SELECT * FROM buyurtmalar ORDER BY yaratilgan DESC")
    fun getAll(): Flow<List<BuyurtmaEntity>>

    @Query("SELECT * FROM buyurtmalar WHERE synced = 0 ORDER BY yaratilgan")
    suspend fun getSyncKerak(): List<BuyurtmaEntity>

    @Query("SELECT * FROM buyurtmalar WHERE id = :id")
    suspend fun getById(id: Int): BuyurtmaEntity?

    @Insert
    suspend fun insert(item: BuyurtmaEntity): Long

    @Update
    suspend fun update(item: BuyurtmaEntity)

    @Query("UPDATE buyurtmalar SET holat = :holat WHERE id = :id")
    suspend fun updateHolat(id: Int, holat: String)

    @Query("UPDATE buyurtmalar SET synced = 1, server_id = :serverId WHERE id = :id")
    suspend fun markSynced(id: Int, serverId: Int)

    @Query("SELECT * FROM buyurtma_tovarlar WHERE buyurtma_id = :buyurtmaId")
    suspend fun getTovarlar(buyurtmaId: Int): List<BuyurtmaTovarEntity>

    @Insert
    suspend fun insertTovar(item: BuyurtmaTovarEntity)

    @Query("DELETE FROM buyurtma_tovarlar WHERE buyurtma_id = :buyurtmaId")
    suspend fun deleteTovarlar(buyurtmaId: Int)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue WHERE holat = 'kutilmoqda' ORDER BY yaratilgan LIMIT :limit")
    suspend fun getPending(limit: Int = 50): List<SyncQueueEntity>

    @Insert
    suspend fun insert(item: SyncQueueEntity): Long

    @Query("UPDATE sync_queue SET holat = :holat, urinish_soni = urinish_soni + 1, oxirgi_urinish = :vaqt, xato_xabar = :xato WHERE id = :id")
    suspend fun updateStatus(id: Int, holat: String, vaqt: Long = System.currentTimeMillis(), xato: String? = null)

    @Query("DELETE FROM sync_queue WHERE holat = 'yuborildi'")
    suspend fun clearCompleted()

    @Query("SELECT COUNT(*) FROM sync_queue WHERE holat = 'kutilmoqda'")
    fun pendingCount(): Flow<Int>
}

@Dao
interface CheckinDao {
    @Insert
    suspend fun insert(item: CheckinEntity): Long

    @Query("SELECT * FROM checkin_out WHERE synced = 0 ORDER BY vaqt")
    suspend fun getUnsynced(): List<CheckinEntity>

    @Query("UPDATE checkin_out SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: Int)

    @Query("SELECT * FROM checkin_out WHERE klient_id = :klientId AND turi = 'checkin' AND vaqt > :bugun ORDER BY vaqt DESC LIMIT 1")
    suspend fun bugungiCheckin(klientId: Int, bugun: Long): CheckinEntity?
}

@Dao
interface GpsTrackDao {
    @Insert
    suspend fun insert(item: GpsTrackEntity)

    @Query("SELECT * FROM gps_tracks WHERE synced = 0 ORDER BY timestamp LIMIT 100")
    suspend fun getUnsynced(): List<GpsTrackEntity>

    @Query("UPDATE gps_tracks SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<Int>)

    @Query("DELETE FROM gps_tracks WHERE synced = 1 AND timestamp < :before")
    suspend fun cleanOld(before: Long)
}

// ═══════════════════════════════════════════════════════
//  DATABASE
// ═══════════════════════════════════════════════════════

@Database(
    entities = [
        TovarEntity::class,
        KlientEntity::class,
        BuyurtmaEntity::class,
        BuyurtmaTovarEntity::class,
        SyncQueueEntity::class,
        CheckinEntity::class,
        GpsTrackEntity::class,
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class SavdoAIDatabase : RoomDatabase() {
    abstract fun tovarDao(): TovarDao
    abstract fun klientDao(): KlientDao
    abstract fun buyurtmaDao(): BuyurtmaDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun checkinDao(): CheckinDao
    abstract fun gpsTrackDao(): GpsTrackDao

    companion object {
        @Volatile private var INSTANCE: SavdoAIDatabase? = null

        fun getInstance(context: Context): SavdoAIDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    SavdoAIDatabase::class.java,
                    "savdoai_db"
                ).fallbackToDestructiveMigration().build().also { INSTANCE = it }
            }
        }
    }
}
