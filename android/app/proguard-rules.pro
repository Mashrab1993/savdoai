-keep class uz.savdoai.print.** { *; }

# BluetoothPrinter fallback: reflection-based createRfcommSocket
-keepclassmembers class android.bluetooth.BluetoothDevice {
    public java.lang.reflect.Method createRfcommSocket(int);
}

# Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Enum safety
-keepclassmembers enum * { *; }
