import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/phone_input_screen.dart';
import 'screens/otp_verify_screen.dart';
import 'screens/profile_setup_screen.dart';
import 'screens/home_screen.dart';
import 'screens/ride_request_screen.dart';
import 'screens/active_ride_screen.dart';
import 'screens/trip_completed_screen.dart';
import 'screens/trip_history_screen.dart';
import 'screens/profile_screen.dart';
import 'services/api_service.dart';
import 'models/user_model.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(),
      child: const ChalaoRiderApp(),
    ),
  );
}

class ChalaoRiderApp extends StatelessWidget {
  const ChalaoRiderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chalao Rider',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6C3DF4), // Deep purple — Chalao brand
          brightness: Brightness.light,
        ),
        fontFamily: 'Poppins',
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF1A1A2E),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6C3DF4),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            minimumSize: const Size.fromHeight(54),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF8F7FF),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFE2E0FF)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFE2E0FF)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFF6C3DF4), width: 2),
          ),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (ctx) => const SplashScreen(),
        '/phone': (ctx) => const PhoneInputScreen(),
        '/otp': (ctx) => const OtpVerifyScreen(),
        '/profile-setup': (ctx) => const ProfileSetupScreen(),
        '/home': (ctx) => const HomeScreen(),
        '/ride-request': (ctx) => const RideRequestScreen(),
        '/active-ride': (ctx) => const ActiveRideScreen(),
        '/trip-completed': (ctx) => const TripCompletedScreen(),
        '/trip-history': (ctx) => const TripHistoryScreen(),
        '/profile': (ctx) => const ProfileScreen(),
      },
    );
  }
}

// Global app state
class AppState extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = true;
  Map<String, dynamic>? _currentRide;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  Map<String, dynamic>? get currentRide => _currentRide;

  void setUser(UserModel user) {
    _user = user;
    notifyListeners();
  }

  void setCurrentRide(Map<String, dynamic>? ride) {
    _currentRide = ride;
    notifyListeners();
  }

  void logout() {
    _user = null;
    _currentRide = null;
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
        _user = UserModel.fromJson(result['user'] as Map<String, dynamic>);
      }
    } catch (_) {
      await ApiService.clearToken();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
