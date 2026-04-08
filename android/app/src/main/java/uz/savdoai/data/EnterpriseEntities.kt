package uz.savdoai.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SAVDOAI — ENTERPRISE ENTITIES & DAOs                        ║
 * ║  Task, Photo, Equipment — SD Agent gaps to'ldirish           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════
//  TOPSHIRIQ (SD Agent Task analog)
// ═══════════════════════════════════════════════════════
@Entity(tableName = "topshiriqlar_local")
data class TopshiriqEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val server_id: Int? = null,
    val sarlavha: String,
    val tavsif: String = "",
    val turi: String = "umumiy",
    val muhimlik: String = "oddiy",
    val holat: String = "yangi",
    val klient_id: Int? = null,
    val klient_nomi: String = "",
    val muddat: String? = null,
    val bajarilgan_vaqt: Long? = null,
    val natija: String? = null,
    val foto_url: String? = null,
    val synced: Boolean = false,
    val yaratilgan: Long = System.currentTimeMillis()
)

@Dao
interface TopshiriqDao {
    @Query("SELECT * FROM topshiriqlar_local ORDER BY CASE muhimlik WHEN 'kritik' THEN 0 WHEN 'yuqori' THEN 1 ELSE 2 END, yaratilgan DESC")
    fun getAll(): Flow<List<TopshiriqEntity>>

    @Query("SELECT * FROM topshiriqlar_local WHERE holat IN ('yangi', 'jarayonda') ORDER BY yaratilgan DESC")
    fun getActive(): Flow<List<TopshiriqEntity>>

    @Query("SELECT COUNT(*) FROM topshiriqlar_local WHERE holat IN ('yangi', 'jarayonda')")
    fun activeCount(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<TopshiriqEntity>)

    @Query("UPDATE topshiriqlar_local SET holat = :holat, bajarilgan_vaqt = :vaqt, natija = :natija WHERE id = :id")
    suspend fun updateHolat(id: Int, holat: String, vaqt: Long? = null, natija: String? = null)

    @Query("SELECT * FROM topshiriqlar_local WHERE synced = 0")
    suspend fun getUnsynced(): List<TopshiriqEntity>

    @Query("UPDATE topshiriqlar_local SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: Int)
}

// ═══════════════════════════════════════════════════════
//  FOTO (SD Agent Photo analog)
// ═══════════════════════════════════════════════════════
@Entity(tableName = "fotolar_local")
data class FotoEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val turi: String,  // klient, tovar, vitrina, topshiriq
    val bog_id: Int = 0,
    val fayl_path: String,  // lokal fayl yo'li
    val fayl_url: String? = null,  // server URL (sync keyin)
    val latitude: Double? = null,
    val longitude: Double? = null,
    val izoh: String = "",
    val synced: Boolean = false,
    val yaratilgan: Long = System.currentTimeMillis()
)

@Dao
interface FotoDao {
    @Query("SELECT * FROM fotolar_local WHERE turi = :turi AND bog_id = :bogId ORDER BY yaratilgan DESC")
    fun getByRef(turi: String, bogId: Int): Flow<List<FotoEntity>>

    @Insert
    suspend fun insert(item: FotoEntity): Long

    @Query("SELECT * FROM fotolar_local WHERE synced = 0 ORDER BY yaratilgan LIMIT 20")
    suspend fun getUnsynced(): List<FotoEntity>

    @Query("UPDATE fotolar_local SET synced = 1, fayl_url = :url WHERE id = :id")
    suspend fun markSynced(id: Int, url: String)
}

// ═══════════════════════════════════════════════════════
//  USKUNA (SD Agent ClientEquipment analog)
// ═══════════════════════════════════════════════════════
@Entity(tableName = "uskunalar_local")
data class UskunaEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val server_id: Int? = null,
    val klient_id: Int,
    val nomi: String,
    val turi: String = "muzlatgich",
    val seriya_raqami: String = "",
    val inventar_raqami: String = "",
    val holat: String = "faol",
    val foto_url: String? = null,
    val izoh: String = "",
    val synced: Boolean = false
)

@Dao
interface UskunaDao {
    @Query("SELECT * FROM uskunalar_local WHERE klient_id = :klientId ORDER BY nomi")
    fun getByKlient(klientId: Int): Flow<List<UskunaEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<UskunaEntity>)

    @Query("UPDATE uskunalar_local SET holat = :holat WHERE id = :id")
    suspend fun updateHolat(id: Int, holat: String)

    @Query("SELECT COUNT(*) FROM uskunalar_local")
    fun totalCount(): Flow<Int>
}

// ═══════════════════════════════════════════════════════
//  KUNLIK KASSA
// ═══════════════════════════════════════════════════════
@Entity(tableName = "kunlik_kassa_local")
data class KassaEntity(
    @PrimaryKey val sana: String, // "2026-04-08"
    val naqd_kirim: Double = 0.0,
    val karta_kirim: Double = 0.0,
    val qarz_yigildi: Double = 0.0,
    val xarajat: Double = 0.0,
    val yakuniy_qoldiq: Double = 0.0
)

@Dao
interface KassaDao {
    @Query("SELECT * FROM kunlik_kassa_local ORDER BY sana DESC LIMIT 30")
    fun getRecent(): Flow<List<KassaEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: KassaEntity)
}
