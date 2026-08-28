import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // Change to your production URL when deployed
  static const String baseUrl = 'https://chalao.vercel.app/api';
  // For local development: 'http://10.0.2.2:3000/api' (Android emulator)
  // For physical device: 'http://YOUR_LOCAL_IP:3000/api'

  static final _storage = const FlutterSecureStorage();

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
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: await _headers(),
      body: jsonEncode({'phone': phone, 'role': role}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> verifyOtp(String phone, String otp, {String role = 'rider'}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-otp'),
      headers: await _headers(),
      body: jsonEncode({'phone': phone, 'otp': otp, 'role': role}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getMe() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? emergencyContact,
    String? emergencyName,
  }) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        if (name != null) 'name': name,
        if (emergencyContact != null) 'emergencyContact': emergencyContact,
        if (emergencyName != null) 'emergencyName': emergencyName,
      }),
    );
    return _handleResponse(response);
  }

  // ─── Rides ──────────────────────────────────────

  static Future<Map<String, dynamic>> requestRide({
    required String vehicleType,
    required double pickupLat,
    required double pickupLng,
    required String pickupAddress,
    required double dropoffLat,
    required double dropoffLng,
    required String dropoffAddress,
    required String paymentMethod,
    double distanceKm = 5.0,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rides'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'vehicleType': vehicleType,
        'pickupLat': pickupLat,
        'pickupLng': pickupLng,
        'pickupAddress': pickupAddress,
        'dropoffLat': dropoffLat,
        'dropoffLng': dropoffLng,
        'dropoffAddress': dropoffAddress,
        'paymentMethod': paymentMethod,
        'distanceKm': distanceKm,
      }),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getRides({int limit = 20, int offset = 0}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/rides?limit=$limit&offset=$offset'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getRide(int rideId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/rides/$rideId'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateRide(int rideId, Map<String, dynamic> data) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/rides/$rideId'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return _handleResponse(response);
  }

  // ─── Driver ─────────────────────────────────────

  static Future<Map<String, dynamic>> getKyc() async {
    final response = await http.get(
      Uri.parse('$baseUrl/driver/kyc'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> submitKyc(Map<String, dynamic> kycData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/driver/kyc'),
      headers: await _headers(auth: true),
      body: jsonEncode(kycData),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateLocation({
    required double latitude,
    required double longitude,
    double? heading,
    double? speed,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/driver/location'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        if (heading != null) 'heading': heading,
        if (speed != null) 'speed': speed,
      }),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> setOnlineStatus(bool isOnline) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/driver/location'),
      headers: await _headers(auth: true),
      body: jsonEncode({'isOnline': isOnline}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getEarnings({String period = 'today'}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/driver/earnings?period=$period'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> requestPayout(String upiId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/driver/earnings'),
      headers: await _headers(auth: true),
      body: jsonEncode({'upiId': upiId}),
    );
    return _handleResponse(response);
  }

  // ─── Utils ──────────────────────────────────────

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }
    throw ApiException(
      statusCode: response.statusCode,
      message: data['error'] ?? 'Unknown error',
    );
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
