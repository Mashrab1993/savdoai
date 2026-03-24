package uz.savdoai.print

import android.app.Application
import android.content.pm.ApplicationInfo

class SavdoAIApp : Application() {
    override fun onCreate() {
        super.onCreate()
        PrintLog.setDebuggable((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0)
    }
}
