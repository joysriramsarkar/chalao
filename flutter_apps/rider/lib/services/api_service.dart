import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Default server URLs: User's PC Wi-Fi IP and fallback
  static const String defaultLocalUrl = 'http://192.168.31.98:3000/api';
  static const String emulatorUrl = 'http://10.0.2.2:3000/api';
  static const String defaultCloudUrl = 'https://chalao.vercel.app/api';

  static String _cachedBaseUrl = defaultLocalUrl;
  static bool _initialized = false;

  static final _storage = const FlutterSecureStorage();

  static Future<void> init() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString('custom_server_url');
      if (savedUrl != null && savedUrl.trim().isNotEmpty) {
        _cachedBaseUrl = savedUrl.trim();
      } else {
        _cachedBaseUrl = defaultLocalUrl;
      }
    } catch (_) {
      _cachedBaseUrl = defaultLocalUrl;
    }
    _initialized = true;
  }

  static Future<String> getBaseUrl() async {
    if (!_initialized) await init();
    return _cachedBaseUrl;
  }

  static Future<void> setBaseUrl(String newUrl) async {
    final cleanUrl = newUrl.trim().replaceAll(RegExp(r'/+$'), '');
    _cachedBaseUrl = cleanUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_server_url', cleanUrl);
  }

  static Future<bool> testConnection([String? testUrl]) async {
    final target = (testUrl != null && testUrl.isNotEmpty) 
        ? testUrl.trim().replaceAll(RegExp(r'/+$'), '') 
        : await getBaseUrl();
    try {
      // Try /health endpoint first
      final healthUrl = target.endsWith('/api') 
          ? '$target/health' 
          : '$target/api/health';
      final response = await http.get(Uri.parse(healthUrl)).timeout(const Duration(seconds: 4));
      return response.statusCode == 200;
    } catch (_) {
      try {
        // Fallback: ping target root or /api
        final response = await http.get(Uri.parse(target)).timeout(const Duration(seconds: 4));
        return response.statusCode < 500;
      } catch (_) {
        return false;
      }
    }
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: 'chalao_token');
  }

  static Future<void> saveToken(String token) async {
    await _storage.write(key: 'chalao_token', value: token);
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: 'chalao_token');
  }

  static Future<Map<String, String>> _headers({bool auth = false}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // ─── Auth ───────────────────────────────────────

  static Future<Map<String, dynamic>> sendOtp(String phone, {String role = 'rider'}) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: await _headers(),
      body: jsonEncode({'phone': phone, 'role': role}),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> verifyOtp(String phone, String otp, {String role = 'rider'}) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-otp'),
      headers: await _headers(),
      body: jsonEncode({'phone': phone, 'otp': otp, 'role': role}),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getMe() async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _headers(auth: true),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? emergencyContact,
    String? emergencyName,
    String? avatarUrl,
  }) async {
    final baseUrl = await getBaseUrl();
    final response = await http.patch(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        if (name != null) 'name': name,
        if (emergencyContact != null) 'emergencyContact': emergencyContact,
        if (emergencyName != null) 'emergencyName': emergencyName,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      }),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  // ─── Rides ──────────────────────────────────────

  static Future<Map<String, dynamic>> createRide({
    required String pickupAddress,
    required double pickupLat,
    required double pickupLng,
    required String dropoffAddress,
    required double dropoffLat,
    required double dropoffLng,
    required String vehicleType,
    required double estimatedFare,
    required double distanceKm,
    required int durationMin,
    String paymentMethod = 'cash',
  }) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/rides'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'pickupAddress': pickupAddress,
        'pickupLat': pickupLat,
        'pickupLng': pickupLng,
        'dropoffAddress': dropoffAddress,
        'dropoffLat': dropoffLat,
        'dropoffLng': dropoffLng,
        'vehicleType': vehicleType,
        'estimatedFare': estimatedFare,
        'distanceKm': distanceKm,
        'durationMin': durationMin,
        'paymentMethod': paymentMethod,
      }),
    ).timeout(const Duration(seconds: 15));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getRides({int limit = 20, int offset = 0}) async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/rides?limit=$limit&offset=$offset'),
      headers: await _headers(auth: true),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getRide(int rideId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/rides/$rideId'),
      headers: await _headers(auth: true),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateRide(int rideId, Map<String, dynamic> updates) async {
    final baseUrl = await getBaseUrl();
    final response = await http.patch(
      Uri.parse('$baseUrl/rides/$rideId'),
      headers: await _headers(auth: true),
      body: jsonEncode(updates),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  // ─── Driver KYC ─────────────────────────────────

  static Future<Map<String, dynamic>> getDriverKyc() async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/driver/kyc'),
      headers: await _headers(auth: true),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> submitDriverKyc({
    required String licenseNumber,
    required String licenseExpiry,
    required String vehicleType,
    required String vehicleNumber,
    required String vehicleModel,
    required String vehicleYear,
    required String rcNumber,
    required String insuranceExpiry,
    required String aadhaarNumber,
    required String panNumber,
    String? upiId,
    String? bankAccount,
    String? bankIfsc,
  }) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/driver/kyc'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'licenseNumber': licenseNumber,
        'licenseExpiry': licenseExpiry,
        'vehicleType': vehicleType,
        'vehicleNumber': vehicleNumber,
        'vehicleModel': vehicleModel,
        'vehicleYear': vehicleYear,
        'rcNumber': rcNumber,
        'insuranceExpiry': insuranceExpiry,
        'aadhaarNumber': aadhaarNumber,
        'panNumber': panNumber,
        'upiId': upiId,
        'bankAccount': bankAccount,
        'bankIfsc': bankIfsc,
      }),
    ).timeout(const Duration(seconds: 15));
    return _handleResponse(response);
  }

  // ─── Driver Location & Status ────────────────────

  static Future<Map<String, dynamic>> updateLocation({
    required double latitude,
    required double longitude,
    double? heading,
    double? speed,
  }) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/driver/location'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        if (heading != null) 'heading': heading,
        if (speed != null) 'speed': speed,
      }),
    ).timeout(const Duration(seconds: 8));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> setOnlineStatus(bool isOnline) async {
    final baseUrl = await getBaseUrl();
    final response = await http.patch(
      Uri.parse('$baseUrl/driver/location'),
      headers: await _headers(auth: true),
      body: jsonEncode({'isOnline': isOnline}),
    ).timeout(const Duration(seconds: 8));
    return _handleResponse(response);
  }

  // ─── Driver Earnings ─────────────────────────────

  static Future<Map<String, dynamic>> getEarnings({String period = 'today'}) async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/driver/earnings?period=$period'),
      headers: await _headers(auth: true),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> requestPayout(double amount, {String? upiId}) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/driver/earnings'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'amount': amount,
        if (upiId != null) 'upiId': upiId,
      }),
    ).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  // ─── Helper ─────────────────────────────────────

  static Map<String, dynamic> _handleResponse(http.Response response) {
    dynamic data;
    try {
      data = jsonDecode(response.body);
    } catch (_) {
      throw ApiException(
        statusCode: response.statusCode,
        message: 'সার্ভার রেসপন্স বুঝতে সমস্যা হয়েছে (${response.statusCode})',
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data as Map<String, dynamic>;
    }

    throw ApiException(
      statusCode: response.statusCode,
      message: (data is Map && data['error'] != null) ? data['error'].toString() : 'অজানা ত্রুটি (${response.statusCode})',
    );
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => message;
}
