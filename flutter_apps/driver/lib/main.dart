import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/phone_input_screen.dart';
import 'screens/otp_verify_screen.dart';
import 'screens/kyc_onboarding_screen.dart';
import 'screens/kyc_pending_screen.dart';
import 'screens/cockpit_screen.dart';
import 'screens/incoming_ride_screen.dart';
import 'screens/active_trip_screen.dart';
import 'screens/earnings_screen.dart';
import 'screens/profile_screen.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => DriverAppState(),
      child: const ChalaoDriverApp(),
    ),
  );
}

class ChalaoDriverApp extends StatelessWidget {
  const ChalaoDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chalao Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A), // Dark navy — driver cockpit
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        fontFamily: 'Poppins',
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Color(0xFF1E293B),
          foregroundColor: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF22D3EE),
            foregroundColor: const Color(0xFF0F172A),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            minimumSize: const Size.fromHeight(54),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF1E293B),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFF22D3EE), width: 2),
          ),
          labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
        ),
        cardTheme: const CardThemeData(
          color: Color(0xFF1E293B),
          elevation: 0,
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (ctx) => const SplashScreen(),
        '/phone': (ctx) => const PhoneInputScreen(),
        '/otp': (ctx) => const OtpVerifyScreen(),
        '/kyc': (ctx) => const KycOnboardingScreen(),
        '/kyc-pending': (ctx) => const KycPendingScreen(),
        '/cockpit': (ctx) => const CockpitScreen(),
        '/incoming-ride': (ctx) => const IncomingRideScreen(),
        '/active-trip': (ctx) => const ActiveTripScreen(),
        '/earnings': (ctx) => const EarningsScreen(),
        '/profile': (ctx) => const ProfileScreen(),
      },
    );
  }
}

class DriverAppState extends ChangeNotifier {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _driverProfile;
  bool _isLoading = true;
  bool _isOnline = false;
  Map<String, dynamic>? _currentRide;
  Map<String, dynamic>? _incomingRide;
  Map<String, dynamic>? _earnings;

  Map<String, dynamic>? get user => _user;
  Map<String, dynamic>? get driverProfile => _driverProfile;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  bool get isOnline => _isOnline;
  Map<String, dynamic>? get currentRide => _currentRide;
  Map<String, dynamic>? get incomingRide => _incomingRide;
  Map<String, dynamic>? get earnings => _earnings;

  String get kycStatus => _driverProfile?['kyc_status'] as String? ?? 'pending';

  void setUser(Map<String, dynamic> user, Map<String, dynamic>? profile) {
    _user = user;
    _driverProfile = profile;
    notifyListeners();
  }

  void setOnline(bool online) {
    _isOnline = online;
    notifyListeners();
  }

  void setCurrentRide(Map<String, dynamic>? ride) {
    _currentRide = ride;
    notifyListeners();
  }

  void setIncomingRide(Map<String, dynamic>? ride) {
    _incomingRide = ride;
    notifyListeners();
  }

  void setEarnings(Map<String, dynamic>? e) {
    _earnings = e;
    notifyListeners();
  }

  void logout() {
    _user = null;
    _driverProfile = null;
    _currentRide = null;
    _incomingRide = null;
    _isOnline = false;
    ApiService.clearToken();
    notifyListeners();
  }

  Future<void> tryAutoLogin() async {
    _isLoading = true;
    notifyListeners();
    try {
      final token = await ApiService.getToken();
      if (token != null) {
        final result = await ApiService.getMe();
        _user = result['user'] as Map<String, dynamic>?;
        _driverProfile = result['driverProfile'] as Map<String, dynamic>?;
      }
    } catch (_) {
      await ApiService.clearToken();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
