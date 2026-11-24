# Capacitor discovers plugins by their generated class references and runtime annotations.
# Keep plugin entry points while allowing the rest of the app and dependencies to be
# optimized, shrunk, and renamed by R8.
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

-keep public class br.com.finsavior.MainActivity

-keepclassmembers class * extends com.getcapacitor.Plugin {
    public <init>();
    @com.getcapacitor.PluginMethod <methods>;
}

-keep public class * extends com.getcapacitor.Plugin {
    public <init>();
}

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve native method entry points used by bundled platform libraries.
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}
